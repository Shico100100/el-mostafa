import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { PurchaseReturn } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { Currency } from './entities/currency.entity';
import { FxRate } from './entities/fx-rate.entity';
import { Container } from './entities/container.entity';
import { PackingList } from './entities/packing-list.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { RawMaterial } from '../manufacturing/entities/raw-material.entity';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private orderRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private orderItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(SupplierPayment)
    private paymentRepo: Repository<SupplierPayment>,
    @InjectRepository(PurchaseReturn)
    private returnRepo: Repository<PurchaseReturn>,
    @InjectRepository(PurchaseReturnItem)
    private returnItemRepo: Repository<PurchaseReturnItem>,
    @InjectRepository(Currency)
    private currencyRepo: Repository<Currency>,
    @InjectRepository(FxRate)
    private fxRateRepo: Repository<FxRate>,
    @InjectRepository(Container)
    private containerRepo: Repository<Container>,
    @InjectRepository(PackingList)
    private packingListRepo: Repository<PackingList>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(RawMaterial)
    private rawMaterialRepo: Repository<RawMaterial>,
    private inventoryService: InventoryService,
    private accountingService: AccountingService,
    private dataSource: DataSource,
  ) {}

  // Suppliers
  async getAllSuppliers() {
    return this.supplierRepo.find();
  }

  async getSupplier(id: number) {
    return this.supplierRepo.findOne({ where: { id } });
  }

  async createSupplier(data: Partial<Supplier>) {
    const supplier = this.supplierRepo.create(data);
    return this.supplierRepo.save(supplier);
  }

  async updateSupplier(id: number, data: Partial<Supplier>) {
    await this.supplierRepo.update(id, data);
    return this.supplierRepo.findOne({ where: { id } });
  }

  async deleteSupplier(id: number) {
    return this.supplierRepo.delete(id);
  }

  // Purchase Orders
  async getAllOrders(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      fromDate?: string;
      toDate?: string;
    } = {},
  ) {
    const { page = 1, limit = 10, search, fromDate, toDate } = options;
    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.supplier', 'supplier')
      .orderBy('order.created_at', 'DESC');

    if (search) {
      query.andWhere(
        '(supplier.name LIKE :search OR order.invoice_number LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (fromDate) {
      query.andWhere('order.order_date >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('order.order_date <= :toDate', { toDate });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrder(id: number) {
    return this.orderRepo.findOne({
      where: { id },
      relations: ['supplier'],
    });
  }

  async createOrder(data: {
    supplier_id: number;
    total_amount: number;
    notes?: string;
    order_date?: string;
    invoice_number?: string;
    items: any[];
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = queryRunner.manager.create(PurchaseOrder, {
        supplier_id: data.supplier_id,
        total_amount: data.total_amount,
        notes: data.notes,
        invoice_number: data.invoice_number,
        order_date: data.order_date ? new Date(data.order_date) : new Date(),
      });
      const savedOrder = await queryRunner.manager.save(PurchaseOrder, order);

      for (const item of data.items) {
        const orderItem = queryRunner.manager.create(PurchaseOrderItem, {
          order_id: savedOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        });
        await queryRunner.manager.save(PurchaseOrderItem, orderItem);

        // Add stock movement (IN) to the main warehouse (warehouse_id = 1)
        await this.inventoryService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: 1, // Main warehouse
            type: 'IN' as any,
            quantity: item.quantity,
            notes: `شراء - أمر رقم ${savedOrder.id}`,
            date: savedOrder.order_date,
          },
          queryRunner.manager,
        );

        // Update raw material last_purchase_price if the product is RAW
        const poProduct = await queryRunner.manager.findOne(Product, {
          where: { id: item.product_id },
        });
        if (poProduct?.type === 'RAW') {
          const rawMat = await queryRunner.manager.findOne(RawMaterial, {
            where: { product_id: item.product_id },
          });
          if (rawMat) {
            await queryRunner.manager.update(RawMaterial, rawMat.id, {
              last_purchase_price: item.price,
              last_purchase_date: savedOrder.order_date,
            });
            await queryRunner.manager.update(Product, item.product_id, {
              cost_price: item.price,
            });
          }
        }
      }

      await this.accountingService.postAutomaticEntry({
        type: 'PURCHASE',
        amount: data.total_amount,
        reference: `PUR-${savedOrder.id}`,
        description: `شراء - فاتورة رقم ${savedOrder.invoice_number || savedOrder.id}`,
      });

      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getOrderItems(orderId: number) {
    return this.orderItemRepo.find({
      where: { order_id: orderId },
      relations: ['product'],
    });
  }

  async updateOrder(
    id: number,
    data: {
      supplier_id?: number;
      total_amount?: number;
      notes?: string;
      order_date?: string;
      invoice_number?: string;
      items?: any[];
    },
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update order main fields
      const updateData: any = {};
      if (data.supplier_id !== undefined)
        updateData.supplier_id = data.supplier_id;
      if (data.total_amount !== undefined)
        updateData.total_amount = data.total_amount;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.invoice_number !== undefined)
        updateData.invoice_number = data.invoice_number;
      if (data.order_date !== undefined)
        updateData.order_date = new Date(data.order_date);

      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(PurchaseOrder, id, updateData);
      }

      // If items are provided, update items and stock
      if (data.items) {
        // Get old items to reverse stock movements
        const oldItems = await queryRunner.manager.find(PurchaseOrderItem, {
          where: { order_id: id },
        });

        // Reverse old stock movements
        for (const oldItem of oldItems) {
          await this.inventoryService.addStockMovement(
            {
              product_id: oldItem.product_id,
              warehouse_id: 1,
              type: 'OUT' as any,
              quantity: oldItem.quantity,
              notes: `تعديل أمر شراء - عكس أمر رقم ${id}`,
            },
            queryRunner.manager,
          );
        }

        // Delete existing items
        await queryRunner.manager.delete(PurchaseOrderItem, { order_id: id });

        // Create new items and add stock movements
        for (const item of data.items) {
          const orderItem = queryRunner.manager.create(PurchaseOrderItem, {
            order_id: id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          });
          await queryRunner.manager.save(PurchaseOrderItem, orderItem);

          // Add new stock movement
          await this.inventoryService.addStockMovement(
            {
              product_id: item.product_id,
              warehouse_id: 1,
              type: 'IN' as any,
              quantity: item.quantity,
              notes: `تعديل أمر شراء - أمر رقم ${id}`,
            },
            queryRunner.manager,
          );

          // Update raw material last_purchase_price if the product is RAW
          const poProduct = await queryRunner.manager.findOne(Product, {
            where: { id: item.product_id },
          });
          if (poProduct?.type === 'RAW') {
            const rawMat = await queryRunner.manager.findOne(RawMaterial, {
              where: { product_id: item.product_id },
            });
            if (rawMat) {
              await queryRunner.manager.update(RawMaterial, rawMat.id, {
                last_purchase_price: item.price,
                last_purchase_date: data.order_date ? new Date(data.order_date) : new Date(),
              });
              await queryRunner.manager.update(Product, item.product_id, {
                cost_price: item.price,
              });
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      return this.orderRepo.findOne({
        where: { id },
        relations: ['supplier'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteOrder(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get order items to reverse stock
      const items = await queryRunner.manager.find(PurchaseOrderItem, {
        where: { order_id: id },
      });

      // Reverse stock movements
      for (const item of items) {
        await this.inventoryService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: 1,
            type: 'OUT' as any,
            quantity: item.quantity,
            notes: `حذف أمر شراء - عكس أمر رقم ${id}`,
          },
          queryRunner.manager,
        );
      }

      // Delete items (CASCADE should handle this but manual delete is safer given transaction context)
      await queryRunner.manager.delete(PurchaseOrderItem, { order_id: id });

      // Delete order
      await queryRunner.manager.delete(PurchaseOrder, id);

      await queryRunner.commitTransaction();
      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // Supplier Payments
  async addPayment(data: {
    supplier_id: number;
    amount: number;
    payment_date: string;
    notes?: string;
  }) {
    const payment = this.paymentRepo.create({
      ...data,
      payment_date: new Date(data.payment_date),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    // Post to Accounting
    const supplier = await this.supplierRepo.findOne({
      where: { id: data.supplier_id },
    });
    await this.accountingService.postAutomaticEntry({
      type: 'PAYMENT',
      amount: data.amount,
      reference: `PAY-SUPP-${savedPayment.id}`,
      description: `دفع لمورد: ${supplier?.name || data.supplier_id}`,
      // partnerId is undefined for suppliers in my postAutomaticEntry logic
    });

    return savedPayment;
  }

  async getSupplierPayments(supplierId: number) {
    return this.paymentRepo.find({
      where: { supplier_id: supplierId },
      order: { payment_date: 'DESC' },
    });
  }

  async getSupplierBalance(supplierId: number) {
    // Get total purchases
    const purchases = await this.orderRepo.find({
      where: { supplier_id: supplierId },
    });
    const totalPurchases = purchases.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );

    // Get total returns
    const returns = await this.returnRepo.find({
      where: { supplier_id: supplierId },
    });
    const totalReturns = returns.reduce(
      (sum, ret) => sum + Number(ret.total_amount),
      0,
    );

    // Get total payments
    const payments = await this.paymentRepo.find({
      where: { supplier_id: supplierId },
    });
    const totalPayments = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    return totalPurchases - totalReturns - totalPayments;
  }

  async getStatementOfAccount(supplierId: number) {
    const orders = await this.orderRepo.find({
      where: { supplier_id: supplierId },
      order: { order_date: 'ASC' },
    });

    const payments = await this.paymentRepo.find({
      where: { supplier_id: supplierId },
      order: { payment_date: 'ASC' },
    });

    const returns = await this.returnRepo.find({
      where: { supplier_id: supplierId },
      order: { return_date: 'ASC' },
    });

    const movements = [
      ...orders.map((o) => ({
        date: o.order_date,
        description: `شراء - فاتورة رقم ${o.invoice_number || o.id}`,
        debit: Number(o.total_amount),
        credit: 0,
        type: 'ORDER',
        ref: o.id,
      })),
      ...returns.map((r) => ({
        date: r.return_date,
        description: `مرتجع مشتريات - رقم ${r.id}`,
        debit: 0,
        credit: Number(r.total_amount),
        type: 'RETURN',
        ref: r.id,
      })),
      ...payments.map((p) => ({
        date: p.payment_date,
        description: p.notes || 'دفع للمورد',
        debit: 0,
        credit: Number(p.amount),
        type: 'PAYMENT',
        ref: p.id,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    return movements.map((m) => {
      runningBalance += m.debit - m.credit;
      return { ...m, balance: runningBalance };
    });
  }

  // Purchase Returns
  async getAllReturns() {
    return this.returnRepo.find({ relations: ['supplier'] });
  }

  async getReturn(id: number) {
    return this.returnRepo.findOne({
      where: { id },
      relations: ['supplier', 'items', 'items.product'],
    });
  }

  async createReturn(data: {
    supplier_id: number;
    order_id?: number;
    total_amount: number;
    reason?: string;
    return_date?: string;
    items: any[];
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const purchaseReturn = queryRunner.manager.create(PurchaseReturn, {
        supplier_id: data.supplier_id,
        order_id: data.order_id,
        total_amount: data.total_amount,
        reason: data.reason,
        return_date: data.return_date ? new Date(data.return_date) : new Date(),
      });
      const savedReturn = await queryRunner.manager.save(
        PurchaseReturn,
        purchaseReturn,
      );

      for (const item of data.items) {
        const returnItem = queryRunner.manager.create(PurchaseReturnItem, {
          return_id: savedReturn.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        });
        await queryRunner.manager.save(PurchaseReturnItem, returnItem);

        // 1. Deduct stock (OUT)
        await this.inventoryService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: 1, // Main warehouse
            type: 'OUT' as any,
            quantity: item.quantity,
            notes: `مرتجع مشتريات - رقم ${savedReturn.id}`,
            date: savedReturn.return_date,
          },
          queryRunner.manager,
        );
      }

      // 2. Update Supplier Balance (Decrease debt we owe them)
      // Note: Since purchases increase debt and payments decrease it, a return should decrease it.
      // Wait, if Purchase Order increases balance, Returns should decrease it.
      // Our getSupplierBalance does (totalPurchases - totalPayments). So Returns should be subtracted from totalPurchases.
      // Actually, we don't have a balance field for suppliers, we calculate it.
      // So we need to include Returns in getSupplierBalance and getStatementOfAccount.

      // 3. Post to Accounting
      await this.accountingService.postAutomaticEntry({
        type: 'PURCHASE',
        amount: -data.total_amount, // Reverse PURCHASE
        reference: `RET-PUR-${savedReturn.id}`,
        description: `مرتجع مشتريات - رقم ${savedReturn.id}`,
      });

      await queryRunner.commitTransaction();
      return savedReturn;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== CURRENCY MANAGEMENT ====================

  async getCurrencies() {
    return this.currencyRepo.find({ where: { is_active: true } });
  }

  async getAllCurrencies() {
    return this.currencyRepo.find();
  }

  async createCurrency(data: Partial<Currency>) {
    const currency = this.currencyRepo.create(data);
    return this.currencyRepo.save(currency);
  }

  async updateCurrency(id: number, data: Partial<Currency>) {
    await this.currencyRepo.update(id, data);
    return this.currencyRepo.findOne({ where: { id } });
  }

  async deleteCurrency(id: number) {
    return this.currencyRepo.delete(id);
  }

  // ==================== FX RATE HISTORY ====================

  async getFxRates(currencyId?: number) {
    const where: any = {};
    if (currencyId) where.currency_id = currencyId;
    return this.fxRateRepo.find({
      where,
      relations: ['currency'],
      order: { rate_date: 'DESC' },
    });
  }

  async addFxRate(data: {
    currency_id: number;
    rate_to_egp: number;
    amount_paid?: number;
    notes?: string;
    rate_date: string;
  }) {
    const rate = this.fxRateRepo.create({
      ...data,
      rate_date: new Date(data.rate_date),
    });
    return this.fxRateRepo.save(rate);
  }

  // ==================== WEIGHTED AVERAGE FX ====================
  // حساب سعر الصرف المرجح: (مجموع المبالغ المدفوعة × سعر الصرف) ÷ إجمالي المبلغ المدفوع
  async calculateWeightedAverageFx(currencyId: number): Promise<number> {
    const rates = await this.fxRateRepo.find({
      where: { currency_id: currencyId },
    });

    const paidRates = rates.filter((r) => r.amount_paid && r.amount_paid > 0);
    if (paidRates.length === 0) {
      const latest = rates[rates.length - 1];
      return latest ? Number(latest.rate_to_egp) : 1;
    }

    const totalAmount = paidRates.reduce(
      (sum, r) => sum + Number(r.amount_paid),
      0,
    );
    const weightedSum = paidRates.reduce(
      (sum, r) => sum + Number(r.amount_paid) * Number(r.rate_to_egp),
      0,
    );

    return totalAmount > 0 ? weightedSum / totalAmount : 1;
  }

  // ==================== LANDED COST CALCULATION ====================
  /*
   * مصفوفة التكلفة الكلية (Landed Cost Matrix):
   * 1. التكلفة الأساسية = سعر الوحدة × سعر الصرف
   * 2. عمولة المكتب = التكلفة الأساسية × نسبة العمولة
   * 3. الجمارك = التكلفة الأساسية × نسبة الجمارك
   * 4. الشحن = (إجمالي الشحن ÷ إجمالي وزن الشحنة) × وزن الوحدة
   * 5. إجمالي التكلفة الكلية = مجموع ما سبق
   */
  async calculateLandedCost(orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'supplier'],
    });

    if (!order) throw new Error('Order not found');

    const fxRate = Number(order.exchange_rate) || 1;
    const freightCost = Number(order.freight_cost) || 0;
    const customsPercent = Number(order.customs_percent) || 0;
    const commissionPercent = Number(order.commission_percent) || 0;
    const totalWeight = Number(order.total_weight_kg) || 0;

    const breakdown = order.items.map((item) => {
      const baseCost = Number(item.price) * fxRate;
      const commission = baseCost * (commissionPercent / 100);
      const customs = baseCost * (customsPercent / 100);
      const shipping =
        totalWeight > 0 && Number(item.weight_kg) > 0
          ? (freightCost / totalWeight) * Number(item.weight_kg)
          : 0;

      const unitLandedCost = baseCost + commission + customs + shipping;
      const totalLandedCost = unitLandedCost * Number(item.quantity);

      return {
        item_id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || `Product #${item.product_id}`,
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
        fx_rate: fxRate,
        base_cost_egp: baseCost,
        commission,
        customs,
        shipping,
        unit_landed_cost: unitLandedCost,
        total_landed_cost: totalLandedCost,
        weight_kg: Number(item.weight_kg),
      };
    });

    const totalLandedCost = breakdown.reduce(
      (sum, b) => sum + b.total_landed_cost,
      0,
    );

    return {
      order_id: orderId,
      supplier: order.supplier?.name,
      invoice: order.invoice_number,
      currency: order.currency_code || 'EGP',
      fx_rate: fxRate,
      freight_cost: freightCost,
      customs_percent: customsPercent,
      commission_percent: commissionPercent,
      total_weight_kg: totalWeight,
      total_landed_cost: totalLandedCost,
      breakdown,
    };
  }

  async updateLandedCost(
    orderId: number,
    data: {
      freight_cost?: number;
      customs_percent?: number;
      commission_percent?: number;
      total_weight_kg?: number;
    },
  ) {
    const updateData: any = {};
    if (data.freight_cost !== undefined) updateData.freight_cost = data.freight_cost;
    if (data.customs_percent !== undefined) updateData.customs_percent = data.customs_percent;
    if (data.commission_percent !== undefined) updateData.commission_percent = data.commission_percent;
    if (data.total_weight_kg !== undefined) updateData.total_weight_kg = data.total_weight_kg;

    if (Object.keys(updateData).length > 0) {
      await this.orderRepo.update(orderId, updateData);
    }

    // Recalculate and save per-item landed cost
    const result = await this.calculateLandedCost(orderId);

    for (const b of result.breakdown) {
      await this.orderItemRepo.update(b.item_id, {
        landed_cost: b.unit_landed_cost,
      });
    }

    await this.orderRepo.update(orderId, {
      total_landed_cost: result.total_landed_cost,
    });

    return this.calculateLandedCost(orderId);
  }

  // ==================== CONTAINERS ====================

  async getContainers() {
    return this.containerRepo.find({ order: { name: 'ASC' } });
  }

  async getContainer(id: number) {
    return this.containerRepo.findOne({ where: { id } });
  }

  async createContainer(data: Partial<Container>) {
    const container = this.containerRepo.create(data);
    const saved = await this.containerRepo.save(container);
    // Auto-calculate CBM
    const cbm = (Number(saved.length_cm) * Number(saved.width_cm) * Number(saved.height_cm)) / 1_000_000;
    saved.max_cbm = cbm;
    return this.containerRepo.save(saved);
  }

  async updateContainer(id: number, data: Partial<Container>) {
    await this.containerRepo.update(id, data);
    const container = await this.containerRepo.findOne({ where: { id } });
    if (container) {
      const cbm = (Number(container.length_cm) * Number(container.width_cm) * Number(container.height_cm)) / 1_000_000;
      container.max_cbm = cbm;
      await this.containerRepo.save(container);
    }
    return container;
  }

  async deleteContainer(id: number) {
    return this.containerRepo.delete(id);
  }

  // ==================== CBM CALCULATION ====================
  // حساب حجم الشحنة بالمتر المكعب: (الطول × العرض × الارتفاع × عدد الكراتين) ÷ 1,000,000
  async calculateCBM(lengthCm: number, widthCm: number, heightCm: number, cartonsCount: number) {
    const cbm = (lengthCm * widthCm * heightCm * cartonsCount) / 1_000_000;
    const containers = await this.getContainers();
    const containerSuggestions = containers
      .filter((c) => c.is_active)
      .map((c) => ({
        id: c.id,
        name: c.name,
        max_cbm: Number(c.max_cbm),
        max_weight_kg: Number(c.max_weight_kg),
        fits: cbm <= Number(c.max_cbm) && cbm > 0,
        utilization_pct: cbm > 0 ? Math.min(100, (cbm / Number(c.max_cbm)) * 100) : 0,
        remaining_cbm: Math.max(0, Number(c.max_cbm) - cbm),
      }))
      .sort((a, b) => b.utilization_pct - a.utilization_pct);

    return {
      carton_volume_cm3: lengthCm * widthCm * heightCm,
      total_cbm: cbm,
      carton_dimensions: { length_cm: lengthCm, width_cm: widthCm, height_cm: heightCm },
      cartons_count: cartonsCount,
      container_suggestions: containerSuggestions,
    };
  }

  // ==================== PACKING LIST ====================

  async getPackingList(orderId: number) {
    return this.packingListRepo.findOne({ where: { order_id: orderId } });
  }

  async createOrUpdatePackingList(
    orderId: number,
    data: {
      carton_length_cm: number;
      carton_width_cm: number;
      carton_height_cm: number;
      cartons_count: number;
      actual_net_weight_kg?: number;
      actual_gross_weight_kg?: number;
      deviation_threshold_percent?: number;
      notes?: string;
    },
  ) {
    // Calculate CBM
    const totalCbm =
      (Number(data.carton_length_cm) *
        Number(data.carton_width_cm) *
        Number(data.carton_height_cm) *
        Number(data.cartons_count)) /
      1_000_000;

    // Calculate weight deviation if both ordered and actual are available
    let weightDeviation: number | undefined;
    if (data.actual_gross_weight_kg && data.actual_net_weight_kg) {
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (order?.total_weight_kg && Number(order.total_weight_kg) > 0) {
        weightDeviation =
          ((Number(data.actual_gross_weight_kg) - Number(order.total_weight_kg)) /
            Number(order.total_weight_kg)) *
          100;
      }
    }

    const existing = await this.packingListRepo.findOne({ where: { order_id: orderId } });

    if (existing) {
      await this.packingListRepo.update(existing.id, {
        carton_length_cm: data.carton_length_cm,
        carton_width_cm: data.carton_width_cm,
        carton_height_cm: data.carton_height_cm,
        cartons_count: data.cartons_count,
        total_cbm: totalCbm,
        actual_net_weight_kg: data.actual_net_weight_kg ?? null,
        actual_gross_weight_kg: data.actual_gross_weight_kg ?? null,
        deviation_threshold_percent: data.deviation_threshold_percent ?? 5,
        notes: data.notes ?? null,
        weight_deviation_percent: weightDeviation ?? null,
      });
    } else {
      await this.packingListRepo.save(
        this.packingListRepo.create({
          order_id: orderId,
          carton_length_cm: data.carton_length_cm,
          carton_width_cm: data.carton_width_cm,
          carton_height_cm: data.carton_height_cm,
          cartons_count: data.cartons_count,
          total_cbm: totalCbm,
          actual_net_weight_kg: data.actual_net_weight_kg ?? null,
          actual_gross_weight_kg: data.actual_gross_weight_kg ?? null,
          deviation_threshold_percent: data.deviation_threshold_percent ?? 5,
          notes: data.notes ?? null,
          weight_deviation_percent: weightDeviation ?? null,
        }),
      );
    }

    const packingList = await this.packingListRepo.findOne({ where: { order_id: orderId } });

    // Deviation alert
    const threshold = data.deviation_threshold_percent ?? 5;
    const alert =
      weightDeviation !== undefined && Math.abs(weightDeviation) > threshold
        ? {
            type: 'WEIGHT_DEVIATION',
            message: `انحراف الوزن بنسبة ${weightDeviation.toFixed(1)}% (الحد المسموح: ${threshold}%)`,
            severity: Math.abs(weightDeviation) > threshold * 2 ? 'HIGH' as const : 'MEDIUM' as const,
            deviation_pct: weightDeviation,
          }
        : null;

    // CBM suggestion
    const cbmResult = await this.calculateCBM(
      Number(data.carton_length_cm),
      Number(data.carton_width_cm),
      Number(data.carton_height_cm),
      Number(data.cartons_count),
    );

    return {
      packing_list: packingList,
      cbm_analysis: cbmResult,
      deviation_alert: alert,
    };
  }

  // Smart Reorder: Suggest items to fill remaining container space
  async getReorderSuggestions(containerId: number) {
    const container = await this.containerRepo.findOne({ where: { id: containerId } });
    if (!container) throw new NotFoundException('Container not found');

    // Get latest packing list for this container type
    const containers = await this.containerRepo.find();
    const sameType = containers.filter(c => c.name === container.name);
    const usedCbm = await this.packingListRepo
      .createQueryBuilder('pl')
      .select('COALESCE(SUM(pl.total_cbm), 0)', 'usedCbm')
      .where('pl.container_id IN (:...ids)', { ids: sameType.map(c => c.id) })
      .getRawOne();
    const remainingCbm = Number(container.max_cbm) - Number(usedCbm?.usedCbm || 0);
    if (remainingCbm <= 0) return { remaining_cbm: 0, suggestions: [] };

    // Find low-stock products (finished goods, raw materials, accessories)
    const products = await this.productRepo
      .createQueryBuilder('p')
      .leftJoin(
        (qb) =>
          qb
            .select('s.product_id', 'pid')
            .addSelect('SUM(s.quantity)', 'total_qty')
            .from(Stock, 's')
            .groupBy('s.product_id'),
        'stock',
        'stock.pid = p.id',
      )
      .where('p.type IN (:...types)', { types: ['RAW', 'FINISHED', 'SEMI', 'ACCESSORY'] })
      .andWhere('COALESCE(stock.total_qty, 0) <= COALESCE(p.min_stock, 0)')
      .getMany();

    // Estimate volume per unit (rough: 10cm³ per unit default, or use product weight_grams as proxy)
    const suggestions = products
      .map((p) => {
        const estCbmPerUnit = Number(p.weight_grams || 10) / 1000000; // grams -> cubic meters (rough)
        const maxFit = Math.floor(remainingCbm / estCbmPerUnit);
        const stockQty = 0; // already low stock
        return {
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          estimated_cbm_per_unit: estCbmPerUnit,
          max_units_fit: maxFit,
          suggested_qty: Math.min(maxFit, 10000),
          type: p.type,
        };
      })
      .filter((s) => s.max_units_fit > 0)
      .sort((a, b) => b.suggested_qty - a.suggested_qty)
      .slice(0, 10);

    return { remaining_cbm: remainingCbm, suggestions };
  }
}

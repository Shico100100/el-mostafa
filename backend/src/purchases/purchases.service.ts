import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { PurchaseReturn } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { Container } from './entities/container.entity';
import { Currency } from './entities/currency.entity';
import { PackingList } from './entities/packing-list.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { MovementType } from '../inventory/entities/stock-movement.entity';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import { SupplierService } from './suppliers/supplier.service';
import { PurchaseOrderService } from './purchase-orders/purchase-order.service';
import { PaymentService } from './supplier-payments/payment.service';
import { PurchaseReturnService } from './purchase-returns/purchase-return.service';
import { CurrencyService } from './currencies/currency.service';
import { ContainerService } from './containers/container.service';
import { PackingListService } from './packing-lists/packing-list.service';

@Injectable()
export class PurchasesService {
  constructor(
    private supplierService: SupplierService,
    private purchaseOrderService: PurchaseOrderService,
    private paymentService: PaymentService,
    private purchaseReturnService: PurchaseReturnService,
    private currencyService: CurrencyService,
    private containerService: ContainerService,
    private packingListService: PackingListService,
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private orderRepo: Repository<PurchaseOrder>,
    @InjectRepository(SupplierPayment)
    private paymentRepo: Repository<SupplierPayment>,
    @InjectRepository(PurchaseReturn)
    private returnRepo: Repository<PurchaseReturn>,
    @InjectRepository(Container)
    private containerRepo: Repository<Container>,
    @InjectRepository(PackingList)
    private packingListRepo: Repository<PackingList>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    private inventoryService: InventoryService,
    private accountingService: AccountingService,
    private dataSource: DataSource,
  ) {}

  // ---- Supplier Delegation ----

  async getAllSuppliers() {
    return this.supplierService.getAllSuppliers();
  }

  async getSupplier(id: number) {
    return this.supplierService.getSupplier(id);
  }

  async createSupplier(data: Partial<Supplier>) {
    return this.supplierService.createSupplier(data);
  }

  async updateSupplier(id: number, data: Partial<Supplier>) {
    return this.supplierService.updateSupplier(id, data);
  }

  async deleteSupplier(id: number) {
    return this.supplierService.deleteSupplier(id);
  }

  // ---- Supplier Aging / Balance / Statement (cross-repo) ----

  async getSupplierAging() {
    const suppliers = await this.supplierRepo.find({
      order: { name: 'ASC' },
    });

    const allOrders = await this.orderRepo.find({
      order: { supplier_id: 'ASC', order_date: 'ASC' },
    });

    const allPayments = await this.paymentRepo.find({
      order: { supplier_id: 'ASC', payment_date: 'ASC' },
    });

    const allReturns = await this.returnRepo.find({
      order: { supplier_id: 'ASC', return_date: 'ASC' },
    });

    const ordersBySup = new Map<number, typeof allOrders>();
    const paymentsBySup = new Map<number, typeof allPayments>();
    const returnsBySup = new Map<number, typeof allReturns>();

    for (const o of allOrders) {
      if (!ordersBySup.has(o.supplier_id)) ordersBySup.set(o.supplier_id, []);
      ordersBySup.get(o.supplier_id)!.push(o);
    }
    for (const p of allPayments) {
      if (!paymentsBySup.has(p.supplier_id))
        paymentsBySup.set(p.supplier_id, []);
      paymentsBySup.get(p.supplier_id)!.push(p);
    }
    for (const r of allReturns) {
      if (!returnsBySup.has(r.supplier_id)) returnsBySup.set(r.supplier_id, []);
      returnsBySup.get(r.supplier_id)!.push(r);
    }

    const now = new Date();
    return suppliers.map((supplier) => {
      const orders = ordersBySup.get(supplier.id) || [];
      const payments = paymentsBySup.get(supplier.id) || [];
      const returns = returnsBySup.get(supplier.id) || [];

      const fifoQueue = orders.map((o) => ({
        date: o.order_date || o.created_at,
        remaining: Number(o.total_amount),
      }));

      const credits = [
        ...payments.map((p) => ({
          date: p.payment_date,
          amount: Number(p.amount),
        })),
        ...returns.map((r) => ({
          date: r.return_date,
          amount: Number(r.total_amount),
        })),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let idx = 0;
      for (const credit of credits) {
        let remaining = credit.amount;
        while (remaining > 0 && idx < fifoQueue.length) {
          const order = fifoQueue[idx];
          const toApply = Math.min(remaining, order.remaining);
          order.remaining -= toApply;
          remaining -= toApply;
          if (order.remaining <= 0) idx++;
        }
      }

      const buckets = {
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        over90: 0,
      };
      let total = 0;

      for (const order of fifoQueue) {
        if (order.remaining <= 0) continue;
        total += order.remaining;

        const days = Math.floor(
          (now.getTime() - new Date(order.date).getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (days <= 30) buckets.current += order.remaining;
        else if (days <= 60) buckets.days1_30 += order.remaining;
        else if (days <= 90) buckets.days31_60 += order.remaining;
        else if (days <= 120) buckets.days61_90 += order.remaining;
        else buckets.over90 += order.remaining;
      }

      return {
        id: supplier.id,
        name: supplier.name,
        total,
        ...buckets,
      };
    });
  }

  async getSupplierBalance(supplierId: number) {
    const purchases = await this.orderRepo.find({
      where: { supplier_id: supplierId },
    });
    const totalPurchases = purchases.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );

    const returns = await this.returnRepo.find({
      where: { supplier_id: supplierId },
    });
    const totalReturns = returns.reduce(
      (sum, ret) => sum + Number(ret.total_amount),
      0,
    );

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

  // ---- Order Delegation ----

  async getAllOrders(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      fromDate?: string;
      toDate?: string;
    } = {},
  ) {
    return this.purchaseOrderService.getAllOrders(options);
  }

  async getOrder(id: number) {
    return this.purchaseOrderService.getOrder(id);
  }

  async getOrderItems(orderId: number) {
    return this.purchaseOrderService.getOrderItems(orderId);
  }

  async calculateLandedCost(orderId: number) {
    return this.purchaseOrderService.calculateLandedCost(orderId);
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
    return this.purchaseOrderService.updateLandedCost(orderId, data);
  }

  // ---- Complex Order Transactions (DataSource) ----

  async createOrder(data: {
    supplier_id: number;
    total_amount: number;
    notes?: string;
    order_date?: string;
    invoice_number?: string;
    items: Array<{ product_id: number; quantity: number; price: number; total: number }>;
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

        await this.inventoryService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: 1,
            type: MovementType.IN,
            quantity: item.quantity,
            notes: `شراء - أمر رقم ${savedOrder.id}`,
            date: savedOrder.order_date,
          },
          queryRunner.manager,
        );

        const poProduct = await queryRunner.manager.findOne(Product, {
          where: { id: item.product_id },
        });
        if (poProduct?.type === 'RAW') {
          await queryRunner.manager.update(Product, item.product_id, {
            last_purchase_price: item.price,
            last_purchase_date: savedOrder.order_date,
            cost_price: item.price,
          });
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

  async updateOrder(
    id: number,
    data: {
      supplier_id?: number;
      total_amount?: number;
      notes?: string;
      order_date?: string;
      invoice_number?: string;
      items?: Array<{ product_id: number; quantity: number; price: number; total: number }>;
    },
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateData: Partial<PurchaseOrder> = {};
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

      if (data.items) {
        const oldItems = await queryRunner.manager.find(PurchaseOrderItem, {
          where: { order_id: id },
        });

        for (const oldItem of oldItems) {
          await this.inventoryService.addStockMovement(
            {
              product_id: oldItem.product_id,
              warehouse_id: 1,
              type: MovementType.OUT,
              quantity: oldItem.quantity,
              notes: `تعديل أمر شراء - عكس أمر رقم ${id}`,
            },
            queryRunner.manager,
            true,
          );
        }

        await queryRunner.manager.delete(PurchaseOrderItem, { order_id: id });

        for (const item of data.items) {
          const orderItem = queryRunner.manager.create(PurchaseOrderItem, {
            order_id: id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          });
          await queryRunner.manager.save(PurchaseOrderItem, orderItem);

          await this.inventoryService.addStockMovement(
            {
              product_id: item.product_id,
              warehouse_id: 1,
              type: MovementType.IN,
              quantity: item.quantity,
              notes: `تعديل أمر شراء - أمر رقم ${id}`,
            },
            queryRunner.manager,
          );

          const poProduct = await queryRunner.manager.findOne(Product, {
            where: { id: item.product_id },
          });
          if (poProduct?.type === 'RAW') {
            await queryRunner.manager.update(Product, item.product_id, {
              last_purchase_price: item.price,
              last_purchase_date: data.order_date
                ? new Date(data.order_date)
                : new Date(),
              cost_price: item.price,
            });
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
      const items = await queryRunner.manager.find(PurchaseOrderItem, {
        where: { order_id: id },
      });

      for (const item of items) {
        await this.inventoryService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: 1,
            type: MovementType.OUT,
            quantity: item.quantity,
            notes: `حذف أمر شراء - عكس أمر رقم ${id}`,
          },
          queryRunner.manager,
          true,
        );
      }

      await queryRunner.manager.delete(PurchaseOrderItem, { order_id: id });
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

  // ---- Payment (needs AccountingService) ----

  async addPayment(data: {
    supplier_id: number;
    amount: number;
    payment_date: string;
    notes?: string;
  }) {
    const savedPayment = await this.paymentService.addPayment(data);

    const supplier = await this.supplierRepo.findOne({
      where: { id: data.supplier_id },
    });
    await this.accountingService.postAutomaticEntry({
      type: 'PAYMENT',
      amount: data.amount,
      reference: `PAY-SUPP-${savedPayment.id}`,
      description: `دفع لمورد: ${supplier?.name || data.supplier_id}`,
    });

    return savedPayment;
  }

  async getSupplierPayments(supplierId: number) {
    return this.paymentService.getSupplierPayments(supplierId);
  }

  // ---- Return Delegation ----

  async getAllReturns() {
    return this.purchaseReturnService.getAllReturns();
  }

  async getReturn(id: number) {
    return this.purchaseReturnService.getReturn(id);
  }

  // ---- Complex Return Transaction (DataSource) ----

  async createReturn(data: {
    supplier_id: number;
    order_id?: number;
    total_amount: number;
    reason?: string;
    return_date?: string;
    items: Array<{ product_id: number; quantity: number; unit_price: number; total: number }>;
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
          unit_price: item.unit_price,
          total: item.total,
        });
        await queryRunner.manager.save(PurchaseReturnItem, returnItem);

        await this.inventoryService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: 1,
            type: MovementType.OUT,
            quantity: item.quantity,
            notes: `مرتجع مشتريات - رقم ${savedReturn.id}`,
            date: savedReturn.return_date,
          },
          queryRunner.manager,
        );
      }

      await this.accountingService.postAutomaticEntry({
        type: 'PURCHASE',
        amount: -data.total_amount,
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

  // ---- Currency Delegation ----

  async getCurrencies() {
    return this.currencyService.getCurrencies();
  }

  async getAllCurrencies() {
    return this.currencyService.getAllCurrencies();
  }

  async createCurrency(data: Partial<Currency>) {
    return this.currencyService.createCurrency(data);
  }

  async updateCurrency(id: number, data: Partial<Currency>) {
    return this.currencyService.updateCurrency(id, data);
  }

  async deleteCurrency(id: number) {
    return this.currencyService.deleteCurrency(id);
  }

  async getFxRates(currencyId?: number) {
    return this.currencyService.getFxRates(currencyId);
  }

  async addFxRate(data: {
    currency_id: number;
    rate_to_egp: number;
    amount_paid?: number;
    notes?: string;
    rate_date: string;
  }) {
    return this.currencyService.addFxRate(data);
  }

  async calculateWeightedAverageFx(currencyId: number): Promise<number> {
    return this.currencyService.calculateWeightedAverageFx(currencyId);
  }

  // ---- Container Delegation ----

  async getContainers() {
    return this.containerService.getContainers();
  }

  async getContainer(id: number) {
    return this.containerService.getContainer(id);
  }

  async createContainer(data: Partial<Container>) {
    return this.containerService.createContainer(data);
  }

  async updateContainer(id: number, data: Partial<Container>) {
    return this.containerService.updateContainer(id, data);
  }

  async deleteContainer(id: number) {
    return this.containerService.deleteContainer(id);
  }

  async calculateCBM(
    lengthCm: number,
    widthCm: number,
    heightCm: number,
    cartonsCount: number,
  ) {
    return this.containerService.calculateCBM(
      lengthCm,
      widthCm,
      heightCm,
      cartonsCount,
    );
  }

  // ---- Packing List ----

  async getPackingList(orderId: number) {
    return this.packingListService.getPackingList(orderId);
  }

  // ---- Cross-repo Packing List ----

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
    const totalCbm =
      (Number(data.carton_length_cm) *
        Number(data.carton_width_cm) *
        Number(data.carton_height_cm) *
        Number(data.cartons_count)) /
      1_000_000;

    let weightDeviation: number | undefined;
    if (data.actual_gross_weight_kg && data.actual_net_weight_kg) {
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (order?.total_weight_kg && Number(order.total_weight_kg) > 0) {
        weightDeviation =
          ((Number(data.actual_gross_weight_kg) -
            Number(order.total_weight_kg)) /
            Number(order.total_weight_kg)) *
          100;
      }
    }

    const existing = await this.packingListRepo.findOne({
      where: { order_id: orderId },
    });

    if (existing) {
      await this.packingListRepo.update(existing.id, {
        carton_length_cm: data.carton_length_cm,
        carton_width_cm: data.carton_width_cm,
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

    const packingList = await this.packingListRepo.findOne({
      where: { order_id: orderId },
    });

    const threshold = data.deviation_threshold_percent ?? 5;
    const alert =
      weightDeviation !== undefined && Math.abs(weightDeviation) > threshold
        ? {
            type: 'WEIGHT_DEVIATION',
            message: `انحراف الوزن بنسبة ${weightDeviation.toFixed(1)}% (الحد المسموح: ${threshold}%)`,
            severity:
              Math.abs(weightDeviation) > threshold * 2
                ? ('HIGH' as const)
                : ('MEDIUM' as const),
            deviation_pct: weightDeviation,
          }
        : null;

    const cbmResult = await this.containerService.calculateCBM(
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

  // ---- Cross-repo Reorder Suggestions ----

  async getReorderSuggestions(containerId: number) {
    const container = await this.containerRepo.findOne({
      where: { id: containerId },
    });
    if (!container) throw new NotFoundException('Container not found');

    const containers = await this.containerRepo.find();
    const sameType = containers.filter((c) => c.name === container.name);
    const usedCbm = await this.packingListRepo
      .createQueryBuilder('pl')
      .select('COALESCE(SUM(pl.total_cbm), 0)', 'usedCbm')
      .where('pl.container_id IN (:...ids)', { ids: sameType.map((c) => c.id) })
      .getRawOne();
    const remainingCbm =
      Number(container.max_cbm) - Number(usedCbm?.usedCbm || 0);
    if (remainingCbm <= 0) return { remaining_cbm: 0, suggestions: [] };

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
      .where('p.type IN (:...types)', {
        types: ['RAW', 'FINISHED', 'SEMI', 'ACCESSORY'],
      })
      .andWhere('COALESCE(stock.total_qty, 0) <= COALESCE(p.min_stock, 0)')
      .getMany();

    const suggestions = products
      .map((p) => {
        const estCbmPerUnit = Number(p.weight_grams || 10) / 1000000;
        const maxFit = Math.floor(remainingCbm / estCbmPerUnit);
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

  // ---- DataSource Queries ----

  async getLatestPurchasePrice(
    productId: number,
  ): Promise<{ price: number; date: string | null }> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select([
        'item.price',
        'item.landed_cost',
        'COALESCE(po.order_date, po.created_at) as ref_date',
      ])
      .from(PurchaseOrderItem, 'item')
      .innerJoin('item.order', 'po')
      .where('item.product_id = :productId', { productId })
      .orderBy('COALESCE(po.order_date, po.created_at)', 'DESC')
      .limit(1)
      .getRawOne();

    if (!row) return { price: 0, date: null };

    return {
      price: Number(row.price) + Number(row.landed_cost || 0),
      date: row.ref_date ? new Date(row.ref_date).toISOString() : null,
    };
  }

  async getLatestPurchasePrices(
    productIds: number[],
  ): Promise<Record<number, { price: number; date: string | null }>> {
    if (productIds.length === 0) return {};

    const rows = await this.dataSource
      .createQueryBuilder()
      .select([
        'item.product_id',
        'item.price',
        'item.landed_cost',
        'COALESCE(po.order_date, po.created_at) as ref_date',
      ])
      .from(PurchaseOrderItem, 'item')
      .innerJoin('item.order', 'po')
      .where('item.product_id IN (:...productIds)', { productIds })
      .orderBy('COALESCE(po.order_date, po.created_at)', 'DESC')
      .getRawMany();

    const result: Record<number, { price: number; date: string | null }> = {};
    for (const id of productIds) {
      result[id] = { price: 0, date: null };
    }
    const seen = new Set<number>();
    for (const row of rows) {
      if (!seen.has(row.product_id)) {
        seen.add(row.product_id);
        result[row.product_id] = {
          price: Number(row.price) + Number(row.landed_cost || 0),
          date: row.ref_date ? new Date(row.ref_date).toISOString() : null,
        };
      }
    }
    return result;
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { SalesReturn } from './entities/sales-return.entity';
import { SalesReturnItem } from './entities/sales-return-item.entity';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { Product } from '../inventory/entities/product.entity';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(SalesOrder)
    private orderRepo: Repository<SalesOrder>,
    @InjectRepository(CustomerPayment)
    private paymentRepo: Repository<CustomerPayment>,
    @InjectRepository(SalesReturn)
    private returnRepo: Repository<SalesReturn>,
    private inventoryService: InventoryService,
    private accountingService: AccountingService,
    private cache: CacheService,
    private dataSource: DataSource,
  ) {}

  // ---- Customer Aging / Statement (cross-repo) ----

  async getCustomerAging(): Promise<
    Array<{
      id: number;
      name: string;
      total: number;
      current: number;
      days1_30: number;
      days31_60: number;
      days61_90: number;
      over90: number;
    }>
  > {
    const cacheKey = 'reports:customer-aging';
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;
    const customers = await this.customerRepo.find({
      order: { name: 'ASC' },
    });

    const allOrders = await this.orderRepo.find({
      order: { customer_id: 'ASC', order_date: 'ASC' },
    });

    const allPayments = await this.paymentRepo.find({
      order: { customer_id: 'ASC', payment_date: 'ASC' },
    });

    const allReturns = await this.returnRepo.find({
      order: { customer_id: 'ASC', return_date: 'ASC' },
    });

    const ordersByCust = new Map<number, typeof allOrders>();
    const paymentsByCust = new Map<number, typeof allPayments>();
    const returnsByCust = new Map<number, typeof allReturns>();

    for (const o of allOrders) {
      if (!ordersByCust.has(o.customer_id)) ordersByCust.set(o.customer_id, []);
      ordersByCust.get(o.customer_id)!.push(o);
    }
    for (const p of allPayments) {
      if (!paymentsByCust.has(p.customer_id))
        paymentsByCust.set(p.customer_id, []);
      paymentsByCust.get(p.customer_id)!.push(p);
    }
    for (const r of allReturns) {
      if (!returnsByCust.has(r.customer_id))
        returnsByCust.set(r.customer_id, []);
      returnsByCust.get(r.customer_id)!.push(r);
    }

    const now = new Date();
    const result = customers.map((customer) => {
      const orders = ordersByCust.get(customer.id) || [];
      const payments = paymentsByCust.get(customer.id) || [];
      const returns = returnsByCust.get(customer.id) || [];

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
        id: customer.id,
        name: customer.name,
        total: Math.round(total * 100) / 100,
        current: Math.round(buckets.current * 100) / 100,
        days1_30: Math.round(buckets.days1_30 * 100) / 100,
        days31_60: Math.round(buckets.days31_60 * 100) / 100,
        days61_90: Math.round(buckets.days61_90 * 100) / 100,
        over90: Math.round(buckets.over90 * 100) / 100,
      };
    });
    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  async getStatementOfAccount(customerId: number) {
    const orders = await this.orderRepo.find({
      where: { customer: { id: customerId } },
      order: { created_at: 'ASC' },
    });

    const payments = await this.paymentRepo.find({
      where: { customer: { id: customerId } },
      order: { payment_date: 'ASC' },
    });

    const returns = await this.returnRepo.find({
      where: { customer_id: customerId },
      order: { return_date: 'ASC' },
    });

    const movements = [
      ...orders.map((o) => ({
        date: o.order_date || o.created_at,
        description: `بيع - فاتورة رقم ${o.id}`,
        debit: Number(o.total_amount),
        credit: 0,
        type: 'ORDER',
        ref: o.id,
      })),
      ...returns.map((r) => ({
        date: r.return_date,
        description: `مرتجع مبيعات - رقم ${r.id}`,
        debit: 0,
        credit: Number(r.total_amount),
        type: 'RETURN',
        ref: r.id,
      })),
      ...payments.map((p) => ({
        date: p.payment_date,
        description: p.notes || 'تحصيل من عميل',
        debit: 0,
        credit: Number(p.amount),
        type: 'PAYMENT',
        ref: p.id,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    return movements.map((m) => {
      runningBalance += m.debit - m.credit;
      return { ...m, balance: Math.round(runningBalance * 100) / 100 };
    });
  }

  // ---- Complex Order Transaction ----

  async createOrder(data: {
    customer_id: number;
    total_amount: number;
    notes?: string;
    order_date?: string;
    items: Array<{ product_id: number; quantity: number; price: number; total: number; warehouse_id?: number }>;
  }) {
    if (!data.customer_id) throw new BadRequestException('معرف العميل مطلوب');
    if (!data.items || data.items.length === 0)
      throw new BadRequestException('يجب إضافة صنف واحد على الأقل');
    for (const item of data.items) {
      if (!item.product_id)
        throw new BadRequestException('معرف المنتج مطلوب لجميع الأصناف');
      if (!item.quantity || item.quantity <= 0)
        throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');
      if (item.price == null || item.price < 0)
        throw new BadRequestException('السعر غير صالح');
    }

    const calculatedTotal = data.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.price),
      0,
    );
    const totalAmount = Math.round(calculatedTotal * 100) / 100;

    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(SalesOrder);
      const orderItemRepo = manager.getRepository(SalesOrderItem);
      const stockRepo = manager.getRepository(Stock);
      const stockMovementRepo = manager.getRepository(StockMovement);
      const customerRepo = manager.getRepository(Customer);
      const productRepo = manager.getRepository(Product);

      const order = orderRepo.create({
        customer_id: data.customer_id,
        total_amount: totalAmount,
        notes: data.notes,
        order_date: data.order_date ? new Date(data.order_date) : new Date(),
      });
      const saved = await orderRepo.save(order);

      let cogsTotal = 0;

      for (const item of data.items) {
        const orderItem = orderItemRepo.create({
          order_id: saved.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: Math.round(Number(item.quantity) * Number(item.price) * 100) / 100,
        });
        await orderItemRepo.save(orderItem);

        const product = await productRepo.findOne({ where: { id: item.product_id } });
        cogsTotal += Number(item.quantity) * Number(product?.cost_price || 0);

        let itemStock = await stockRepo.findOne({
          where: { product_id: item.product_id },
        });
        const whId = item.warehouse_id || itemStock?.warehouse_id || 1;

        if (!itemStock) {
          itemStock = stockRepo.create({
            product_id: item.product_id,
            warehouse_id: whId,
            quantity: 0,
          });
        }

        if (Number(itemStock.quantity) < Number(item.quantity)) {
          throw new BadRequestException(
            `رصيد غير كافٍ للمنتج: ${item.product_id} (المطلوب: ${item.quantity}, المتوفر: ${itemStock.quantity})`,
          );
        }

        itemStock.quantity = Number(itemStock.quantity) - Number(item.quantity);
        await stockRepo.save(itemStock);

        await stockMovementRepo.save({
          product_id: item.product_id,
          warehouse_id: whId,
          type: MovementType.OUT,
          quantity: item.quantity,
          date: data.order_date ? new Date(data.order_date) : new Date(),
          notes: `بيع - فاتورة رقم ${saved.id}`,
        });
      }

      const customer = await customerRepo.findOne({
        where: { id: data.customer_id },
      });
      if (customer) {
        customer.balance = Number(customer.balance) + totalAmount;
        await customerRepo.save(customer);
      }

      return { order: saved, cogsTotal: Math.round(cogsTotal * 100) / 100 };
    });

    await this.accountingService.postAutomaticEntry({
      type: 'SALE',
      amount: totalAmount,
      cogsAmount: savedOrder.cogsTotal,
      reference: `ORD-${savedOrder.order.id}`,
      description: `بيع - فاتورة رقم ${savedOrder.order.id}`,
    });

    return savedOrder.order;
  }

  async deleteOrder(id: number) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('الفاتورة غير موجودة');

    let cogsTotal = 0;

    await this.dataSource.transaction(async (manager) => {
      const items = await manager.find(SalesOrderItem, {
        where: { order: { id: id } },
      });

      const productRepo = manager.getRepository(Product);
      for (const item of items) {
        const product = await productRepo.findOne({ where: { id: item.product_id } });
        cogsTotal += Number(item.quantity) * Number(product?.cost_price || 0);
      }

      const invService = this.inventoryService;
      const stockRepo = manager.getRepository(Stock);
      for (const item of items) {
        const stock = await stockRepo.findOne({
          where: { product_id: item.product_id },
        });
        const whId =
          stock?.warehouse_id ||
          (await this.inventoryService.getDefaultWarehouseId());
        await invService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: whId,
            type: MovementType.IN,
            quantity: item.quantity,
            notes: `حذف فاتورة بيع - عكس رقم ${id}`,
          },
          manager,
        );
      }

      const customer = await manager.findOne(Customer, {
        where: { id: order.customer_id },
      });
      if (customer) {
        customer.balance =
          Number(customer.balance) - Number(order.total_amount);
        await manager.save(Customer, customer);
      }

      await manager.delete(SalesOrderItem, { order_id: id });
      await manager.delete(SalesOrder, id);
    });

    await this.accountingService.postAutomaticEntry({
      type: 'SALE',
      amount: -Number(order.total_amount),
      cogsAmount: -Math.round(cogsTotal * 100) / 100,
      reference: `DEL-ORD-${id}`,
      description: `حذف فاتورة بيع رقم ${id}`,
    });
  }

  // ---- Payment (requires AccountingService) ----

  async addPayment(data: {
    customer_id: number;
    amount: number;
    payment_date: string;
    notes?: string;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = queryRunner.manager.create(CustomerPayment, {
        ...data,
        payment_date: new Date(data.payment_date),
      });
      const savedPayment = await queryRunner.manager.save(
        CustomerPayment,
        payment,
      );

      const customer = await queryRunner.manager.findOne(Customer, {
        where: { id: data.customer_id },
      });
      if (customer) {
        customer.balance = Number(customer.balance) - Number(data.amount);
        await queryRunner.manager.save(Customer, customer);
      }

      await queryRunner.commitTransaction();

      if (customer) {
        await this.accountingService.postAutomaticEntry({
          type: 'PAYMENT',
          amount: data.amount,
          reference: `PAY-CUST-${savedPayment.id}`,
          description: `تحصيل من عميل: ${customer.name}`,
          partnerId: customer.id,
        });
      }

      return savedPayment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ---- Complex Return Transaction ----

  async createReturn(data: {
    customer_id: number;
    order_id?: number;
    total_amount: number;
    reason?: string;
    return_date?: string;
    items: Array<{ product_id: number; quantity: number; unit_price: number; total: number }>;
  }) {
    const calculatedReturnTotal = data.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
      0,
    );
    const returnTotal = Math.round(calculatedReturnTotal * 100) / 100;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const salesReturn = queryRunner.manager.create(SalesReturn, {
        customer_id: data.customer_id,
        order_id: data.order_id,
        total_amount: returnTotal,
        reason: data.reason,
        return_date: data.return_date ? new Date(data.return_date) : new Date(),
      });
      const savedReturn = await queryRunner.manager.save(
        SalesReturn,
        salesReturn,
      );

      let cogsTotal = 0;
      const productRepo = queryRunner.manager.getRepository(Product);

      for (const item of data.items) {
        const product = await productRepo.findOne({ where: { id: item.product_id } });
        cogsTotal += Number(item.quantity) * Number(product?.cost_price || 0);

        const returnItem = queryRunner.manager.create(SalesReturnItem, {
          return_id: savedReturn.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        });
        await queryRunner.manager.save(SalesReturnItem, returnItem);

        const returnStock = await queryRunner.manager.findOne(Stock, {
          where: { product_id: item.product_id },
        });
        const returnWhId = returnStock?.warehouse_id || 1;
        await this.inventoryService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: returnWhId,
            type: MovementType.IN,
            quantity: item.quantity,
            notes: `مرتجع مبيعات - رقم ${savedReturn.id}`,
            date: savedReturn.return_date,
          },
          queryRunner.manager,
        );
      }

      const customer = await queryRunner.manager.findOne(Customer, {
        where: { id: data.customer_id },
      });
      if (customer) {
        customer.balance = Number(customer.balance) - returnTotal;
        await queryRunner.manager.save(Customer, customer);
      }

      await queryRunner.commitTransaction();

      await this.accountingService.postAutomaticEntry({
        type: 'SALE',
        amount: -returnTotal,
        cogsAmount: -Math.round(cogsTotal * 100) / 100,
        reference: `RET-SALE-${savedReturn.id}`,
        description: `مرتجع مبيعات - رقم ${savedReturn.id}`,
      });

      return savedReturn;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}

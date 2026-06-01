import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import { Customer } from './entities/customer.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { SalesReturn } from './entities/sales-return.entity';
import { SalesReturnItem } from './entities/sales-return-item.entity';
import { InventoryService } from '../inventory/inventory.service';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(SalesOrder)
    private orderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private orderItemRepo: Repository<SalesOrderItem>,
    @InjectRepository(Quote)
    private quoteRepo: Repository<Quote>,
    @InjectRepository(CustomerPayment)
    private paymentRepo: Repository<CustomerPayment>,
    @InjectRepository(SalesReturn)
    private returnRepo: Repository<SalesReturn>,
    @InjectRepository(SalesReturnItem)
    private returnItemRepo: Repository<SalesReturnItem>,
    private inventoryService: InventoryService,
    private accountingService: AccountingService,
    private dataSource: DataSource,
  ) {}

  // Customers
  async getAllCustomers() {
    return this.customerRepo.find();
  }

  async getCustomer(id: number) {
    return this.customerRepo.findOne({ where: { id } });
  }

  async createCustomer(data: Partial<Customer>) {
    const customer = this.customerRepo.create(data);
    return this.customerRepo.save(customer);
  }

  async updateCustomer(id: number, data: Partial<Customer>) {
    await this.customerRepo.update(id, data);
    return this.customerRepo.findOne({ where: { id } });
  }

  async deleteCustomer(id: number) {
    return this.customerRepo.delete(id);
  }

  // Sales Orders
  async getAllOrders(query?: {
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, fromDate, toDate, page = 1, limit = 10 } = query || {};
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .orderBy('order.order_date', 'DESC')
      .addOrderBy('order.id', 'DESC');

    if (search) {
      qb.andWhere('(customer.name LIKE :search OR order.notes LIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (fromDate) {
      qb.andWhere('order.order_date >= :fromDate', { fromDate });
    }

    if (toDate) {
      qb.andWhere('order.order_date <= :toDate', { toDate });
    }

    const [items, total] = await qb
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
      relations: ['customer'],
    });
  }

  async createOrder(data: {
    customer_id: number;
    total_amount: number;
    notes?: string;
    order_date?: string;
    items: any[];
  }) {
    const order = this.orderRepo.create({
      customer_id: data.customer_id,
      total_amount: data.total_amount,
      notes: data.notes,
      order_date: data.order_date ? new Date(data.order_date) : new Date(),
    });
    const savedOrder = await this.orderRepo.save(order);

    for (const item of data.items) {
      const orderItem = this.orderItemRepo.create({
        order_id: savedOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      });
      await this.orderItemRepo.save(orderItem);
    }

    // 3. Post to Accounting
    await this.accountingService.postAutomaticEntry({
      type: 'SALE',
      amount: data.total_amount,
      reference: `ORD-${savedOrder.id}`,
      description: `بيع - فاتورة رقم ${savedOrder.id}`,
    });

    return savedOrder;
  }

  async getOrderItems(orderId: number) {
    return this.orderItemRepo.find({
      where: { order_id: orderId },
      relations: ['product'],
    });
  }

  // Quotes
  async getAllQuotes() {
    return this.quoteRepo.find({ relations: ['customer'] });
  }

  async getQuote(id: number) {
    return this.quoteRepo.findOne({
      where: { id },
      relations: ['customer'],
    });
  }

  async createQuote(data: {
    customer_id: number;
    total_amount: number;
    notes?: string;
    status?: QuoteStatus;
  }) {
    const quote = this.quoteRepo.create({
      customer_id: data.customer_id,
      total_amount: data.total_amount,
      notes: data.notes,
      status: data.status || QuoteStatus.DRAFT,
    });
    return this.quoteRepo.save(quote);
  }

  async updateQuoteStatus(id: number, status: QuoteStatus) {
    await this.quoteRepo.update(id, { status });
    return this.quoteRepo.findOne({ where: { id } });
  }

  async convertToOrder(id: number) {
    const quote = await this.quoteRepo.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status === QuoteStatus.CONVERTED) {
      throw new Error('Quote already converted to order');
    }

    // Create order from quote
    const order = this.orderRepo.create({
      customer_id: quote.customer_id,
      total_amount: quote.total_amount,
      notes: quote.notes,
    });
    const savedOrder = await this.orderRepo.save(order);

    // Update quote status
    await this.quoteRepo.update(id, { status: QuoteStatus.CONVERTED });

    return savedOrder;
  }

  async deleteQuote(id: number) {
    return this.quoteRepo.delete(id);
  }

  // Customer Payments
  async addPayment(data: {
    customer_id: number;
    amount: number;
    payment_date: string;
    notes?: string;
  }) {
    const payment = this.paymentRepo.create({
      ...data,
      payment_date: new Date(data.payment_date),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    // Update customer balance (Sales increase balance, Payments decrease it)
    const customer = await this.customerRepo.findOne({
      where: { id: data.customer_id },
    });
    if (customer) {
      customer.balance = Number(customer.balance) - Number(data.amount);
      await this.customerRepo.save(customer);

      // Post to Accounting
      await this.accountingService.postAutomaticEntry({
        type: 'PAYMENT',
        amount: data.amount,
        reference: `PAY-CUST-${savedPayment.id}`,
        description: `تحصيل من عميل: ${customer.name}`,
        partnerId: customer.id,
      });
    }

    return savedPayment;
  }

  async getCustomerPayments(customerId: number) {
    return this.paymentRepo.find({
      where: { customer_id: customerId },
      order: { payment_date: 'DESC' },
    });
  }

  async getStatementOfAccount(customerId: number) {
    const orders = await this.orderRepo.find({
      where: { customer_id: customerId },
      order: { created_at: 'ASC' },
    });

    const payments = await this.paymentRepo.find({
      where: { customer_id: customerId },
      order: { payment_date: 'ASC' },
    });

    const movements = [
      ...orders.map((o) => ({
        date: o.created_at,
        description: `بيع - فاتورة رقم ${o.id}`,
        debit: Number(o.total_amount),
        credit: 0,
        type: 'ORDER',
        ref: o.id,
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
      return { ...m, balance: runningBalance };
    });
  }

  // Sales Returns
  async getAllReturns() {
    return this.returnRepo.find({ relations: ['customer'] });
  }

  async getReturn(id: number) {
    return this.returnRepo.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });
  }

  async createReturn(data: {
    customer_id: number;
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
      const salesReturn = queryRunner.manager.create(SalesReturn, {
        customer_id: data.customer_id,
        order_id: data.order_id,
        total_amount: data.total_amount,
        reason: data.reason,
        return_date: data.return_date ? new Date(data.return_date) : new Date(),
      });
      const savedReturn = await queryRunner.manager.save(
        SalesReturn,
        salesReturn,
      );

      for (const item of data.items) {
        const returnItem = queryRunner.manager.create(SalesReturnItem, {
          return_id: savedReturn.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        });
        await queryRunner.manager.save(SalesReturnItem, returnItem);

        // 1. Add stock back (IN)
        await this.inventoryService.addStockMovement(
          {
            product_id: item.product_id,
            warehouse_id: 1, // Main warehouse
            type: 'IN' as any,
            quantity: item.quantity,
            notes: `مرتجع مبيعات - رقم ${savedReturn.id}`,
            date: savedReturn.return_date,
          },
          queryRunner.manager,
        );
      }

      // 2. Update Customer Balance (Decrease debt)
      const customer = await queryRunner.manager.findOne(Customer, {
        where: { id: data.customer_id },
      });
      if (customer) {
        customer.balance = Number(customer.balance) - Number(data.total_amount);
        await queryRunner.manager.save(Customer, customer);
      }

      // 3. Post to Accounting
      await this.accountingService.postAutomaticEntry({
        type: 'SALE',
        amount: -data.total_amount, // Reverse SALE
        reference: `RET-SALE-${savedReturn.id}`,
        description: `مرتجع مبيعات - رقم ${savedReturn.id}`,
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

  async exportOrdersToExcel() {
    const orders = await this.orderRepo.find({
      relations: ['customer'],
      order: { order_date: 'DESC' },
    });
    const data = orders.map((o) => ({
      ID: o.id,
      Customer: o.customer?.name || '',
      'Customer Phone': o.customer?.phone || '',
      'Total Amount': o.total_amount,
      'Order Date': o.order_date,
      Status: o.status || 'PENDING',
      Notes: o.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SalesOrders');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async exportCustomersToExcel() {
    const customers = await this.customerRepo.find({
      order: { name: 'ASC' },
    });
    const data = customers.map((c) => ({
      ID: c.id,
      Name: c.name,
      Phone: c.phone || '',
      Email: c.email || '',
      Address: c.address || '',
      Balance: c.balance || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

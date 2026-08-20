import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { PurchaseOrder } from '../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity';
import { SupplierPayment } from '../entities/supplier-payment.entity';
import { PurchaseReturn } from '../entities/purchase-return.entity';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class PurchaseReportsService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private orderRepo: Repository<PurchaseOrder>,
    @InjectRepository(SupplierPayment)
    private paymentRepo: Repository<SupplierPayment>,
    @InjectRepository(PurchaseReturn)
    private returnRepo: Repository<PurchaseReturn>,
    private cache: CacheService,
    private dataSource: DataSource,
  ) {}

  async getSupplierAging(): Promise<
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
    const cacheKey = 'reports:supplier-aging';
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;
    const suppliers = await this.supplierRepo.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });

    const allOrders = await this.orderRepo.find({
      select: ['supplier_id', 'order_date', 'created_at', 'total_amount'],
      order: { supplier_id: 'ASC', order_date: 'ASC' },
    });

    const allPayments = await this.paymentRepo.find({
      select: ['supplier_id', 'payment_date', 'amount'],
      order: { supplier_id: 'ASC', payment_date: 'ASC' },
    });

    const allReturns = await this.returnRepo.find({
      select: ['supplier_id', 'return_date', 'total_amount'],
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
    const result = suppliers.map((supplier) => {
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
        total: Math.round(total * 100) / 100,
        current: Math.round(buckets.current * 100) / 100,
        days1_30: Math.round(buckets.days1_30 * 100) / 100,
        days31_60: Math.round(buckets.days31_60 * 100) / 100,
        days61_90: Math.round(buckets.days61_90 * 100) / 100,
        over90: Math.round(buckets.over90 * 100) / 100,
      };
    });
    await this.cache.set(cacheKey, result, 120);
    return result;
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
      return { ...m, balance: Math.round(runningBalance * 100) / 100 };
    });
  }

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
      price:
        Number(row.landed_cost || 0) > 0
          ? Number(row.landed_cost)
          : Number(row.price),
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
          price:
            Number(row.landed_cost || 0) > 0
              ? Number(row.landed_cost)
              : Number(row.price),
          date: row.ref_date ? new Date(row.ref_date).toISOString() : null,
        };
      }
    }
    return result;
  }
}

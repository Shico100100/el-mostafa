import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { SalesOrder, OrderStatus } from '../../sales/entities/sales-order.entity';
import { Customer } from '../../sales/entities/customer.entity';

@Injectable()
export class AgedReceivablesService {
  constructor(
    @InjectRepository(SalesOrder) private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  async generate(): Promise<any> {
    const customers = await this.customerRepo.find({ order: { name: 'ASC' } });
    const customerMap = new Map<number, string>();
    for (const c of customers) {
      customerMap.set(c.id, c.name);
    }

    const orders = await this.salesOrderRepo.find({
      where: { status: Not(OrderStatus.CANCELLED) },
      order: { order_date: 'ASC' },
    });

    const today = new Date();
    const customerBuckets = new Map<number, { current: number; days_30: number; days_60: number; days_90: number; days_120: number; total: number }>();

    for (const order of orders) {
      if (!order.customer_id) continue;
      const outstanding = Number(order.total_amount);
      if (outstanding <= 0) continue;

      const orderDate = new Date(order.order_date);
      const daysDiff = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

      if (!customerBuckets.has(order.customer_id)) {
        customerBuckets.set(order.customer_id, { current: 0, days_30: 0, days_60: 0, days_90: 0, days_120: 0, total: 0 });
      }

      const buckets = customerBuckets.get(order.customer_id)!;
      buckets.total += outstanding;

      if (daysDiff <= 30) {
        buckets.current += outstanding;
      } else if (daysDiff <= 60) {
        buckets.days_30 += outstanding;
      } else if (daysDiff <= 90) {
        buckets.days_60 += outstanding;
      } else if (daysDiff <= 120) {
        buckets.days_90 += outstanding;
      } else {
        buckets.days_120 += outstanding;
      }
    }

    const summary = { current: 0, days_30: 0, days_60: 0, days_90: 0, days_120: 0 };
    const items = [];

    for (const [customerId, buckets] of customerBuckets) {
      items.push({
        customer_id: customerId,
        name: customerMap.get(customerId) || `عميل #${customerId}`,
        balance: buckets.total,
        current: buckets.current,
        days_30: buckets.days_30,
        days_60: buckets.days_60,
        days_90: buckets.days_90,
        days_120: buckets.days_120,
        total: buckets.total,
      });
      summary.current += buckets.current;
      summary.days_30 += buckets.days_30;
      summary.days_60 += buckets.days_60;
      summary.days_90 += buckets.days_90;
      summary.days_120 += buckets.days_120;
    }

    items.sort((a, b) => b.total - a.total);

    return {
      generated_at: new Date(),
      summary,
      total: Object.values(summary).reduce((s, v) => s + v, 0),
      items,
    };
  }
}

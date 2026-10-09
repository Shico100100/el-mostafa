import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../entities/sales-order.entity';
import { SalesOrderItem } from '../entities/sales-order-item.entity';
import { jsonToSheetBuffer } from '../../utils/excel-export';

@Injectable()
export class SalesOrderService {
  constructor(
    @InjectRepository(SalesOrder)
    private orderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private orderItemRepo: Repository<SalesOrderItem>,
  ) {}

  async getAllOrders(query?: {
    search?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
    delivered?: string;
    payment?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      fromDate,
      toDate,
      status,
      delivered,
      payment,
      page = 1,
      limit = 10,
    } = query || {};
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .orderBy('order.order_date', 'DESC')
      .addOrderBy('order.id', 'DESC');

    if (search) {
      qb.andWhere(
        '(customer.name LIKE :search OR order.notes LIKE :search OR CAST(order.id AS CHAR) LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (fromDate) {
      qb.andWhere('order.order_date >= :fromDate', { fromDate });
    }

    if (toDate) {
      qb.andWhere('order.order_date <= :toDate', { toDate });
    }

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    if (delivered === 'yes') {
      qb.andWhere('order.delivered_at IS NOT NULL');
    } else if (delivered === 'no') {
      qb.andWhere('order.delivered_at IS NULL');
    }

    if (payment === 'unpaid' || payment === 'partial' || payment === 'paid') {
      // NOTE: zero/negative-total rows (synced voids/adjustments) carry
      // nothing to pay, so they only ever match the unfiltered list.
      const paidExpr = `(SELECT COALESCE(SUM(p.amount), 0) FROM customer_payments p WHERE p.order_id = order.id)`;
      if (payment === 'unpaid') {
        qb.andWhere(`order.total_amount > 0 AND ${paidExpr} <= 0`);
      } else if (payment === 'paid') {
        qb.andWhere(
          `order.total_amount > 0 AND ${paidExpr} >= order.total_amount`,
        );
      } else {
        qb.andWhere(`${paidExpr} > 0 AND ${paidExpr} < order.total_amount`);
      }
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const paidMap = await this.getPaidMap(items.map((o) => o.id));

    return {
      items: items.map((o) => this.withPayment(o, paidMap.get(o.id) || 0)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async getPaidMap(orderIds: number[]): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    if (orderIds.length === 0) return map;
    const rows = await this.orderItemRepo.manager
      .createQueryBuilder()
      .select('p.order_id', 'order_id')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'paid')
      .from('customer_payments', 'p')
      .where('p.order_id IN (:...ids)', { ids: orderIds })
      .groupBy('p.order_id')
      .getRawMany();
    for (const r of rows) map.set(Number(r.order_id), Number(r.paid));
    return map;
  }

  private withPayment(order: SalesOrder, paid: number) {
    const roundedPaid = Math.round(paid * 100) / 100;
    const total = Number(order.total_amount);
    return {
      ...order,
      paid_amount: roundedPaid,
      remaining: Math.round(Math.max(0, total - roundedPaid) * 100) / 100,
    };
  }

  async getOrder(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!order) return order;
    const paidMap = await this.getPaidMap([order.id]);
    return this.withPayment(order, paidMap.get(order.id) || 0);
  }

  async getOrderItems(orderId: number) {
    return this.orderItemRepo.find({
      where: { order: { id: orderId } },
      relations: ['product'],
    });
  }

  async exportOrdersToExcel() {
    const orders = await this.orderRepo.find({
      relations: ['customer'],
      order: { order_date: 'DESC' },
    });
    const paidMap = await this.getPaidMap(orders.map((o) => o.id));
    const data = orders.map((o) => {
      const withPay = this.withPayment(o, paidMap.get(o.id) || 0);
      return {
        ID: o.id,
        Customer: o.customer?.name || '',
        'Customer Phone': o.customer?.phone || '',
        'Total Amount': o.total_amount,
        Discount: `${o.discount_type || 'none'}:${o.discount_value || 0}`,
        Paid: withPay.paid_amount,
        Remaining: withPay.remaining,
        'Order Date': o.order_date,
        Delivered: o.delivered_at ? o.delivered_at : '',
        Status: o.status || 'PENDING',
        Notes: o.notes || '',
      };
    });
    return jsonToSheetBuffer(data, 'SalesOrders');
  }
}

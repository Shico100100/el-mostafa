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
    const data = orders.map((o) => ({
      ID: o.id,
      Customer: o.customer?.name || '',
      'Customer Phone': o.customer?.phone || '',
      'Total Amount': o.total_amount,
      'Order Date': o.order_date,
      Status: o.status || 'PENDING',
      Notes: o.notes || '',
    }));
    return jsonToSheetBuffer(data, 'SalesOrders');
  }
}

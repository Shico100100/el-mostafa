import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { Customer } from '../../sales/entities/customer.entity';

@Injectable()
export class SalesByCustomerService {
  constructor(
    @InjectRepository(SalesOrder) private salesRepo: Repository<SalesOrder>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  async generate(startDate?: string, endDate?: string) {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const data = await this.salesRepo
      .createQueryBuilder('order')
      .leftJoin('order.customer', 'customer')
      .select('customer.id', 'customer_id')
      .addSelect('customer.name', 'customer_name')
      .addSelect('COUNT(order.id)', 'order_count')
      .addSelect('SUM(order.total_amount)', 'total_amount')
      .addSelect('MIN(order.order_date)', 'first_order')
      .addSelect('MAX(order.order_date)', 'last_order')
      .where('order.order_date BETWEEN :start AND :end', { start, end })
      .andWhere('customer.id IS NOT NULL')
      .groupBy('customer.id')
      .addGroupBy('customer.name')
      .orderBy('total_amount', 'DESC')
      .getRawMany();

    return {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      customers: data.map((d) => ({
        customer_id: d.customer_id,
        customer_name: d.customer_name,
        order_count: Number(d.order_count),
        total_amount: Number(d.total_amount),
        first_order: d.first_order,
        last_order: d.last_order,
      })),
      grand_total: data.reduce((sum, d) => sum + Number(d.total_amount), 0),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity';

@Injectable()
export class PriceHistoryService {
  constructor(
    @InjectRepository(PurchaseOrderItem)
    private poItemRepo: Repository<PurchaseOrderItem>,
  ) {}

  async getHistory(productId?: number) {
    const qb = this.poItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .innerJoin('item.product', 'product')
      .select('product.id', 'product_id')
      .addSelect('product.name', 'product_name')
      .addSelect('order.order_date', 'order_date')
      .addSelect('item.price', 'price')
      .addSelect('item.quantity', 'quantity')
      .addSelect('order.invoice_number', 'invoice_number')
      .orderBy('order.order_date', 'DESC');

    if (productId) {
      qb.andWhere('product.id = :productId', { productId });
    }

    const items = await qb.getRawMany();

    const grouped = new Map<number, any>();
    for (const item of items) {
      const pid = item.product_id;
      if (!grouped.has(pid)) {
        grouped.set(pid, {
          product_id: pid,
          product_name: item.product_name,
          prices: [],
        });
      }
      grouped.get(pid)!.prices.push({
        date: item.order_date,
        price: Number(item.price),
        quantity: Number(item.quantity),
        invoice: item.invoice_number,
      });
    }

    return Array.from(grouped.values());
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ManufacturingOrder,
  ManufacturingOrderStatus,
} from './entities/manufacturing-order.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';
import { Product } from '../inventory/entities/product.entity';

@Injectable()
export class ManufacturingOrderService {
  constructor(
    @InjectRepository(ManufacturingOrder)
    private moRepo: Repository<ManufacturingOrder>,
    @InjectRepository(SalesOrder)
    private orderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private orderItemRepo: Repository<SalesOrderItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  // Create manufacturing orders for all FINISHED/SEMI items in a sales order
  async createFromSalesOrder(salesOrderId: number) {
    const items = await this.orderItemRepo.find({
      where: { order_id: salesOrderId },
      relations: ['product'],
    });

    const created: ManufacturingOrder[] = [];
    for (const item of items) {
      if (item.product.type === 'RAW') continue; // Skip raw materials

      const mo = this.moRepo.create({
        sales_order_id: salesOrderId,
        sales_order_item_id: item.id,
        product_id: item.product_id,
        quantity_required: Number(item.quantity),
        quantity_produced: 0,
        status: ManufacturingOrderStatus.PENDING,
      });
      created.push(await this.moRepo.save(mo));
    }
    return created;
  }

  // Get all manufacturing orders with optional filters
  async findAll(filters?: { status?: string; sales_order_id?: number }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.sales_order_id) where.sales_order_id = filters.sales_order_id;
    return this.moRepo.find({
      where,
      relations: ['product'],
      order: { created_at: 'DESC' },
    });
  }

  // Get manufacturing orders for a specific sales order
  async findBySalesOrder(salesOrderId: number) {
    return this.moRepo.find({
      where: { sales_order_id: salesOrderId },
      relations: ['product'],
    });
  }

  // Update status (e.g., when production starts/completes)
  async updateStatus(id: number, status: ManufacturingOrderStatus) {
    const update: any = { status };
    if (status === ManufacturingOrderStatus.COMPLETED) {
      update.completed_at = new Date();
    }
    await this.moRepo.update(id, update);
    return this.moRepo.findOne({ where: { id }, relations: ['product'] });
  }

  // Update produced quantity
  async updateProduced(id: number, quantity: number) {
    const mo = await this.moRepo.findOne({ where: { id } });
    if (!mo) throw new Error('Manufacturing order not found');
    mo.quantity_produced = Number(mo.quantity_produced) + quantity;
    if (mo.quantity_produced >= mo.quantity_required) {
      mo.status = ManufacturingOrderStatus.COMPLETED;
      mo.completed_at = new Date();
    }
    return this.moRepo.save(mo);
  }
}

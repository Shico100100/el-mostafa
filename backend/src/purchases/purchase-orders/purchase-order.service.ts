import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrder } from '../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity';
import { Product } from '../../inventory/entities/product.entity';
import { MovementType } from '../../inventory/entities/stock-movement.entity';
import { InventoryService } from '../../inventory/inventory.service';
import { AccountingService } from '../../accounting/accounting.service';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private orderRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private orderItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private dataSource: DataSource,
    private inventoryService: InventoryService,
    private accountingService: AccountingService,
    private cache: CacheService,
  ) {}

  async getAllOrders(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      fromDate?: string;
      toDate?: string;
    } = {},
  ) {
    const { page = 1, limit = 10, search, fromDate, toDate } = options;
    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.supplier', 'supplier')
      .orderBy('order.created_at', 'DESC');

    if (search) {
      query.andWhere(
        '(supplier.name LIKE :search OR order.invoice_number LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (fromDate) {
      query.andWhere('order.order_date >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('order.order_date <= :toDate', { toDate });
    }

    const [items, total] = await query
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
      relations: ['supplier'],
    });
  }

  async getOrderItems(orderId: number) {
    return this.orderItemRepo.find({
      where: { order_id: orderId },
      relations: ['product'],
    });
  }

  async createOrder(data: {
    supplier_id: number;
    total_amount: number;
    notes?: string;
    order_date?: string;
    invoice_number?: string;
    items: Array<{
      product_id: number;
      quantity: number;
      price: number;
      total: number;
    }>;
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
      await this.cache.delByPattern('reports:*');
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
      items?: Array<{
        product_id: number;
        quantity: number;
        price: number;
        total: number;
      }>;
    },
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldOrder = await queryRunner.manager.findOne(PurchaseOrder, {
        where: { id },
      });

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

      if (data.total_amount !== undefined && oldOrder) {
        await this.accountingService.postAutomaticEntry({
          type: 'PURCHASE',
          amount: -Number(oldOrder.total_amount),
          reference: `REV-PUR-${id}`,
          description: `عكس شراء - أمر رقم ${id}`,
        });
        await this.accountingService.postAutomaticEntry({
          type: 'PURCHASE',
          amount: data.total_amount,
          reference: `PUR-${id}`,
          description: `تعديل شراء - فاتورة رقم ${id}`,
        });
      }

      await this.cache.delByPattern('reports:*');

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
      const orderToDelete = await queryRunner.manager.findOne(PurchaseOrder, {
        where: { id },
      });

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

      await this.accountingService.postAutomaticEntry({
        type: 'PURCHASE',
        amount: -(orderToDelete ? Number(orderToDelete.total_amount) : 0),
        reference: `DEL-PUR-${id}`,
        description: `حذف أمر شراء رقم ${id}`,
      });

      await this.cache.delByPattern('reports:*');

      return { success: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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

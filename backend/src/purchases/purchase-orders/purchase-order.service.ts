import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrder } from '../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../entities/purchase-order-item.entity';
import { Product } from '../../inventory/entities/product.entity';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private orderRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private orderItemRepo: Repository<PurchaseOrderItem>,
    private dataSource: DataSource,
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

  async calculateLandedCost(orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'supplier'],
    });

    if (!order) throw new NotFoundException('طلب الشراء غير موجود');

    const fxRate = Number(order.exchange_rate) || 1;
    const freightCost = Number(order.freight_cost) || 0;
    const customsPercent = Number(order.customs_percent) || 0;
    const commissionPercent = Number(order.commission_percent) || 0;
    const totalWeight = Number(order.total_weight_kg) || 0;

    const breakdown = order.items.map((item) => {
      const baseCost = Number(item.price) * fxRate;
      const commission = baseCost * (commissionPercent / 100);
      const customs = baseCost * (customsPercent / 100);
      const shipping =
        totalWeight > 0 && Number(item.weight_kg) > 0
          ? (freightCost / totalWeight) * Number(item.weight_kg)
          : 0;

      const unitLandedCost = baseCost + commission + customs + shipping;
      const totalLandedCost = unitLandedCost * Number(item.quantity);

      return {
        item_id: item.id,
        product_id: item.product_id,
        product_name: item.product?.name || `Product #${item.product_id}`,
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
        fx_rate: fxRate,
        base_cost_egp: baseCost,
        commission,
        customs,
        shipping,
        unit_landed_cost: unitLandedCost,
        total_landed_cost: totalLandedCost,
        weight_kg: Number(item.weight_kg),
      };
    });

    const totalLandedCost = breakdown.reduce(
      (sum, b) => sum + b.total_landed_cost,
      0,
    );

    return {
      order_id: orderId,
      supplier: order.supplier?.name,
      invoice: order.invoice_number,
      currency: order.currency_code || 'EGP',
      fx_rate: fxRate,
      freight_cost: freightCost,
      customs_percent: customsPercent,
      commission_percent: commissionPercent,
      total_weight_kg: totalWeight,
      total_landed_cost: totalLandedCost,
      breakdown,
    };
  }

  async updateLandedCost(
    orderId: number,
    data: {
      freight_cost?: number;
      customs_percent?: number;
      commission_percent?: number;
      total_weight_kg?: number;
    },
  ) {
    const updateData: Partial<{
      freight_cost: number;
      customs_percent: number;
      commission_percent: number;
      total_weight_kg: number;
    }> = {};
    if (data.freight_cost !== undefined)
      updateData.freight_cost = data.freight_cost;
    if (data.customs_percent !== undefined)
      updateData.customs_percent = data.customs_percent;
    if (data.commission_percent !== undefined)
      updateData.commission_percent = data.commission_percent;
    if (data.total_weight_kg !== undefined)
      updateData.total_weight_kg = data.total_weight_kg;

    const result = await this.calculateLandedCost(orderId);

    // Run all writes in a single transaction so a partial failure cannot
    // leave item landed costs / product cost prices out of sync.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(PurchaseOrder, orderId, updateData);
      }

      for (const b of result.breakdown) {
        await queryRunner.manager.update(
          PurchaseOrderItem,
          b.item_id,
          { landed_cost: b.unit_landed_cost },
        );
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: b.product_id },
        });
        if (product && product.type === 'RAW') {
          await queryRunner.manager.update(Product, b.product_id, {
            cost_price: b.unit_landed_cost,
          });
        }
      }

      await queryRunner.manager.update(PurchaseOrder, orderId, {
        total_landed_cost: result.total_landed_cost,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return this.calculateLandedCost(orderId);
  }
}

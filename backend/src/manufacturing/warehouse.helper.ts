import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { BadRequestException } from '@nestjs/common';
import { Stock } from '../inventory/entities/stock.entity';
import { Product } from '../inventory/entities/product.entity';

@Injectable()
export class WarehouseHelper {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async getDefaultWarehouseId(): Promise<number> {
    const warehouse = await this.warehouseRepo.findOne({
      where: { is_active: true },
      order: { id: 'ASC' },
    });
    if (warehouse) return warehouse.id;
    const created = await this.warehouseRepo.save(
      this.warehouseRepo.create({ name: 'المستودع الرئيسي', is_active: true }),
    );
    return created.id;
  }

  async getPlasticWarehouseId(): Promise<number> {
    let warehouse = await this.warehouseRepo.findOne({
      where: { name: 'مخزن البلاستيك' },
    });
    if (warehouse) return warehouse.id;
    warehouse = await this.warehouseRepo.save(
      this.warehouseRepo.create({ name: 'مخزن البلاستيك', is_active: true }),
    );
    return warehouse.id;
  }

  async safeDeductStock(
    productId: number,
    qty: number,
    manager?: any,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Stock) : this.stockRepo;
    const stock = await repo.findOne({ where: { product_id: productId } });
    if (!stock || Number(stock.quantity) < qty) {
      const product = await this.productRepo.findOne({
        where: { id: productId },
      });
      throw new BadRequestException(
        `رصيد غير كافٍ للمنتج: ${product?.name || 'غير معروف'} (المطلوب: ${qty}, المتوفر: ${stock ? Number(stock.quantity) : 0})`,
      );
    }
    stock.quantity = Number(stock.quantity) - qty;
    await repo.save(stock);
  }
}

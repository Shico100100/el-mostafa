import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { Product } from './entities/product.entity';
import { Stock } from './entities/stock.entity';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
  ) {}

  async getAllWarehouses() {
    return this.warehouseRepo.find();
  }

  async initDefaultWarehouses() {
    const defaults = [
      { name: 'اكسسوار', location: 'مستودع الاكسسوارات والملحقات' },
      { name: 'بلاستيك', location: 'مستودع القطع البلاستيكية' },
      { name: 'تعبئة وتغليف', location: 'مستودع العلب والكراتين والتغليف' },
      { name: 'منتج تام', location: 'مستودع المنتج النهائي والتجميع' },
    ];
    const results: Array<Record<string, any>> = [];
    for (const w of defaults) {
      const existing = await this.warehouseRepo.findOne({
        where: { name: w.name },
      });
      if (!existing) {
        const created = await this.warehouseRepo.save(
          this.warehouseRepo.create(w),
        );
        results.push({ ...created, created: true });
      } else {
        results.push({ ...existing, created: false });
      }
    }
    return { warehouses: results, message: 'تم تهيئة المخازن الافتراضية' };
  }

  async getWarehouse(id: number) {
    return this.warehouseRepo.findOne({ where: { id } });
  }

  async getWarehouseStock(warehouseId: number) {
    const products = await this.productRepo.find({
      where: { warehouse: { id: warehouseId } },
    });
    if (products.length === 0) return [];
    const productIds = products.map((p) => p.id);
    const stocks = await this.stockRepo
      .createQueryBuilder('stock')
      .select('stock.product_id', 'product_id')
      .addSelect('SUM(stock.quantity)', 'total')
      .where('stock.product_id IN (:...productIds)', { productIds })
      .groupBy('stock.product_id')
      .getRawMany();
    const stockMap = new Map(
      stocks.map((s) => [Number(s.product_id), Number(s.total)]),
    );
    return products
      .map((p) => ({
        product_id: p.id,
        product_name: p.name,
        product_sku: p.sku,
        product_type: p.type,
        quantity: stockMap.get(p.id) || 0,
        unit: p.unit,
      }))
      .filter((p) => p.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity);
  }

  async createWarehouse(data: Partial<Warehouse>) {
    return this.warehouseRepo.save(this.warehouseRepo.create(data));
  }

  async updateWarehouse(id: number, data: Partial<Warehouse>) {
    await this.warehouseRepo.update(id, data);
    return this.warehouseRepo.findOne({ where: { id } });
  }

  async deleteWarehouse(id: number) {
    return this.warehouseRepo.delete(id);
  }
}

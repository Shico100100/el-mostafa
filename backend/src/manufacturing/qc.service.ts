import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QCInspection } from './entities/qc-inspection.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { Product } from '../inventory/entities/product.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';

@Injectable()
export class QCService {
  constructor(
    @InjectRepository(QCInspection)
    private qcRepo: Repository<QCInspection>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private stockMovementRepo: Repository<StockMovement>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
  ) {}

  private async getPlasticWarehouseId(): Promise<number> {
    let warehouse = await this.warehouseRepo.findOne({
      where: { name: 'مخزن البلاستيك' },
    });
    if (warehouse) return warehouse.id;

    warehouse = await this.warehouseRepo.save(
      this.warehouseRepo.create({ name: 'مخزن البلاستيك', is_active: true }),
    );
    return warehouse.id;
  }

  async getPendingInspections() {
    return this.productionRepo.find({
      where: { status: 'PENDING' },
      relations: ['machine', 'mold', 'raw_material'],
      order: { date: 'DESC', id: 'DESC' },
    });
  }

  async getRecentInspections(limit = 50) {
    return this.qcRepo.find({
      relations: [
        'production',
        'product',
        'inspector',
        'production.machine',
        'production.mold',
      ],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async createInspection(data: any) {
    const { production_id, status, defects_count, notes, inspector_id } = data;

    const production = await this.productionRepo.findOne({
      where: { id: production_id },
      relations: ['mold'],
    });

    if (!production) throw new Error('Production record not found');

    // 1. Create QC record
    const inspection = this.qcRepo.create({
      production_id,
      product_id: production.mold?.product_id,
      status,
      defects_count,
      notes,
      inspector_id,
    });

    const savedInspection = await this.qcRepo.save(inspection);

    // 2. Update production status
    production.status = status === 'PASS' ? 'QC_PASS' : 'QC_FAIL';
    await this.productionRepo.save(production);

    // 3. Handle stock adjustment if FAIL
    if (status === 'FAIL') {
      const productName = `بلاستيك ${production.mold.name}`;
      const product = await this.productRepo.findOne({
        where: { name: productName, type: 'SEMI_FINISHED' },
      });

      if (product) {
        const stock = await this.stockRepo.findOne({
          where: { product_id: product.id },
        });
        if (stock) {
          const qtyToDeduct = Number(production.pieces_produced);
          stock.quantity = Number(stock.quantity) - qtyToDeduct;
          await this.stockRepo.save(stock);

          await this.stockMovementRepo.save({
            product_id: product.id,
            warehouse_id: stock.warehouse_id || (await this.getPlasticWarehouseId()),
            type: 'OUT' as any,
            quantity: qtyToDeduct,
            reference_type: 'QC_REJECTION',
            reference_id: savedInspection.id,
            date: new Date(),
            notes: `Rejected by QC #${savedInspection.id}. Production #${production.id}`,
          });
        }
      }
    }

    return savedInspection;
  }

  async getStats() {
    const total = await this.qcRepo.count();
    const passed = await this.qcRepo.count({ where: { status: 'PASS' } });
    const failed = await this.qcRepo.count({ where: { status: 'FAIL' } });

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
    };
  }
}

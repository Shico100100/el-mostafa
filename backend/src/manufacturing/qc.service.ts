import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QCInspection } from './entities/qc-inspection.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { Stock } from '../inventory/entities/stock.entity';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';
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
    private dataSource: DataSource,
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
      relations: ['machine', 'mold', 'product'],
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

    if (!production) throw new NotFoundException('سجل الإنتاج غير موجود');

    const plasticWhId = await this.getPlasticWarehouseId();

    return this.dataSource.transaction(async (manager) => {
      const qcRepo = manager.getRepository(QCInspection);
      const productionRepo = manager.getRepository(DailyProduction);
      const stockRepo = manager.getRepository(Stock);
      const stockMovementRepo = manager.getRepository(StockMovement);
      const productRepo = manager.getRepository(Product);

      const inspection = qcRepo.create({
        production_id,
        product_id: production.mold?.product_id,
        status,
        defects_count,
        notes,
        inspector_id,
      });
      const savedInspection = await qcRepo.save(inspection);

      production.status = status === 'PASS' ? 'QC_PASS' : 'QC_FAIL';
      await productionRepo.save(production);

      if (status === 'FAIL') {
        const productName = `بلاستيك ${production.mold?.name || 'Unknown'}`;
        const product = await productRepo.findOne({
          where: { name: productName, type: 'SEMI_FINISHED' },
        });

        if (product) {
          const stock = await stockRepo.findOne({
            where: { product_id: product.id },
          });
          if (stock) {
            const qtyToDeduct = Number(production.pieces_produced);
            stock.quantity = Number(stock.quantity) - qtyToDeduct;
            await stockRepo.save(stock);

            await stockMovementRepo.save({
              product_id: product.id,
              warehouse_id: stock.warehouse_id || plasticWhId,
              type: MovementType.OUT,
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
    });
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

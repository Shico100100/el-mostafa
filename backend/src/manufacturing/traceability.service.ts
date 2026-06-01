import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ProductionBatch, BatchStatus } from './entities/production-batch.entity';
import { BatchComponent } from './entities/batch-component.entity';
import { DailyProduction } from './entities/daily-production.entity';

@Injectable()
export class TraceabilityService {
  constructor(
    @InjectRepository(ProductionBatch)
    private readonly batchRepo: Repository<ProductionBatch>,
    @InjectRepository(BatchComponent)
    private readonly componentRepo: Repository<BatchComponent>,
    @InjectRepository(DailyProduction)
    private readonly productionRepo: Repository<DailyProduction>,
  ) {}

  async findAll(status?: BatchStatus): Promise<ProductionBatch[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.batchRepo.find({
      where,
      relations: ['product'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ProductionBatch> {
    const batch = await this.batchRepo.findOne({
      where: { id },
      relations: ['product', 'components', 'components.raw_material', 'components.accessory'],
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async generateBatchNumber(): Promise<string> {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const prefix = `BATCH-${y}${m}${d}-`;
    const last = await this.batchRepo
      .createQueryBuilder('b')
      .where('b.batch_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('b.batch_number', 'DESC')
      .getOne();
    const seq = last ? String(Number(last.batch_number.split('-').pop()) + 1).padStart(4, '0') : '0001';
    return `${prefix}${seq}`;
  }

  async create(dto: {
    product_id: number;
    production_date: string;
    expiry_date?: string;
    quantity: number;
    unit?: string;
    notes?: string;
    production_id?: number;
    created_by?: number;
    components?: {
      raw_material_id?: number;
      accessory_id?: number;
      supplier_batch_number?: string;
      quantity_used: number;
      unit?: string;
      cost_per_unit?: number;
    }[];
  }): Promise<ProductionBatch> {
    const batch_number = await this.generateBatchNumber();
    let production: DailyProduction | null = null;
    if (dto.production_id) {
      production = await this.productionRepo.findOne({ where: { id: dto.production_id } });
      if (!production) throw new BadRequestException('Production record not found');
    }
    const batch = this.batchRepo.create({
      batch_number,
      product_id: dto.product_id,
      production_date: new Date(dto.production_date),
      expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : undefined,
      quantity: dto.quantity,
      unit: dto.unit || 'piece',
      notes: dto.notes,
      production_id: dto.production_id,
      created_by: dto.created_by,
      status: BatchStatus.PENDING,
    });
    const saved = await this.batchRepo.save(batch);
    if (dto.components?.length) {
      const components = dto.components.map((c) =>
        this.componentRepo.create({
          batch_id: saved.id,
          raw_material_id: c.raw_material_id,
          accessory_id: c.accessory_id,
          supplier_batch_number: c.supplier_batch_number,
          quantity_used: c.quantity_used,
          unit: c.unit || 'piece',
          cost_per_unit: c.cost_per_unit || 0,
          total_cost: (c.cost_per_unit || 0) * c.quantity_used,
        }),
      );
      await this.componentRepo.save(components);
    }
    return this.findOne(saved.id);
  }

  async updateStatus(id: number, status: BatchStatus): Promise<ProductionBatch> {
    const batch = await this.findOne(id);
    batch.status = status;
    return this.batchRepo.save(batch);
  }

  async recall(id: number, reason?: string): Promise<ProductionBatch> {
    const batch = await this.findOne(id);
    batch.status = BatchStatus.RECALLED;
    if (reason) batch.notes = batch.notes ? `${batch.notes}\nRecall: ${reason}` : `Recall: ${reason}`;
    return this.batchRepo.save(batch);
  }

  async getExpiring(days: number): Promise<ProductionBatch[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return this.batchRepo.find({
      where: {
        expiry_date: LessThanOrEqual(threshold),
        status: BatchStatus.RELEASED,
      },
      relations: ['product'],
      order: { expiry_date: 'ASC' },
    });
  }

  async forwardTrace(supplierBatchNumber: string): Promise<{
    supplierBatchNumber: string;
    batches: ProductionBatch[];
  }> {
    const components = await this.componentRepo.find({
      where: { supplier_batch_number: supplierBatchNumber },
      relations: ['batch', 'batch.product'],
    });
    const batchIds = [...new Set(components.map((c) => c.batch_id))];
    const batches = await this.batchRepo.find({
      where: batchIds.map((id) => ({ id })),
      relations: ['product'],
    });
    return { supplierBatchNumber, batches };
  }

  async backwardTrace(batchId: number): Promise<{
    batch: ProductionBatch;
    components: BatchComponent[];
  }> {
    const batch = await this.findOne(batchId);
    return { batch, components: batch.components || [] };
  }
}

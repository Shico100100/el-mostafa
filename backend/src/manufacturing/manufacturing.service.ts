import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { BOM } from './entities/bom.entity';
import { Mold } from './entities/mold.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { RangeProductionSession } from './entities/range-production-session.entity';
import { Product } from '../inventory/entities/product.entity';
import { AccountingService } from '../accounting/accounting.service';
import { FixedCostService } from './fixed-cost.service';
import { WarehouseHelper } from './warehouse.helper';

@Injectable()
export class ManufacturingService {
  constructor(
    private warehouseHelper: WarehouseHelper,
    private accountingService: AccountingService,
    private fixedCostService: FixedCostService,
    private dataSource: DataSource,

    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(RangeProductionSession)
    private sessionRepo: Repository<RangeProductionSession>,
    @InjectRepository(Mold)
    private moldRepo: Repository<Mold>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(BOM)
    private bomRepo: Repository<BOM>,
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
  ) {}

  // ==================== COMPLEX TRANSACTIONS (keep here) ====================

  async getManufacturingOrders() {
    return this.dataSource.query(
      `SELECT mo.id, mo.sales_order_id, mo.sales_order_item_id, mo.product_id,
              p.name AS product_name,
              mo.quantity_required, mo.quantity_produced, mo.status, mo.priority,
              mo.due_date, mo.notes, mo.completed_at, mo.created_at
       FROM manufacturing_orders mo
       LEFT JOIN products p ON p.id = mo.product_id
       ORDER BY mo.created_at DESC`,
    );
  }

  async getManufacturingOrder(id: number) {
    const rows = await this.dataSource.query(
      `SELECT mo.id, mo.sales_order_id, mo.sales_order_item_id, mo.product_id,
              p.name AS product_name,
              mo.quantity_required, mo.quantity_produced, mo.status, mo.priority,
              mo.due_date, mo.notes, mo.completed_at, mo.created_at
       FROM manufacturing_orders mo
       LEFT JOIN products p ON p.id = mo.product_id
       WHERE mo.id = $1`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('أمر إنتاج غير موجود');
    return rows[0];
  }

  async getManufacturingStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeMachines = await this.machineRepo.count({
      where: { status: 'ACTIVE' as any },
    });
    const dailyProductionOrders = await this.productionRepo.count({
      where: { date: todayStr as unknown as Date },
    });
    const productions = await this.productionRepo.find({
      where: { date: todayStr as unknown as Date },
      select: ['mold_id'],
    });
    const usedMoldsCount = new Set(productions.map((p) => p.mold_id)).size;
    return { activeMachines, dailyProductionOrders, usedMoldsCount };
  }

  async createProduction(data: Partial<DailyProduction>) {
    let plasticWhId = 0;
    let overheadCost: number | undefined;

    if (data.mold_id && data.total_production_kg) {
      const mold = await this.moldRepo.findOne({ where: { id: data.mold_id } });
      if (mold && Number(mold.product_weight) > 0) {
        data.pieces_produced = Math.floor(
          (Number(data.total_production_kg) * 1000) /
            Number(mold.product_weight),
        );
        const prod = await this.productRepo.findOne({
          where: { id: data.product_id, type: 'RAW' },
        });
        if (!prod) throw new NotFoundException('المادة الخام غير موجودة');
        const rawMaterialPrice = Number(prod.cost_price) || 0;
        const prodDate = data.date ? new Date(data.date) : new Date();
        const monthStr = `${prodDate.getFullYear()}-${String(prodDate.getMonth() + 1).padStart(2, '0')}`;
        const hourlyCost = await this.fixedCostService.calculateHourlyCost(
          monthStr,
          data.machine_id,
        );
        const unitCost = this.fixedCostService.calculatePieceCost({
          rawMaterialPrice,
          pieceWeight: Number(mold.product_weight),
          hourlyCost,
          hoursWorked: Number(data.hours_worked || 8),
          totalPieces: Number(data.pieces_produced || 1),
        });
        overheadCost = unitCost;
        data.overhead_cost = unitCost;
      }
    }
    plasticWhId = await this.warehouseHelper.getPlasticWarehouseId();

    const savedProduction = await this.dataSource.transaction(
      async (manager) => {
        const productionRepo = manager.getRepository(DailyProduction);
        const moldRepo = manager.getRepository(Mold);
        const bomRepo = manager.getRepository(BOM);

        const production = productionRepo.create(data);
        const saved = await productionRepo.save(production);

        if (data.mold_id) {
          const mold = await moldRepo.findOne({ where: { id: data.mold_id } });
          if (mold) {
            const shots = data.pieces_produced
              ? Math.ceil(Number(data.pieces_produced) / (mold.cavities || 1))
              : 0;
            mold.current_shots = (mold.current_shots || 0) + shots;
            mold.total_production_cycles =
              (mold.total_production_cycles || 0) + 1;
            const usagePercent =
              (mold.current_shots / (mold.max_shots || 1000000)) * 100;
            if (usagePercent >= 90) mold.life_cycle_status = 'critical';
            else if (usagePercent >= 75) mold.life_cycle_status = 'warning';
            else mold.life_cycle_status = 'good';
            await moldRepo.save(mold);
          }
        }

        if (data.mold_id && data.pieces_produced) {
          const mold = await moldRepo.findOne({ where: { id: data.mold_id } });
          if (mold) {
            await this.warehouseHelper.addSemiFinishedStock(
              mold.name,
              data.pieces_produced,
              overheadCost,
              plasticWhId,
              { type: 'PRODUCTION', id: saved.id },
              manager,
            );
          }
        }

        if (data.product_id && data.total_production_kg) {
          const effectiveRmId =
            (data as any).substitute_material_id ?? data.product_id;
          await this.warehouseHelper.deductRawMaterialStock(
            effectiveRmId,
            data.total_production_kg,
            { type: 'PRODUCTION', id: saved.id },
            manager,
          );
        }

        if (data.mold_id && data.pieces_produced) {
          const mold = await moldRepo.findOne({ where: { id: data.mold_id } });
          if (mold && mold.product_id) {
            const bom = await bomRepo.findOne({
              where: { product: { id: mold.product_id } },
              relations: ['items'],
            });
            if (bom && bom.items.length > 0) {
              await this.warehouseHelper.processBOMConsumption(
                bom,
                data.pieces_produced,
                { type: 'PRODUCTION_BOM', id: saved.id },
                manager,
              );
            }
          }
        }
        return saved;
      },
    );

    // Production accounting is handled by stock movements
    // (Raw material OUT + Semi-finished product IN)
    // No separate journal entry needed to avoid double-counting inventory value

    return savedProduction;
  }

  async createRangeProduction(data: {
    machine_id: number;
    mold_id: number;
    product_id: number;
    start_date: string;
    end_date: string;
    total_production_kg: number;
    mode: 'sum' | 'distribute';
    hours_worked?: number;
    notes?: string;
    user_id?: number;
  }) {
    const session = this.sessionRepo.create({
      machine_id: data.machine_id,
      mold_id: data.mold_id,
      product_id: data.product_id,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      total_production_kg: data.total_production_kg,
      mode: data.mode,
      hours_worked: data.hours_worked ?? 8,
      notes: data.notes,
      created_by: data.user_id,
    });
    const savedSession = await this.sessionRepo.save(session);

    const results: DailyProduction[] = [];
    const errors: { date: string; error: string }[] = [];

    if (data.mode === 'sum') {
      try {
        const record = await this.createProduction({
          machine_id: data.machine_id,
          mold_id: data.mold_id,
          product_id: data.product_id,
          total_production_kg: data.total_production_kg,
          hours_worked: data.hours_worked ?? 8,
          notes: `فترة ${data.start_date} إلى ${data.end_date} - ${data.notes || ''}`,
          date: new Date(data.end_date),
          session_id: savedSession.id,
        });
        results.push(record);
      } catch (err) {
        const error = err as Error;
        errors.push({ date: data.end_date, error: error.message });
      }
    } else {
      const workingDays = this.getWorkingDaysArray(
        new Date(data.start_date),
        new Date(data.end_date),
      );
      if (workingDays.length === 0)
        throw new BadRequestException('لا توجد أيام عمل في النطاق المحدد');
      const totalKg = Number(data.total_production_kg);
      const dailyKg = Math.floor((totalKg / workingDays.length) * 100) / 100;
      let remainingKg = totalKg;
      for (let i = 0; i < workingDays.length; i++) {
        const day = workingDays[i];
        const dayKg =
          i === workingDays.length - 1
            ? Math.round(remainingKg * 100) / 100
            : dailyKg;
        remainingKg -= dailyKg;
        try {
          const record = await this.createProduction({
            machine_id: data.machine_id,
            mold_id: data.mold_id,
            product_id: data.product_id,
            total_production_kg: dayKg,
            hours_worked: data.hours_worked ?? 8,
            notes: `توزيع ${data.total_production_kg}كجم من ${data.start_date} - ${data.notes || ''}`,
            date: new Date(day),
            session_id: savedSession.id,
          });
          results.push(record);
        } catch (err) {
          errors.push({ date: day, error: (err as Error).message });
        }
      }
    }

    if (errors.length > 0 && results.length === 0) {
      await this.sessionRepo.delete(savedSession.id);
      throw new BadRequestException(
        `فشل إنشاء جميع السجلات: ${errors[0].error}`,
      );
    }
    return { session: savedSession, records: results, errors };
  }

  private getWorkingDaysArray(start: Date, end: Date): string[] {
    const days: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 5)
        days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  async deleteRangeSession(id: number) {
    const records = await this.productionRepo.find({
      where: { session_id: id },
    });
    const errors: { id: number; error: string }[] = [];
    for (const record of records) {
      try {
        await this.deleteProduction(record.id);
      } catch (err) {
        errors.push({ id: record.id, error: (err as Error).message });
      }
    }
    await this.sessionRepo.delete(id);
    return { deletedRecords: records.length, errors };
  }

  async deleteProduction(id: number) {
    const production = await this.productionRepo.findOne({
      where: { id },
      relations: ['mold', 'product'],
    });
    if (!production) throw new NotFoundException('سجل الإنتاج غير موجود');

    return this.dataSource.transaction(async (manager) => {
      const bomRepo = manager.getRepository(BOM);

      if (production.product_id && production.total_production_kg) {
        await this.warehouseHelper.reverseRawMaterialStock(
          production.product_id,
          production.total_production_kg,
          { type: 'PRODUCTION_DELETE', id },
          manager,
        );
      }

      if (production.mold && production.pieces_produced) {
        const plasticWhId = await this.warehouseHelper.getPlasticWarehouseId();
        await this.warehouseHelper.reverseSemiFinishedStock(
          production.mold.name,
          production.pieces_produced,
          plasticWhId,
          { type: 'PRODUCTION_DELETE', id },
          manager,
        );
      }

      if (
        production.mold &&
        production.pieces_produced &&
        production.mold.product_id
      ) {
        const bom = await bomRepo.findOne({
          where: { product: { id: production.mold.product_id } },
          relations: ['items'],
        });
        if (bom && bom.items.length > 0) {
          await this.warehouseHelper.reverseBOMConsumption(
            bom,
            production.pieces_produced,
            { type: 'PRODUCTION_BOM_DELETE', id },
            manager,
          );
        }
      }

      return manager.getRepository(DailyProduction).delete(id);
    });
  }

  async updateProduction(id: number, data: Partial<DailyProduction>) {
    const oldProduction = await this.productionRepo.findOne({
      where: { id },
      relations: ['mold', 'product'],
    });
    if (!oldProduction) throw new NotFoundException('سجل الإنتاج غير موجود');

    if (data.mold_id && data.total_production_kg) {
      const mold = await this.moldRepo.findOne({ where: { id: data.mold_id } });
      if (mold && Number(mold.product_weight) > 0) {
        data.pieces_produced = Math.floor(
          (Number(data.total_production_kg) * 1000) /
            Number(mold.product_weight),
        );
      }
    }

    const plasticWhId = await this.warehouseHelper.getPlasticWarehouseId();

    return this.dataSource.transaction(async (manager) => {
      const productionRepo = manager.getRepository(DailyProduction);

      if (oldProduction.product_id && oldProduction.total_production_kg) {
        await this.warehouseHelper.reverseRawMaterialStock(
          oldProduction.product_id,
          oldProduction.total_production_kg,
          { type: 'PRODUCTION_CORRECTION', id },
          manager,
        );
      }

      if (oldProduction.mold && oldProduction.pieces_produced) {
        await this.warehouseHelper.reverseSemiFinishedStock(
          oldProduction.mold.name,
          oldProduction.pieces_produced,
          plasticWhId,
          { type: 'PRODUCTION_CORRECTION', id },
          manager,
        );
      }

      await productionRepo.update(id, data);
      const updatedProduction = await productionRepo.findOne({
        where: { id },
        relations: ['mold', 'product'],
      });
      if (!updatedProduction)
        throw new BadRequestException('فشل استرجاع سجل الإنتاج المحدث');

      if (
        updatedProduction.product_id &&
        updatedProduction.total_production_kg
      ) {
        await this.warehouseHelper.deductRawMaterialStock(
          updatedProduction.product_id,
          updatedProduction.total_production_kg,
          { type: 'PRODUCTION', id },
          manager,
        );
      }

      if (updatedProduction.mold && updatedProduction.pieces_produced) {
        await this.warehouseHelper.addSemiFinishedStock(
          updatedProduction.mold.name,
          updatedProduction.pieces_produced,
          undefined,
          plasticWhId,
          { type: 'PRODUCTION', id },
          manager,
        );
      }

      return updatedProduction;
    });
  }

  async importProductionHistory(data: Record<string, any>[]) {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    for (const row of data) {
      try {
        const prodData: Record<string, any> = {
          machine_id: row['Machine ID'],
          mold_id: row['Mold ID'],
          product_id: row['Raw Material ID'],
          total_production_kg: row['Total KG'],
          hours_worked: row['Hours Worked'] ?? 8,
          notes: row['Notes'] || '',
          status: row['Status'] || 'PENDING',
        };
        if (row['Date']) {
          prodData.date =
            typeof row['Date'] === 'number'
              ? new Date((row['Date'] - 25569) * 86400 * 1000)
              : new Date(row['Date']);
        }
        if (
          !prodData.machine_id ||
          !prodData.mold_id ||
          !prodData.product_id ||
          !prodData.total_production_kg
        ) {
          throw new BadRequestException(
            'الحقول المطلوبة مفقودة: معرف الماكينة، معرف القالب، معرف المادة الخام، إجمالي الكجم',
          );
        }
        if (row['ID']) {
          const exists = await this.productionRepo.findOne({
            where: { id: row['ID'] },
          });
          if (exists) {
            await this.productionRepo.update(row['ID'], prodData);
            results.success++;
            continue;
          }
        }
        await this.createProduction(prodData);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(
          `Row ${JSON.stringify(row)}: ${(err as Error).message}`,
        );
      }
    }
    return results;
  }
}

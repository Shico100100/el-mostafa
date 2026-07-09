import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Machine, MachineStatus } from './entities/machine.entity';
import { MachineMaintenance } from './entities/machine-maintenance.entity';
import { MoldIssue } from './entities/mold-issue.entity';
import { FixedCost } from './entities/fixed-cost.entity';
import { SupplierMaterial } from './entities/supplier-material.entity';
import { BOM } from './entities/bom.entity';
import { Mold } from './entities/mold.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { ProductionRecordHistory } from './entities/production-record-history.entity';
import { RangeProductionSession } from './entities/range-production-session.entity';
import { AssemblyOrder } from './entities/assembly-order.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';
import { AccountingService } from '../accounting/accounting.service';
import { MachineService } from './machines/machine.service';
import { MoldService } from './mold.service';
import { FixedCostService } from './fixed-cost.service';
import { BOMService } from './bom.service';
import { RawMaterialService } from './raw-material.service';
import { DailyProductionService } from './daily-production.service';
import { WarehouseHelper } from './warehouse.helper';

@Injectable()
export class ManufacturingService {
  constructor(
    private machineService: MachineService,
    private moldService: MoldService,
    private fixedCostService: FixedCostService,
    private bomService: BOMService,
    private rawMaterialService: RawMaterialService,
    private dailyProductionService: DailyProductionService,
    private warehouseHelper: WarehouseHelper,
    private accountingService: AccountingService,
    private dataSource: DataSource,

    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(ProductionRecordHistory)
    private historyRepo: Repository<ProductionRecordHistory>,
    @InjectRepository(RangeProductionSession)
    private sessionRepo: Repository<RangeProductionSession>,
    @InjectRepository(Mold)
    private moldRepo: Repository<Mold>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(BOM)
    private bomRepo: Repository<BOM>,
    @InjectRepository(AssemblyOrder)
    private assemblyRepo: Repository<AssemblyOrder>,
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
  ) {}

  // ==================== DELEGATED MACHINE METHODS ====================
  async getAllMachines(page = 1, limit = 50) {
    return this.machineService.getAllMachines(page, limit);
  }
  async getMachinesOverview(filters?: {
    search?: string;
    status?: MachineStatus;
    sortBy?: 'name' | 'status' | 'next_maintenance';
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }) {
    return this.machineService.getMachinesOverview(filters);
  }
  async createMachine(data: Partial<Machine>) {
    return this.machineService.createMachine(data);
  }
  async updateMachine(id: number, data: Partial<Machine>) {
    return this.machineService.updateMachine(id, data);
  }
  async getMachinesWithStatus() {
    return this.machineService.getMachinesWithStatus();
  }
  async getMachineMaintenance(machineId?: number) {
    return this.machineService.getMachineMaintenance(machineId);
  }
  async createMaintenance(data: Partial<MachineMaintenance>) {
    return this.machineService.createMaintenance(data);
  }
  async getMachineHistory(id: number) {
    return this.machineService.getMachineHistory(id);
  }
  async exportMachines() {
    return this.machineService.exportMachines();
  }
  async importMachines(data: Partial<Machine>[]) {
    return this.machineService.importMachines(data);
  }

  // ==================== DELEGATED MOLD METHODS ====================
  async getAllMolds(page = 1, limit = 50) {
    return this.moldService.getAllMolds(page, limit);
  }
  async createMold(data: Partial<Mold>) {
    return this.moldService.createMold(data);
  }
  async updateMold(id: number, data: Partial<Mold>) {
    return this.moldService.updateMold(id, data);
  }
  async syncAllMoldProducts() {
    return this.moldService.syncAllMoldProducts();
  }
  async getSemiFinishedDetails(productId: number) {
    return this.moldService.getSemiFinishedDetails(productId);
  }
  async recalculateSemiFinishedCosts() {
    return this.moldService.recalculateSemiFinishedCosts();
  }
  async getMoldIssues(moldId?: number) {
    return this.moldService.getMoldIssues(moldId);
  }
  async createMoldIssue(data: Partial<MoldIssue>) {
    return this.moldService.createMoldIssue(data);
  }
  async updateMoldIssue(id: number, data: Partial<MoldIssue>) {
    return this.moldService.updateMoldIssue(id, data);
  }
  async getMoldStats(moldId: number) {
    return this.moldService.getMoldStats(moldId);
  }
  async getMoldHistory(moldId: number) {
    return this.moldService.getMoldHistory(moldId);
  }
  async getLastMoldForMachine(machineId: number) {
    return this.moldService.getLastMoldForMachine(machineId);
  }
  async exportMolds() {
    return this.moldService.exportMolds();
  }
  async importMolds(data: Partial<Mold>[]) {
    return this.moldService.importMolds(data);
  }

  // ==================== DELEGATED FIXED COST METHODS ====================
  async createFixedCost(data: Partial<FixedCost>) {
    return this.fixedCostService.createFixedCost(data);
  }
  async getFixedCosts(month?: string, year?: string, page = 1, limit = 50) {
    return this.fixedCostService.getFixedCosts(month, year, page, limit);
  }
  async deleteFixedCost(id: number) {
    return this.fixedCostService.deleteFixedCost(id);
  }
  async calculateOverheadRate(month: string) {
    return this.fixedCostService.calculateOverheadRate(month);
  }

  // ==================== DELEGATED BOM METHODS ====================
  async getBOMs(page = 1, limit = 50) {
    return this.bomService.getBOMs(page, limit);
  }
  async createBOM(data: Partial<BOM>) {
    return this.bomService.createBOM(data);
  }
  async getBOM(id: number) {
    return this.bomService.getBOM(id);
  }
  async updateBOM(id: number, data: Record<string, any>) {
    return this.bomService.updateBOM(id, data);
  }
  async deleteBOM(id: number) {
    return this.bomService.deleteBOM(id);
  }
  async calculateProductionCost(bomId: number, quantity: number) {
    return this.bomService.calculateProductionCost(bomId, quantity);
  }
  async explodeBOM(bomId: number, quantity: number) {
    return this.bomService.explodeBOM(bomId, quantity);
  }

  // ==================== DELEGATED RAW MATERIAL METHODS ====================
  async getRawMaterials() {
    return this.rawMaterialService.getRawMaterials();
  }
  async getRawMaterial(id: number) {
    return this.rawMaterialService.getRawMaterial(id);
  }
  async createRawMaterial(data: {
    product_id: number;
    reorder_point?: number;
    reorder_quantity?: number;
    avg_consumption_rate?: number;
    notes?: string;
  }) {
    return this.rawMaterialService.createRawMaterial(data);
  }
  async updateRawMaterial(id: number, data: {
    reorder_point?: number;
    reorder_quantity?: number;
    avg_consumption_rate?: number;
    notes?: string;
  }) {
    return this.rawMaterialService.updateRawMaterial(id, data);
  }
  async deleteRawMaterial(id: number) {
    return this.rawMaterialService.deleteRawMaterial(id);
  }
  async recordConsumption(data: {
    product_id: number;
    quantity: number;
    assembly_order_id?: number;
    production_id?: number;
    batch_number?: string;
    notes?: string;
  }) {
    return this.rawMaterialService.recordConsumption(data);
  }
  async getConsumptionHistory(filters?: {
    product_id?: number;
    start_date?: Date;
    end_date?: Date;
    page?: number;
    limit?: number;
  }) {
    return this.rawMaterialService.getConsumptionHistory(filters);
  }
  async getLowStockAlerts() {
    return this.rawMaterialService.getLowStockAlerts();
  }
  async getSupplierMaterials(supplierId: number) {
    return this.rawMaterialService.getSupplierMaterials(supplierId);
  }
  async getMaterialSuppliers(rawMaterialId: number) {
    return this.rawMaterialService.getMaterialSuppliers(rawMaterialId);
  }
  async addSupplierMaterial(data: Partial<SupplierMaterial>) {
    return this.rawMaterialService.addSupplierMaterial(data);
  }
  async updateSupplierMaterial(id: number, data: Partial<SupplierMaterial>) {
    return this.rawMaterialService.updateSupplierMaterial(id, data);
  }
  async addRawMaterialStock(data: {
    product_id: number;
    quantity: number;
    price?: number;
    supplier_id?: number;
    date: Date;
    notes?: string;
  }) {
    return this.rawMaterialService.addRawMaterialStock(data);
  }
  async getRawMaterialMovements(rawMaterialId: number) {
    return this.rawMaterialService.getRawMaterialMovements(rawMaterialId);
  }
  async deleteStockMovement(id: number) {
    return this.rawMaterialService.deleteStockMovement(id);
  }
  async createStockMovement(data: {
    rawMaterialId: number;
    type: 'IN' | 'OUT';
    quantity: number;
    price?: number;
    date: Date;
    reference?: string;
    notes?: string;
  }) {
    return this.rawMaterialService.createStockMovement(data);
  }
  async updateStockMovement(id: number, data: {
    quantity?: number;
    price?: number;
    date?: Date;
    notes?: string;
  }) {
    return this.rawMaterialService.updateStockMovement(id, data);
  }
  async getAllStockMovements(filters: {
    type?: MovementType;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.rawMaterialService.getAllStockMovements(filters);
  }
  async recalculateRawMaterialStock(rawMaterialId: number) {
    return this.rawMaterialService.recalculateRawMaterialStock(rawMaterialId);
  }
  async exportRawMaterials() {
    return this.rawMaterialService.exportRawMaterials();
  }
  async importRawMaterials(data: Record<string, any>[]) {
    return this.rawMaterialService.importRawMaterials(data);
  }

  // ==================== DELEGATED PRODUCTION QUERY METHODS ====================
  async getDailyProduction(
    date?: string,
    startDate?: string,
    endDate?: string,
  ) {
    return this.dailyProductionService.getDailyProduction(
      date,
      startDate,
      endDate,
    );
  }
  async getProductionHistory(productionId: number) {
    return this.dailyProductionService.getProductionHistory(productionId);
  }
  async getRangeSessions(page = 1, limit = 20) {
    return this.dailyProductionService.getRangeSessions(page, limit);
  }
  async getRangeSessionById(id: number) {
    return this.dailyProductionService.getRangeSessionById(id);
  }
  async exportProductionHistory() {
    return this.dailyProductionService.exportProductionHistory();
  }

  // ==================== COMPLEX TRANSACTIONS (keep here) ====================

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
        if (!prod)
          throw new NotFoundException('المادة الخام غير موجودة');
        const rawMaterialPrice =
          Number(prod.cost_price) ||
          0;
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
        const productRepo = manager.getRepository(Product);
        const stockRepo = manager.getRepository(Stock);
        const stockMovementRepo = manager.getRepository(StockMovement);
        const productionRepo = manager.getRepository(DailyProduction);
        const moldRepo = manager.getRepository(Mold);
        const bomRepo = manager.getRepository(BOM);

        if (data.mold_id && data.total_production_kg) {
          const mold = await moldRepo.findOne({ where: { id: data.mold_id } });
          if (mold && Number(mold.product_weight) > 0) {
            const productName = `بلاستيك ${mold.name}`;
            let product = await productRepo.findOne({
              where: { name: productName, type: 'SEMI_FINISHED' },
            });
            if (!product) {
              product = productRepo.create({
                name: productName,
                type: 'SEMI_FINISHED',
                unit: 'piece',
                cost_price: 0,
                selling_price: 0,
              });
              product = await productRepo.save(product);
            }
            let productStock = await stockRepo.findOne({
              where: { product_id: product.id },
            });
            if (!productStock) {
              productStock = stockRepo.create({
                product_id: product.id,
                warehouse_id: plasticWhId,
                quantity: 0,
              });
            }
            const oldStockQty = Number(productStock.quantity || 0);
            const oldCost = Number(product.cost_price || 0);
            const newPieces = Number(data.pieces_produced || 1);
            const wac =
              oldStockQty + newPieces > 0
                ? (oldStockQty * oldCost + newPieces * (overheadCost || 0)) /
                  (oldStockQty + newPieces)
                : overheadCost || 0;
            await productRepo.update(product.id, { cost_price: wac });
            productStock.quantity = Number(productStock.quantity) + newPieces;
            await stockRepo.save(productStock);
          }
        }

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
            const productName = `بلاستيك ${mold.name}`;
            const product = await productRepo.findOne({
              where: { name: productName, type: 'SEMI_FINISHED' },
            });
            if (product) {
              const stock = await stockRepo.findOne({
                where: { product_id: product.id },
              });
              await stockMovementRepo.save({
                product_id: product.id,
                warehouse_id: stock?.warehouse_id || plasticWhId,
                type: MovementType.IN,
                quantity: data.pieces_produced,
                reference_type: 'PRODUCTION',
                reference_id: saved.id,
                date: data.date || new Date(),
                notes: `Production #${saved.id}`,
              });
            }
          }
        }

        if (data.product_id && data.total_production_kg) {
          const effectiveRmId =
            (data as any).substitute_material_id ?? data.product_id;
          const prod = await this.productRepo.findOne({
            where: { id: effectiveRmId, type: 'RAW' },
          });
          if (prod) {
            const rmStock = await stockRepo.findOne({
              where: { product_id: prod.id },
            });
            if (rmStock) {
              if (
                !(data as any).allow_negative_stock &&
                Number(rmStock.quantity) < Number(data.total_production_kg)
              ) {
                throw new BadRequestException(
                  `رصيد غير كافٍ للمادة الخام: ${prod.name || 'غير معروف'} (المطلوب: ${data.total_production_kg}, المتوفر: ${rmStock.quantity})`,
                );
              }
              rmStock.quantity =
                Number(rmStock.quantity) - Number(data.total_production_kg);
              await stockRepo.save(rmStock);
              await stockMovementRepo.save({
                product_id: prod.id,
                warehouse_id: rmStock.warehouse_id,
                type: MovementType.OUT,
                quantity: data.total_production_kg,
                reference_type: 'PRODUCTION',
                reference_id: saved.id,
                date: data.date || new Date(),
                notes: (data as any).substitute_material_id
                  ? `Substituted material for production: ${saved.id} (original: ${data.product_id})`
                  : `Used in production: ${saved.id}`,
              });
            }
          }
        }

        if (data.mold_id && data.pieces_produced) {
          const mold = await moldRepo.findOne({ where: { id: data.mold_id } });
          if (mold && mold.product_id) {
            const bom = await bomRepo.findOne({
              where: { product: { id: mold.product_id } },
              relations: ['items'],
            });
            if (bom && bom.items.length > 0) {
              for (const item of bom.items) {
                const requiredQty =
                  Number(item.quantity) * Number(data.pieces_produced);
                const itemStock = await stockRepo.findOne({
                  where: { product_id: item.product_id },
                });
                if (itemStock) {
                  if (Number(itemStock.quantity) < requiredQty) {
                    throw new BadRequestException(
                      `رصيد غير كافٍ لمكون BOM: ${item.product?.name || 'غير معروف'} (المطلوب: ${requiredQty}, المتوفر: ${itemStock.quantity})`,
                    );
                  }
                  itemStock.quantity = Number(itemStock.quantity) - requiredQty;
                  await stockRepo.save(itemStock);
                  await stockMovementRepo.save({
                    product_id: item.product_id,
                    warehouse_id: itemStock.warehouse_id,
                    type: MovementType.OUT,
                    quantity: requiredQty,
                    reference_type: 'PRODUCTION_BOM',
                    reference_id: saved.id,
                    date: data.date || new Date(),
                    notes: `BOM Deduction for Production #${saved.id}`,
                  });
                }
              }
            }
          }
        }
        return saved;
      },
    );

    if (data.pieces_produced && overheadCost) {
      const totalCost = Number(data.pieces_produced) * overheadCost;
      await this.accountingService.postAutomaticEntry({
        type: 'PRODUCTION',
        amount: totalCost,
        reference: `PROD-${savedProduction.id}`,
        description: `إنتاج - اجمالي تكلفة الدفعة ${savedProduction.id}`,
      });
    }
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
      const dailyKg = Number(data.total_production_kg) / workingDays.length;
      for (const day of workingDays) {
        try {
          const record = await this.createProduction({
            machine_id: data.machine_id,
            mold_id: data.mold_id,
            product_id: data.product_id,
            total_production_kg: Math.round(dailyKg * 100) / 100,
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
      const stockRepo = manager.getRepository(Stock);
      const stockMovementRepo = manager.getRepository(StockMovement);
      const productRepo = manager.getRepository(Product);
      const bomRepo = manager.getRepository(BOM);
      const historyRepo = manager.getRepository(ProductionRecordHistory);

      if (production.product_id && production.total_production_kg) {
        const prod = await this.productRepo.findOne({
          where: { id: production.product_id, type: 'RAW' },
        });
        if (prod) {
          const stock = await stockRepo.findOne({
            where: { product_id: prod.id },
          });
          if (stock) {
            stock.quantity =
              Number(stock.quantity) + Number(production.total_production_kg);
            await stockRepo.save(stock);
            await stockMovementRepo.save({
              product_id: prod.id,
              warehouse_id: stock.warehouse_id,
              type: MovementType.IN,
              quantity: production.total_production_kg,
              reference_type: 'PRODUCTION_DELETE',
              reference_id: id,
              date: new Date(),
              notes: `Reversal of Production #${id}`,
            });
          }
        }
      }

      if (production.mold && production.pieces_produced) {
        const productName = `بلاستيك ${production.mold.name}`;
        const product = await productRepo.findOne({
          where: { name: productName, type: 'SEMI_FINISHED' },
        });
        if (product) {
          const stock = await stockRepo.findOne({
            where: { product_id: product.id },
          });
          if (stock) {
            if (Number(stock.quantity) < Number(production.pieces_produced)) {
              throw new BadRequestException(
                `رصيد غير كافٍ لعكس الإنتاج: ${product.name} (المطلوب: ${production.pieces_produced}, المتوفر: ${stock.quantity})`,
              );
            }
            stock.quantity =
              Number(stock.quantity) - Number(production.pieces_produced);
            await stockRepo.save(stock);
            const plasticWhId =
              await this.warehouseHelper.getPlasticWarehouseId();
            await stockMovementRepo.save({
              product_id: product.id,
              warehouse_id: stock.warehouse_id || plasticWhId,
              type: MovementType.OUT,
              quantity: production.pieces_produced,
              reference_type: 'PRODUCTION_DELETE',
              reference_id: id,
              date: new Date(),
              notes: `Reversal of Production #${id}`,
            });
          }
        }
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
          for (const item of bom.items) {
            const requiredQty =
              Number(item.quantity) * Number(production.pieces_produced);
            const itemStock = await stockRepo.findOne({
              where: { product_id: item.product_id },
            });
            if (itemStock) {
              itemStock.quantity = Number(itemStock.quantity) + requiredQty;
              await stockRepo.save(itemStock);
              await stockMovementRepo.save({
                product_id: item.product_id,
                warehouse_id: itemStock.warehouse_id,
                type: MovementType.IN,
                quantity: requiredQty,
                reference_type: 'PRODUCTION_BOM_DELETE',
                reference_id: id,
                date: new Date(),
                notes: `BOM Reversal for Production #${id}`,
              });
            }
          }
        }
      }

      await historyRepo.save({
        production: { id } as unknown as DailyProduction,
        old_values: {
          machine_id: production.machine_id,
          mold_id: production.mold_id,
          product_id: production.product_id,
          date: production.date,
          total_production_kg: production.total_production_kg,
          pieces_produced: production.pieces_produced,
          hours_worked: production.hours_worked,
          notes: production.notes,
          status: production.status,
        },
        new_values: {},
        change_type: 'DELETE',
      });
      return manager.getRepository(DailyProduction).delete(id);
    });
  }

  async updateProduction(id: number, data: Partial<DailyProduction>) {
    const oldProduction = await this.productionRepo.findOne({
      where: { id },
      relations: ['mold', 'product'],
    });
    if (!oldProduction) throw new NotFoundException('سجل الإنتاج غير موجود');

    const oldSnapshot = {
      machine_id: oldProduction.machine_id,
      mold_id: oldProduction.mold_id,
      product_id: oldProduction.product_id,
      date: oldProduction.date,
      total_production_kg: oldProduction.total_production_kg,
      pieces_produced: oldProduction.pieces_produced,
      hours_worked: oldProduction.hours_worked,
      notes: oldProduction.notes,
      status: oldProduction.status,
    };

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
      const productRepo = manager.getRepository(Product);
      const stockRepo = manager.getRepository(Stock);
      const stockMovementRepo = manager.getRepository(StockMovement);
      const productionRepo = manager.getRepository(DailyProduction);
      const historyRepo = manager.getRepository(ProductionRecordHistory);

      if (oldProduction.product_id && oldProduction.total_production_kg) {
        const oldProd = await this.productRepo.findOne({
          where: { id: oldProduction.product_id, type: 'RAW' },
        });
        if (oldProd) {
          const stock = await stockRepo.findOne({
            where: { product_id: oldProd.id },
          });
          if (stock) {
            stock.quantity =
              Number(stock.quantity) +
              Number(oldProduction.total_production_kg);
            await stockRepo.save(stock);
            await stockMovementRepo.save({
              product_id: oldProd.id,
              warehouse_id: stock.warehouse_id,
              type: MovementType.IN,
              quantity: oldProduction.total_production_kg,
              reference_type: 'PRODUCTION_CORRECTION',
              reference_id: id,
              date: new Date(),
              notes: `Modification reversal for Prod #${id}`,
            });
          }
        }
      }

      if (oldProduction.mold && oldProduction.pieces_produced) {
        const productName = `بلاستيك ${oldProduction.mold.name}`;
        const product = await productRepo.findOne({
          where: { name: productName, type: 'SEMI_FINISHED' },
        });
        if (product) {
          const stock = await stockRepo.findOne({
            where: { product_id: product.id },
          });
          if (stock) {
            if (
              Number(stock.quantity) < Number(oldProduction.pieces_produced)
            ) {
              throw new BadRequestException(
                `رصيد غير كافٍ لعكس تعديل الإنتاج: ${product.name} (المطلوب: ${oldProduction.pieces_produced}, المتوفر: ${stock.quantity})`,
              );
            }
            stock.quantity =
              Number(stock.quantity) - Number(oldProduction.pieces_produced);
            await stockRepo.save(stock);
            await stockMovementRepo.save({
              product_id: product.id,
              warehouse_id: stock.warehouse_id || plasticWhId,
              type: MovementType.OUT,
              quantity: oldProduction.pieces_produced,
              reference_type: 'PRODUCTION_CORRECTION',
              reference_id: id,
              date: new Date(),
              notes: `Modification reversal for Prod #${id}`,
            });
          }
        }
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
        const prod = await this.productRepo.findOne({
          where: { id: updatedProduction.product_id, type: 'RAW' },
        });
        if (prod) {
          const stock = await stockRepo.findOne({
            where: { product_id: prod.id },
          });
          if (stock) {
            if (
              Number(stock.quantity) <
              Number(updatedProduction.total_production_kg)
            ) {
              throw new BadRequestException(
                `رصيد غير كافٍ للمادة الخام: ${prod.name || 'غير معروف'} (المطلوب: ${updatedProduction.total_production_kg}, المتوفر: ${stock.quantity})`,
              );
            }
            stock.quantity =
              Number(stock.quantity) -
              Number(updatedProduction.total_production_kg);
            await stockRepo.save(stock);
            await stockMovementRepo.save({
              product_id: prod.id,
              warehouse_id: stock.warehouse_id,
              type: MovementType.OUT,
              quantity: updatedProduction.total_production_kg,
              reference_type: 'PRODUCTION',
              reference_id: id,
              date: updatedProduction.date || new Date(),
              notes: `Used in production: ${id}`,
            });
          }
        }
      }

      if (updatedProduction.mold && updatedProduction.pieces_produced) {
        const productName = `بلاستيك ${updatedProduction.mold.name}`;
        let product = await productRepo.findOne({
          where: { name: productName, type: 'SEMI_FINISHED' },
        });
        if (!product) {
          product = productRepo.create({
            name: productName,
            type: 'SEMI_FINISHED',
            unit: 'piece',
          });
          await productRepo.save(product);
        }
        let stock = await stockRepo.findOne({
          where: { product_id: product.id },
        });
        if (!stock) {
          stock = stockRepo.create({
            product_id: product.id,
            warehouse_id: plasticWhId,
            quantity: 0,
          });
        }
        stock.quantity =
          Number(stock.quantity) + Number(updatedProduction.pieces_produced);
        await stockRepo.save(stock);
        await stockMovementRepo.save({
          product_id: product.id,
          warehouse_id: plasticWhId,
          type: MovementType.IN,
          quantity: updatedProduction.pieces_produced,
          reference_type: 'PRODUCTION',
          reference_id: id,
          date: updatedProduction.date || new Date(),
          notes: `Production: ${updatedProduction.total_production_kg}kg`,
        });
      }

      const newSnapshot = {
        machine_id: updatedProduction.machine_id,
        mold_id: updatedProduction.mold_id,
        product_id: updatedProduction.product_id,
        date: updatedProduction.date,
        total_production_kg: updatedProduction.total_production_kg,
        pieces_produced: updatedProduction.pieces_produced,
        hours_worked: updatedProduction.hours_worked,
        notes: updatedProduction.notes,
        status: updatedProduction.status,
      };

      if (JSON.stringify(oldSnapshot) !== JSON.stringify(newSnapshot)) {
        await historyRepo.save({
          production: { id } as unknown as DailyProduction,
          old_values: oldSnapshot,
          new_values: newSnapshot,
          change_type: 'UPDATE',
        });
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
        results.errors.push(`Row ${JSON.stringify(row)}: ${(err as Error).message}`);
      }
    }
    return results;
  }

  async createAssembly(data: { bom_id: number; quantity: number; date: Date }) {
    const bom = await this.bomRepo.findOne({
      where: { id: data.bom_id },
      relations: ['items', 'items.product', 'product'],
    });
    if (!bom) throw new NotFoundException('قائمة المكونات غير موجودة');

    return this.dataSource.transaction(async (manager) => {
      let totalCost = 0;
      for (const item of bom.items) {
        const requiredQty = Number(item.quantity) * Number(data.quantity);
        const stockRepo = manager.getRepository(Stock);
        const stock = await stockRepo.findOne({
          where: { product_id: item.product_id },
        });
        if (!stock || Number(stock.quantity) < requiredQty) {
          throw new BadRequestException(
            `رصيد غير كافٍ للمكون: ${item.product?.name || 'غير معروف'} (المطلوب: ${requiredQty}, المتوفر: ${stock ? Number(stock.quantity) : 0})`,
          );
        }
        totalCost += Number(item.product?.cost_price || 0) * requiredQty;
      }

      const stockMovementRepo = manager.getRepository(StockMovement);
      for (const item of bom.items) {
        const requiredQty = Number(item.quantity) * Number(data.quantity);
        await this.warehouseHelper.safeDeductStock(
          item.product_id,
          requiredQty,
          manager,
        );
        const stockRepo = manager.getRepository(Stock);
        const stock = await stockRepo.findOne({
          where: { product_id: item.product_id },
        });
        await stockMovementRepo.save({
          product_id: item.product_id,
          warehouse_id:
            stock?.warehouse_id ||
            (await this.warehouseHelper.getDefaultWarehouseId()),
          type: MovementType.OUT,
          quantity: requiredQty,
          reference_type: 'ASSEMBLY',
          reference_id: 0,
          date: new Date(),
          notes: `تجميع لـ ${bom.product?.name || bom.product_id}`,
        });
      }

      const stockRepo = manager.getRepository(Stock);
      let finishedStock = await stockRepo.findOne({
        where: { product_id: bom.product_id },
      });
      if (!finishedStock) {
        finishedStock = stockRepo.create({
          product_id: bom.product_id,
          warehouse_id: await this.warehouseHelper.getDefaultWarehouseId(),
          quantity: 0,
        });
      }
      finishedStock.quantity =
        Number(finishedStock.quantity) + Number(data.quantity);
      await stockRepo.save(finishedStock);

      await stockMovementRepo.save({
        product_id: bom.product_id,
        warehouse_id: finishedStock.warehouse_id,
        type: MovementType.IN,
        quantity: data.quantity,
        reference_type: 'ASSEMBLY',
        reference_id: 0,
        date: new Date(),
        notes: 'إخراج تجميع',
      });

      const assemblyRepo = manager.getRepository(AssemblyOrder);
      const order = assemblyRepo.create({
        bom_id: data.bom_id,
        quantity_produced: data.quantity,
        date: data.date,
        total_cost: totalCost,
        status: 'COMPLETED',
      });
      return assemblyRepo.save(order);
    });
  }

  async getAssemblyOrders() {
    return this.assemblyRepo.find({
      relations: ['bom', 'bom.product'],
      order: { date: 'DESC' },
    });
  }
}

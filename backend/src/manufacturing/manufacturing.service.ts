import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, Like } from 'typeorm';
import { Machine, MachineStatus } from './entities/machine.entity';
import {
  MachineMaintenance,
  MaintenanceStatus,
} from './entities/machine-maintenance.entity';
import { Mold } from './entities/mold.entity';
import { MoldIssue } from './entities/mold-issue.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { BOM, BOMItem } from './entities/bom.entity';
import { AssemblyOrder } from './entities/assembly-order.entity';
import { RawMaterial } from './entities/raw-material.entity';
import { RawMaterialConsumption } from './entities/raw-material-consumption.entity';
import { SupplierMaterial } from './entities/supplier-material.entity';
import { FixedCost } from './entities/fixed-cost.entity';
import { Stock } from '../inventory/entities/stock.entity';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';
import { Product } from '../inventory/entities/product.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { AccountingService } from '../accounting/accounting.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ManufacturingService {
  constructor(
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
    @InjectRepository(MachineMaintenance)
    private maintenanceRepo: Repository<MachineMaintenance>,
    @InjectRepository(Mold)
    private moldRepo: Repository<Mold>,
    @InjectRepository(MoldIssue)
    private moldIssueRepo: Repository<MoldIssue>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(BOM)
    private bomRepo: Repository<BOM>,
    @InjectRepository(BOMItem)
    private bomItemRepo: Repository<BOMItem>,
    @InjectRepository(AssemblyOrder)
    private assemblyRepo: Repository<AssemblyOrder>,
    @InjectRepository(RawMaterial)
    private rawMaterialRepo: Repository<RawMaterial>,
    @InjectRepository(RawMaterialConsumption)
    private consumptionRepo: Repository<RawMaterialConsumption>,
    @InjectRepository(SupplierMaterial)
    private supplierMaterialRepo: Repository<SupplierMaterial>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private stockMovementRepo: Repository<StockMovement>,
    @InjectRepository(FixedCost)
    private fixedCostRepo: Repository<FixedCost>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    private accountingService: AccountingService,
  ) {}

  // Helper: get the ID of the first active warehouse (creates one if none exist)
  private async getDefaultWarehouseId(): Promise<number> {
    const warehouse = await this.warehouseRepo.findOne({
      where: { is_active: true },
      order: { id: 'ASC' },
    });
    if (warehouse) return warehouse.id;

    // No warehouse exists — create a default one so the system can function
    const created = await this.warehouseRepo.save(
      this.warehouseRepo.create({ name: 'المستودع الرئيسي', is_active: true }),
    );
    return created.id;
  }

  // Helper: get the ID of the plastic warehouse (مخزن البلاستيك)
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

  // ==================== FIXED COSTS & OVERHEAD ====================

  async createFixedCost(data: Partial<FixedCost>) {
    const cost = this.fixedCostRepo.create(data);
    return this.fixedCostRepo.save(cost);
  }

  async getFixedCosts(month?: string, year?: string) {
    if (month) {
      return this.fixedCostRepo.find({
        where: { month },
        order: { created_at: 'DESC' },
      });
    }
    if (year) {
      return this.fixedCostRepo.find({
        where: { month: Like(`${year}-%`) },
        order: { month: 'ASC', created_at: 'DESC' },
      });
    }
    return this.fixedCostRepo.find({
      order: { month: 'DESC', created_at: 'DESC' },
    });
  }

  async deleteFixedCost(id: number) {
    await this.fixedCostRepo.delete(id);
    return { deleted: true };
  }

  // Helper: Count active days (excluding Fridays)
  private getActiveDaysInMonth(year: number, month: number): number {
    const endDate = new Date(year, month, 0); // Last day of month
    const totalDays = endDate.getDate();
    let fridays = 0;

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getDay() === 5) {
        // Friday is 5
        fridays++;
      }
    }
    return totalDays - fridays;
  }

  // Helper: Calculate cost per working hour
  // Formula: Total Fixed Costs ÷ Work Days ÷ Daily Working Hours
  // Helper: get previous N month strings (excluding the given month)
  private getPreviousMonthStrings(monthStr: string, count: number): string[] {
    const [y, m] = monthStr.split('-').map(Number);
    const months: string[] = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date(y, m - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }

  private async getAveragedMonthlyCosts(
    monthStr: string,
    monthsToAverage: number = 3,
  ): Promise<{
    avgTotalFixedCost: number;
    avgTotalElectricity: number;
    avgActiveDays: number;
    totalFixedCostDetails: { month: string; amount: number }[];
  }> {
    const monthStrings = this.getPreviousMonthStrings(monthStr, monthsToAverage);
    let totalFixedSum = 0;
    let totalElectricSum = 0;
    let totalDaysSum = 0;
    const details: { month: string; amount: number }[] = [];

    for (const mStr of monthStrings) {
      const [y, m] = mStr.split('-').map(Number);
      const costs = await this.fixedCostRepo.find({ where: { month: mStr } });
      const monthFixed = costs.reduce((sum, c) => sum + Number(c.amount), 0);
      const monthElectric = costs
        .filter((c) => c.category === 'ELECTRICITY')
        .reduce((sum, c) => sum + Number(c.amount), 0);
      const monthDays = this.getActiveDaysInMonth(y, m);

      totalFixedSum += monthFixed;
      totalElectricSum += monthElectric;
      totalDaysSum += monthDays;
      details.push({ month: mStr, amount: monthFixed });
    }

    return {
      avgTotalFixedCost: totalFixedSum / monthsToAverage,
      avgTotalElectricity: totalElectricSum / monthsToAverage,
      avgActiveDays: totalDaysSum / monthsToAverage,
      totalFixedCostDetails: details,
    };
  }

  private async calculateHourlyCost(
    monthStr: string,
    machineId?: number,
    dailyHours: number = 8,
  ): Promise<number> {
    // Use average of last 3 months instead of current month
    const {
      avgTotalFixedCost,
      avgTotalElectricity,
      avgActiveDays,
    } = await this.getAveragedMonthlyCosts(monthStr, 3);

    if (avgTotalFixedCost === 0 || avgActiveDays === 0) return 0;

    // 1. Non-electric hourly rate (same for all machines)
    const nonElectricHourly =
      (avgTotalFixedCost - avgTotalElectricity) / avgActiveDays / dailyHours;

    // 2. Calculate machine-specific electricity cost from actual production data
    let machineElectricHourly = 0;
    if (machineId && avgTotalElectricity > 0) {
      const machine = await this.machineRepo.findOne({
        where: { id: machineId },
      });
      if (machine && Number(machine.power_consumption) > 0) {
        // Average kWh across last 3 months
        const last3Months = this.getPreviousMonthStrings(monthStr, 3);
        let totalKwhAllMonths = 0;
        let monthCount = 0;

        for (const lmStr of last3Months) {
          const [ly, lm] = lmStr.split('-').map(Number);
          const startDate = `${lmStr}-01`;
          const endDate = `${lmStr}-${new Date(ly, lm, 0).getDate()}`;

          const monthProductions = await this.productionRepo.find({
            where: { date: Between(startDate, endDate) as any },
            relations: ['machine'],
          });

          let monthKwh = 0;
          for (const prod of monthProductions) {
            const m = prod.machine;
            if (m && Number(m.power_consumption) > 0 && prod.hours_worked) {
              monthKwh += Number(m.power_consumption) * Number(prod.hours_worked);
            }
          }
          totalKwhAllMonths += monthKwh;
          monthCount++;
        }

        const avgMonthlyKwh = monthCount > 0 ? totalKwhAllMonths / monthCount : 0;

        if (avgMonthlyKwh > 0) {
          // Average cost per kWh = average electricity cost ÷ average kWh
          const avgKwhRate = avgTotalElectricity / avgMonthlyKwh;
          machineElectricHourly =
            Number(machine.power_consumption) * avgKwhRate;
        }
      }
    }

    return nonElectricHourly + machineElectricHourly;
  }

  // Helper: Calculate cost per piece based on working hours
  // Formula: Raw Material Cost + (Hourly Cost × Hours Worked) / Pieces
  private calculatePieceCost(params: {
    rawMaterialPrice: number; // Price per KG
    pieceWeight: number; // Weight in grams
    hourlyCost: number; // Cost per working hour
    hoursWorked: number; // Hours the machine worked
    totalPieces: number; // Total pieces produced
  }): number {
    // 1. Raw Material Cost per Piece
    // (Price per KG ÷ 1000) × Weight in grams
    const rawCost = (params.rawMaterialPrice / 1000) * params.pieceWeight;

    // 2. Fixed Cost per Piece
    // (Hourly Cost × Hours Worked) ÷ Total Pieces
    const fixedCost =
      params.totalPieces > 0
        ? (params.hourlyCost * params.hoursWorked) / params.totalPieces
        : 0;

    return rawCost + fixedCost;
  }

  // Calculate Overhead Rate per KG for a specific month (based on PREVIOUS month data usually)
  async calculateOverheadRate(targetMonth: string): Promise<number> {
    // 1. Get Total Fixed Costs for the month
    const costs = await this.fixedCostRepo.find({
      where: { month: targetMonth },
    });
    const totalFixedCost = costs.reduce((sum, c) => sum + Number(c.amount), 0);

    if (totalFixedCost === 0) return 0;

    // 2. Get Total Production Weight (KG) for the same month
    // We'll calculate start and end dates for the month
    const startDate = new Date(`${targetMonth}-01`);
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0,
    );

    const productions = await this.productionRepo.find({
      where: {
        date: Between(startDate, endDate),
      },
    });

    const totalWeightKg = productions.reduce(
      (sum, p) => sum + Number(p.total_production_kg || 0),
      0,
    );

    if (totalWeightKg === 0) return 0; // Avoid division by zero

    // 3. Overhead Rate per KG
    return totalFixedCost / totalWeightKg;
  }

  // Machines
  async getAllMachines() {
    return this.machineRepo.find();
  }

  async getMachinesOverview(filters?: {
    search?: string;
    status?: MachineStatus;
    sortBy?: 'name' | 'status' | 'next_maintenance';
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }) {
    const qb = this.machineRepo.createQueryBuilder('machine');

    if (filters?.search) {
      qb.andWhere(
        '(machine.name LIKE :search OR machine.serial_number LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.status) {
      qb.andWhere('machine.status = :status', { status: filters.status });
    }

    if (filters?.sortBy) {
      const order = filters.sortOrder || 'ASC';
      qb.orderBy(`machine.${filters.sortBy}`, order);
    } else {
      qb.orderBy('machine.name', 'ASC');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    const [machines, total] = await qb.getManyAndCount();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allMachines = filters?.search || filters?.status
      ? machines
      : await this.machineRepo.find();

    const overdueCount = allMachines.filter((m) => {
      if (!m.next_maintenance) return false;
      const nextDate = new Date(m.next_maintenance);
      nextDate.setHours(0, 0, 0, 0);
      return nextDate < today;
    }).length;

    const statusCounts = {
      ACTIVE: allMachines.reduce(
        (c, m) => c + (m.status === MachineStatus.ACTIVE ? 1 : 0),
        0,
      ),
      INACTIVE: allMachines.reduce(
        (c, m) => c + (m.status === MachineStatus.INACTIVE ? 1 : 0),
        0,
      ),
      MAINTENANCE: allMachines.reduce(
        (c, m) => c + (m.status === MachineStatus.MAINTENANCE ? 1 : 0),
        0,
      ),
      BROKEN: allMachines.reduce(
        (c, m) => c + (m.status === MachineStatus.BROKEN ? 1 : 0),
        0,
      ),
    };

    return {
      machines,
      pagination: {
        total,
        page,
        limit,
      },
      stats: {
        total: allMachines.length,
        overdueCount,
        statusCounts,
      },
    };
  }

  async createMachine(data: Partial<Machine>) {
    const machine = this.machineRepo.create(data);
    return this.machineRepo.save(machine);
  }

  async updateMachine(id: number, data: Partial<Machine>) {
    await this.machineRepo.update(id, data);
    return this.machineRepo.findOne({ where: { id } });
  }

  async deleteMachine(id: number) {
    return this.machineRepo.delete(id);
  }

  async getMachinesWithStatus() {
    const machines = await this.machineRepo.find();

    // Enrich with last production info
    // We could optimize this with a single query using subselects or a window function,
    // but for < 50 machines, Promise.all is acceptable.
    const enriched = await Promise.all(
      machines.map(async (m) => {
        const lastProduction = await this.productionRepo.findOne({
          where: { machine_id: m.id },
          order: { date: 'DESC', id: 'DESC' },
          relations: ['mold', 'raw_material'],
        });

        return {
          ...m,
          last_mold_id: lastProduction?.mold?.id || null,
          last_raw_material_id: lastProduction?.raw_material?.id || null,
        };
      }),
    );

    return enriched;
  }

  // Machine Maintenance
  async getMachineMaintenance(machineId?: number) {
    const where: any = {};
    if (machineId) where.machine_id = machineId;
    return this.maintenanceRepo.find({
      where,
      relations: ['machine'],
      order: { date: 'DESC' },
    });
  }

  async createMaintenance(data: Partial<MachineMaintenance>) {
    const maintenance = this.maintenanceRepo.create(data);
    const saved = await this.maintenanceRepo.save(maintenance);

    // Update machine maintenance dates
    if (saved.machine_id && saved.status === MaintenanceStatus.COMPLETED) {
      const machine = await this.machineRepo.findOne({
        where: { id: saved.machine_id },
      });
      if (machine) {
        const lastDate = new Date(saved.date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(
          lastDate.getDate() + (machine.maintenance_interval_days || 30),
        );

        machine.last_maintenance = lastDate;
        machine.next_maintenance = nextDate;
        await this.machineRepo.save(machine);
      }
    }

    return saved;
  }

  // Molds
  async getAllMolds() {
    return this.moldRepo.find({ relations: ['product'] });
  }

  async createMold(data: Partial<Mold>) {
    const mold = this.moldRepo.create(data);
    const savedMold = await this.moldRepo.save(mold);
    await this.ensureProductForMold(savedMold);
    return savedMold;
  }

  async updateMold(id: number, data: Partial<Mold>) {
    await this.moldRepo.update(id, data);
    const updatedMold = await this.moldRepo.findOne({
      where: { id },
      relations: ['product'],
    });
    if (updatedMold) {
      await this.ensureProductForMold(updatedMold);
    }
    return updatedMold;
  }

  // Helper: Ensure a semi-finished product exists for a mold
  private async ensureProductForMold(mold: Mold) {
    const productName = `بلاستيك ${mold.name}`;
    let product = await this.productRepo.findOne({
      where: { name: productName, type: 'SEMI_FINISHED' },
    });

    if (!product) {
      product = this.productRepo.create({
        name: productName,
        type: 'SEMI_FINISHED',
        unit: 'piece',
        cost_price: 0,
        selling_price: 0,
      });
      await this.productRepo.save(product);
    }

    // Ensure stock entry exists
    let stock = await this.stockRepo.findOne({
      where: { product_id: product.id },
    });
    if (!stock) {
      stock = this.stockRepo.create({
        product_id: product.id,
        warehouse_id: await this.getPlasticWarehouseId(),
        quantity: 0,
      });
      await this.stockRepo.save(stock);
    }

    return product;
  }

  async syncAllMoldProducts() {
    const molds = await this.moldRepo.find();
    let createdCount = 0;
    for (const mold of molds) {
      await this.ensureProductForMold(mold);
      createdCount++;
    }
    return {
      message: 'Synchronization complete',
      processed_molds: createdCount,
    };
  }

  // Recalculate costs for all semi-finished products using machine-specific power formula
  async getSemiFinishedDetails(productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId, type: 'SEMI_FINISHED' },
    });
    if (!product) throw new Error('Product not found');

    // Find mold by name (product name = "بلاستيك {mold.name}")
    const moldName = product.name.replace('بلاستيك ', '');
    const mold = await this.moldRepo.findOne({ where: { name: moldName } });

    if (!mold) {
      return {
        product,
        mold: null,
        bestMachine: null,
        costBreakdown: null,
      };
    }

    // Find best machine (most production records for this mold)
    const machineStats = await this.productionRepo
      .createQueryBuilder('p')
      .select('p.machine_id', 'machine_id')
      .addSelect('COUNT(*)', 'runs')
      .addSelect('SUM(p.pieces_produced)', 'total_pieces')
      .where('p.mold_id = :moldId', { moldId: mold.id })
      .groupBy('p.machine_id')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();

    let bestMachine: Machine | null = null;
    if (machineStats?.machine_id) {
      bestMachine = (await this.machineRepo.findOne({
        where: { id: machineStats.machine_id },
      })) || null;
    }

    // Cost breakdown using average of last 3 months
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const {
      avgTotalFixedCost,
      avgTotalElectricity,
      avgActiveDays,
      totalFixedCostDetails,
    } = await this.getAveragedMonthlyCosts(monthStr, 3);

    const nonElectricHourly =
      avgActiveDays > 0 ? (avgTotalFixedCost - avgTotalElectricity) / avgActiveDays / 8 : 0;

    // Get raw material price
    let rawMaterialPrice = 0;
    if (mold.product_id) {
      const rawProduct = await this.productRepo.findOne({
        where: { id: mold.product_id },
      });
      rawMaterialPrice = Number(rawProduct?.cost_price ?? 0);
    }

    // Average kWh across last 3 months
    const last3Months = this.getPreviousMonthStrings(monthStr, 3);
    let totalKwhAllMonths = 0;
    let monthCount = 0;

    for (const lmStr of last3Months) {
      const [ly, lm] = lmStr.split('-').map(Number);
      const startDate = `${lmStr}-01`;
      const endDate = `${lmStr}-${new Date(ly, lm, 0).getDate()}`;

      const monthProductions = await this.productionRepo.find({
        where: { date: Between(startDate, endDate) as any },
        relations: ['machine'],
      });

      let monthKwh = 0;
      for (const prod of monthProductions) {
        const m = prod.machine;
        if (m && Number(m.power_consumption) > 0 && prod.hours_worked) {
          monthKwh += Number(m.power_consumption) * Number(prod.hours_worked);
        }
      }
      totalKwhAllMonths += monthKwh;
      monthCount++;
    }

    const avgMonthlyKwh = monthCount > 0 ? totalKwhAllMonths / monthCount : 0;
    const avgKwhRate = avgMonthlyKwh > 0 ? avgTotalElectricity / avgMonthlyKwh : 0;

    // Cost breakdown using best machine or default machine
    let costBreakdown: {
      rawMaterialPrice: number;
      pieceWeightGrams: number;
      rawCostPerPiece: number;
      nonElectricHourly: number;
      machinePowerKw: number;
      actualKwhRate: number;
      electricityHourly: number;
      machineHourly: number;
      hoursWorked: number;
      estimatedPieces: number;
      fixedPerPiece: number;
      totalPerPiece: number;
      avgTotalFixedCost: number;
      avgTotalElectricity: number;
      avgActiveDays: number;
      monthStr: string;
      monthDetails: { month: string; amount: number }[];
    } | null = null;
    const machine = bestMachine || (await this.machineRepo.findOne({ order: { id: 'ASC' as 'ASC' } }));
    if (machine && Number(mold.product_weight) > 0) {
      const machinePowerKw = Number(machine.power_consumption);
      const defaultHours = 8;
      const defaultPieces = Math.floor((1000 * 1000) / Number(mold.product_weight)) || 1000;

      const rawCostPerPiece = (rawMaterialPrice / 1000) * Number(mold.product_weight);
      const electricityHourly = machinePowerKw * avgKwhRate;
      const machineHourly = nonElectricHourly + electricityHourly;
      const fixedPerPiece = defaultPieces > 0 ? (machineHourly * defaultHours) / defaultPieces : 0;
      const totalPerPiece = rawCostPerPiece + fixedPerPiece;

      costBreakdown = {
        rawMaterialPrice,
        pieceWeightGrams: Number(mold.product_weight),
        rawCostPerPiece,
        nonElectricHourly,
        machinePowerKw,
        actualKwhRate: avgKwhRate,
        electricityHourly,
        machineHourly,
        hoursWorked: defaultHours,
        estimatedPieces: defaultPieces,
        fixedPerPiece,
        totalPerPiece,
        avgTotalFixedCost,
        avgTotalElectricity,
        avgActiveDays,
        monthStr,
        monthDetails: totalFixedCostDetails,
      };
    }

    return {
      product,
      mold: {
        id: mold.id,
        name: mold.name,
        product_weight: Number(mold.product_weight),
        cavities: mold.cavities,
        current_shots: mold.current_shots,
        max_shots: mold.max_shots,
        status: mold.status,
        life_cycle_status: mold.life_cycle_status,
      },
      bestMachine: bestMachine
        ? {
            id: bestMachine.id,
            name: bestMachine.name,
            power_consumption: Number(bestMachine.power_consumption),
            runs: Number(machineStats?.runs || 0),
            total_pieces: Number(machineStats?.total_pieces || 0),
          }
        : null,
      costBreakdown,
    };
  }

  async recalculateSemiFinishedCosts() {
    const productions = await this.productionRepo.find({
      relations: ['machine', 'mold', 'raw_material'],
      order: { date: 'ASC', id: 'ASC' },
    });

    // Group productions by product name
    const productGroups: Record<string, { productions: typeof productions; productId?: number }> = {};

    for (const prod of productions) {
      if (!prod.mold || !prod.pieces_produced) continue;
      const productName = `بلاستيك ${prod.mold.name}`;
      if (!productGroups[productName]) {
        productGroups[productName] = { productions: [] };
      }
      productGroups[productName].productions.push(prod);
    }

    let updatedCount = 0;
    for (const [productName, group] of Object.entries(productGroups)) {
      const product = await this.productRepo.findOne({
        where: { name: productName, type: 'SEMI_FINISHED' },
      });
      if (!product) continue;
      productGroups[productName].productId = product.id;

      let totalQty = 0;
      let totalCost = 0;

      for (const prod of group.productions) {
        const monthStr = prod.date
          ? `${new Date(prod.date).getFullYear()}-${String(new Date(prod.date).getMonth() + 1).padStart(2, '0')}`
          : '';

        // Calculate machine-specific hourly cost
        const hourlyCost = monthStr
          ? await this.calculateHourlyCost(monthStr, prod.machine_id)
          : 0;

        // Get raw material price
        let rawMaterialPrice = 0;
        if (prod.raw_material_id) {
          const rm = await this.rawMaterialRepo.findOne({
            where: { id: prod.raw_material_id },
            relations: ['product'],
          });
          rawMaterialPrice = Number(
            rm?.product?.cost_price ?? rm?.last_purchase_price ?? 0,
          );
        }

        // Calculate unit cost
        const unitCost = this.calculatePieceCost({
          rawMaterialPrice,
          pieceWeight: Number(prod.mold.product_weight),
          hourlyCost,
          hoursWorked: Number(prod.hours_worked || 8),
          totalPieces: Number(prod.pieces_produced),
        });

        const qty = Number(prod.pieces_produced);
        totalQty += qty;
        totalCost += qty * unitCost;
      }

      // Update product cost_price with recalculated average
      const newAvgCost = totalQty > 0 ? totalCost / totalQty : 0;
      await this.productRepo.update(product.id, { cost_price: newAvgCost });
      updatedCount++;
    }

    return {
      message: 'Recalculation complete',
      processed_products: updatedCount,
      processed_productions: productions.length,
    };
  }

  // Mold Issues
  async getMoldIssues(moldId?: number) {
    const where: any = {};
    if (moldId) where.mold_id = moldId;
    return this.moldIssueRepo.find({
      where,
      relations: ['mold'],
      order: { date: 'DESC' },
    });
  }

  async createMoldIssue(data: Partial<MoldIssue>) {
    const issue = this.moldIssueRepo.create(data);
    return this.moldIssueRepo.save(issue);
  }

  async updateMoldIssue(id: number, data: Partial<MoldIssue>) {
    await this.moldIssueRepo.update(id, data);
    return this.moldIssueRepo.findOne({ where: { id } });
  }

  // Get daily production
  async getDailyProduction(
    date?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};

    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    } else if (startDate) {
      where.date = MoreThanOrEqual(startDate);
    }

    return this.productionRepo.find({
      where,
      relations: ['machine', 'mold', 'raw_material'],
      order: { date: 'DESC', id: 'DESC' },
    });
  }

  async createProduction(data: Partial<DailyProduction>) {
    // 1. Calculate pieces if mold info available
    if (data.mold_id && data.total_production_kg) {
      const mold = await this.moldRepo.findOne({ where: { id: data.mold_id } });
      if (mold && Number(mold.product_weight) > 0) {
        // Weight is in Grams, Production is in KG
        // Pieces = (Production_KG * 1000) / Weight_Grams
        data.pieces_produced = Math.floor(
          (Number(data.total_production_kg) * 1000) /
            Number(mold.product_weight),
        );

        // 2. Handle Semi-Finished Product (Plastic + Mold Name)
        const productName = `بلاستيك ${mold.name}`;
        // Look for existing SEMI_FINISHED product to avoid collision with Raw Materials
        let product = await this.productRepo.findOne({
          where: { name: productName, type: 'SEMI_FINISHED' },
        });

        if (!product) {
          product = this.productRepo.create({
            name: productName,
            type: 'SEMI_FINISHED', // نصف مصنع
            unit: 'piece',
            cost_price: 0,
            selling_price: 0,
          });
          await this.productRepo.save(product);
        }

        // === 3. STOCK & COST CALCULATION (HOURS-BASED METHOD) ===
        let productStock = await this.stockRepo.findOne({
          where: { product_id: product.id },
        });
        if (!productStock) {
          productStock = this.stockRepo.create({
            product_id: product.id,
            warehouse_id: await this.getPlasticWarehouseId(),
            quantity: 0,
          });
        }

        const oldStockQty = Number(productStock.quantity || 0);
        const oldCost = Number(product.cost_price || 0);

        // Get required data for cost calculation
        const prodDate = data.date ? new Date(data.date) : new Date();
        const monthStr = `${prodDate.getFullYear()}-${String(prodDate.getMonth() + 1).padStart(2, '0')}`;

        // Fetch raw material data
        const rawMaterial = await this.rawMaterialRepo.findOne({
          where: { id: data.raw_material_id },
          relations: ['product'],
        });

        if (!rawMaterial) {
          throw new Error('Raw Material not found');
        }

        // Get raw material price - try multiple sources
        const rawMaterialPrice = Number(
          rawMaterial.product?.cost_price ??
            rawMaterial.last_purchase_price ??
            0,
        );

        // Warn if price is zero
        if (rawMaterialPrice === 0) {
          console.warn('Raw Material Price is 0 for', rawMaterial.product?.name ?? '(deleted product)');
        }

        // Calculate Machine-Specific Hourly Cost for this month
        const hourlyCost = await this.calculateHourlyCost(monthStr, data.machine_id);

        // Calculate cost per piece using the hours-based formula
        const unitCost = this.calculatePieceCost({
          rawMaterialPrice: rawMaterialPrice,
          pieceWeight: Number(mold.product_weight),
          hourlyCost: hourlyCost,
          hoursWorked: Number(data.hours_worked || 8), // Default 8 hours if not provided
          totalPieces: Number(data.pieces_produced || 1),
        });

        // Save the calculated cost per piece
        data.overhead_cost = unitCost;

        // Calculate total cost for this production
        const newPieces = Number(data.pieces_produced || 1);

        // Calculate Weighted Average Cost for the product
        // New WAC = ((Old Qty * Old Cost) + (New Qty * New Unit Cost)) / (Old Qty + New Qty)
        let newWAC = 0;
        if (oldStockQty + newPieces > 0) {
          newWAC =
            (oldStockQty * oldCost + newPieces * unitCost) /
            (oldStockQty + newPieces);
        } else {
          newWAC = unitCost;
        }

        // Update Product Cost
        await this.productRepo.update(product.id, { cost_price: newWAC });

        // Update Stock
        productStock.quantity =
          Number(productStock.quantity) + Number(data.pieces_produced);
        await this.stockRepo.save(productStock);

        // DEFERRED: Stock Movement creation moved to after saving production to get valid ID
      }
    }

    // 4. Save Production Record
    const production = this.productionRepo.create(data);
    const savedProduction = await this.productionRepo.save(production);

    // UPDATE MOLD LIFECYCLE
    if (data.mold_id) {
      const mold = await this.moldRepo.findOne({ where: { id: data.mold_id } });
      if (mold) {
        // Estimate shots based on pieces produced and cavities (default 1 if 0)
        const shots = data.pieces_produced
          ? Math.ceil(Number(data.pieces_produced) / (mold.cavities || 1))
          : 0;

        mold.current_shots = (mold.current_shots || 0) + shots;
        mold.total_production_cycles = (mold.total_production_cycles || 0) + 1;

        // Update lifecycle status
        const usagePercent =
          (mold.current_shots / (mold.max_shots || 1000000)) * 100;
        if (usagePercent >= 90) mold.life_cycle_status = 'critical';
        else if (usagePercent >= 75) mold.life_cycle_status = 'warning';
        else mold.life_cycle_status = 'good';

        await this.moldRepo.save(mold);
      }
    }

    // 5. Create Stock Movement (Now with valid reference_id)
    if (data.mold_id && data.pieces_produced) {
      const mold = await this.moldRepo.findOne({ where: { id: data.mold_id } });
      if (mold) {
        const productName = `بلاستيك ${mold.name}`;
        const product = await this.productRepo.findOne({
          where: { name: productName, type: 'SEMI_FINISHED' },
        });
        if (product) {
          const stock = await this.stockRepo.findOne({
            where: { product_id: product.id },
          });

          await this.stockMovementRepo.save({
            product_id: product.id,
            warehouse_id: stock?.warehouse_id || (await this.getPlasticWarehouseId()),
            type: MovementType.IN,
            quantity: data.pieces_produced,
            reference_type: 'PRODUCTION',
            reference_id: savedProduction.id, // now valid
            date: data.date || new Date(),
            notes: `Production #${savedProduction.id}`,
          });
        }
      }
    }

    // 5. Deduct Raw Material Stock
    if (data.raw_material_id && data.total_production_kg) {
      const rawMaterial = await this.rawMaterialRepo.findOne({
        where: { id: data.raw_material_id },
      });
      if (rawMaterial) {
        const rmStock = await this.stockRepo.findOne({
          where: { product_id: rawMaterial.product_id },
        });
        if (rmStock) {
          rmStock.quantity =
            Number(rmStock.quantity) - Number(data.total_production_kg);
          await this.stockRepo.save(rmStock);

          await this.stockMovementRepo.save({
            product_id: rawMaterial.product_id,
            warehouse_id: rmStock.warehouse_id,
            type: MovementType.OUT,
            quantity: data.total_production_kg,
            reference_type: 'PRODUCTION',
            reference_id: savedProduction.id,
            date: data.date || new Date(),
            notes: `Used in production: ${savedProduction.id}`,
          });
        }
      }
    }

    // 6. AUTO-DEDUCT BOM ITEMS (Accessories, Packaging, etc.)
    if (data.mold_id && data.pieces_produced) {
      const mold = await this.moldRepo.findOne({ where: { id: data.mold_id } });
      if (mold && mold.product_id) {
        const bom = await this.bomRepo.findOne({
          where: { product_id: mold.product_id },
          relations: ['items'],
        });

        if (bom && bom.items.length > 0) {
          for (const item of bom.items) {
            const requiredQty =
              Number(item.quantity) * Number(data.pieces_produced);
            const itemStock = await this.stockRepo.findOne({
              where: { product_id: item.product_id },
            });

            if (itemStock) {
              itemStock.quantity = Number(itemStock.quantity) - requiredQty;
              await this.stockRepo.save(itemStock);

              await this.stockMovementRepo.save({
                product_id: item.product_id,
                warehouse_id: itemStock.warehouse_id,
                type: MovementType.OUT,
                quantity: requiredQty,
                reference_type: 'PRODUCTION_BOM',
                reference_id: savedProduction.id,
                date: data.date || new Date(),
                notes: `BOM Deduction for Production #${savedProduction.id}`,
              });
            }
          }
        }
      }
    }

    // 7. Post to Accounting
    if (data.pieces_produced && data.overhead_cost) {
      const totalCost =
        Number(data.pieces_produced) * Number(data.overhead_cost);
      await this.accountingService.postAutomaticEntry({
        type: 'PRODUCTION',
        amount: totalCost,
        reference: `PROD-${savedProduction.id}`,
        description: `إنتاج - اجمالي تكلفة الدفعة ${savedProduction.id}`,
      });
    }

    return savedProduction;
  }

  async deleteProduction(id: number) {
    const production = await this.productionRepo.findOne({
      where: { id },
      relations: ['mold', 'raw_material'],
    });
    if (!production) throw new Error('Production record not found');

    // 1. Return Raw Material to Stock
    if (production.raw_material_id && production.total_production_kg) {
      const rawMaterial = await this.rawMaterialRepo.findOne({
        where: { id: production.raw_material_id },
      });
      if (rawMaterial) {
        const stock = await this.stockRepo.findOne({
          where: { product_id: rawMaterial.product_id },
        });
        if (stock) {
          stock.quantity =
            Number(stock.quantity) + Number(production.total_production_kg);
          await this.stockRepo.save(stock);

          await this.stockMovementRepo.save({
            product_id: rawMaterial.product_id,
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

    // 2. Remove Semi-Finished Product from Stock
    if (production.mold && production.pieces_produced) {
      const productName = `بلاستيك ${production.mold.name}`;
      const product = await this.productRepo.findOne({
        where: { name: productName, type: 'SEMI_FINISHED' },
      });
      if (product) {
        const stock = await this.stockRepo.findOne({
          where: { product_id: product.id },
        });
        if (stock) {
          stock.quantity =
            Number(stock.quantity) - Number(production.pieces_produced);
          await this.stockRepo.save(stock);

          await this.stockMovementRepo.save({
            product_id: product.id,
            warehouse_id: stock.warehouse_id || (await this.getPlasticWarehouseId()),
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

    // 3. REVERSE BOM DEDUCTIONS
    if (
      production.mold &&
      production.pieces_produced &&
      production.mold.product_id
    ) {
      const bom = await this.bomRepo.findOne({
        where: { product_id: production.mold.product_id },
        relations: ['items'],
      });

      if (bom && bom.items.length > 0) {
        for (const item of bom.items) {
          const requiredQty =
            Number(item.quantity) * Number(production.pieces_produced);
          const itemStock = await this.stockRepo.findOne({
            where: { product_id: item.product_id },
          });

          if (itemStock) {
            itemStock.quantity = Number(itemStock.quantity) + requiredQty;
            await this.stockRepo.save(itemStock);

            await this.stockMovementRepo.save({
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

    return this.productionRepo.delete(id);
  }

  async getLastMoldForMachine(machineId: number) {
    const lastProduction = await this.productionRepo.findOne({
      where: { machine_id: machineId },
      order: { date: 'DESC', id: 'DESC' },
      relations: ['mold'],
    });
    return lastProduction?.mold || null;
  }

  // History Aggregation
  async getMachineHistory(machineId: number) {
    const production = await this.productionRepo.find({
      where: { machine_id: machineId },
      order: { date: 'ASC' },
      relations: ['mold'],
    });

    const history: any[] = [];
    let currentRun: any = null;

    for (const record of production) {
      if (!currentRun || currentRun.mold.id !== record.mold.id) {
        if (currentRun) history.push(currentRun);
        currentRun = {
          mold: record.mold,
          startDate: record.date,
          endDate: record.date,
          pieces: 0,
          totalCost: 0,
        };
      }

      currentRun.endDate = record.date;
      const pieces = Number(record.pieces_produced || 0);
      currentRun.pieces += pieces;

      // overhead_cost now contains the FULL cost per piece (raw material + power)
      const pieceCost = Number(record.overhead_cost || 0);
      currentRun.totalCost += pieceCost * pieces;
    }

    if (currentRun) history.push(currentRun);

    const enrichedHistory = history.map((run) => ({
      ...run,
      averageCostPerPiece: run.pieces > 0 ? run.totalCost / run.pieces : 0,
    }));

    return enrichedHistory.reverse(); // Newest first
  }

  async getMoldHistory(moldId: number) {
    const production = await this.productionRepo.find({
      where: { mold_id: moldId },
      order: { date: 'ASC' },
      relations: ['machine'],
    });

    const history: any[] = [];
    let currentRun: any = null;

    for (const record of production) {
      if (!currentRun || currentRun.machine.id !== record.machine.id) {
        if (currentRun) history.push(currentRun);
        currentRun = {
          machine: record.machine,
          startDate: record.date,
          endDate: record.date,
          pieces: 0,
          totalCost: 0,
        };
      }

      currentRun.endDate = record.date;
      const pieces = Number(record.pieces_produced || 0);
      currentRun.pieces += pieces;

      // overhead_cost now contains the FULL cost per piece
      const pieceCost = Number(record.overhead_cost || 0);
      currentRun.totalCost += pieceCost * pieces;
    }

    if (currentRun) history.push(currentRun);

    const enrichedHistory = history.map((run) => ({
      ...run,
      averageCostPerPiece: run.pieces > 0 ? run.totalCost / run.pieces : 0,
    }));

    return enrichedHistory.reverse();
  }

  async getMoldStats(moldId: number) {
    const productions = await this.productionRepo.find({
      where: { mold_id: moldId },
      order: { date: 'DESC' },
      take: 30, // Last 30 production records
    });

    if (productions.length === 0) return { averageDailyProduction: 0 };

    const totalWeight = productions.reduce(
      (sum, p) => sum + Number(p.total_production_kg || 0),
      0,
    );
    const average = totalWeight / productions.length;

    return {
      averageDailyProduction: average,
    };
  }
  // BOMs
  async getBOMs() {
    return this.bomRepo.find({
      relations: ['product', 'items', 'items.product'],
    });
  }

  async createBOM(data: Partial<BOM>) {
    const bom = this.bomRepo.create(data);
    return this.bomRepo.save(bom);
  }

  async getBOM(id: number) {
    return this.bomRepo.findOne({
      where: { id },
      relations: ['product', 'items', 'items.product'],
    });
  }

  async updateBOM(
    id: number,
    data: { name?: string; items?: { product_id: number; quantity: number }[] },
  ) {
    const bom = await this.bomRepo.findOne({ where: { id } });
    if (!bom) throw new Error('BOM not found');

    if (data.name) bom.name = data.name;
    await this.bomRepo.save(bom);

    if (data.items) {
      // 1. Delete old items
      await this.bomItemRepo.delete({ bom_id: id });

      // 2. Create new items
      const newItems = data.items.map((i) => {
        return this.bomItemRepo.create({
          bom_id: id,
          product_id: i.product_id,
          quantity: i.quantity,
        });
      });
      await this.bomItemRepo.save(newItems);
    }
    return this.getBOM(id);
  }

  // Assembly
  async createAssembly(data: { bom_id: number; quantity: number; date: Date }) {
    const bom = await this.bomRepo.findOne({
      where: { id: data.bom_id },
      relations: ['items', 'items.product', 'product'],
    });
    if (!bom) throw new Error('BOM not found');

    // 1. Check Stock & Calculate Cost
    let totalCost = 0;
    for (const item of bom.items) {
      const requiredQty = Number(item.quantity) * Number(data.quantity);
      const stock = await this.stockRepo.findOne({
        where: { product_id: item.product_id },
      });

      if (!stock || Number(stock.quantity) < requiredQty) {
        throw new Error(`Not enough stock for component: ${item.product.name}`);
      }

      totalCost += Number(item.product.cost_price) * requiredQty;
    }

    // 2. Deduct Components
    for (const item of bom.items) {
      const requiredQty = Number(item.quantity) * Number(data.quantity);
      const stock = await this.stockRepo.findOne({
        where: { product_id: item.product_id },
      });

      if (!stock) {
        throw new Error(`Stock not found for product: ${item.product_id}`);
      }

      stock.quantity = Number(stock.quantity) - requiredQty;
      await this.stockRepo.save(stock);

      await this.stockMovementRepo.save({
        product_id: item.product_id,
        warehouse_id: stock.warehouse_id,
        type: MovementType.OUT,
        quantity: requiredQty,
        reference_type: 'ASSEMBLY',
        reference_id: 0, // Will update later or ignore
        date: new Date(),
        notes: `Assembly for ${bom.product.name}`,
      });
    }

    // 3. Add Finished Product
    let finishedStock = await this.stockRepo.findOne({
      where: { product_id: bom.product_id },
    });
    if (!finishedStock) {
      // Assume default warehouse 1 if not exists
      finishedStock = this.stockRepo.create({
        product_id: bom.product_id,
        warehouse_id: 1,
        quantity: 0,
      });
    }
    finishedStock.quantity =
      Number(finishedStock.quantity) + Number(data.quantity);
    await this.stockRepo.save(finishedStock);

    await this.stockMovementRepo.save({
      product_id: bom.product_id,
      warehouse_id: finishedStock.warehouse_id,
      type: MovementType.IN,
      quantity: data.quantity,
      reference_type: 'ASSEMBLY',
      reference_id: 0,
      date: new Date(),
      notes: `Assembly Output`,
    });

    // 4. Save Order
    const order = this.assemblyRepo.create({
      bom_id: data.bom_id,
      quantity_produced: data.quantity,
      date: data.date,
      total_cost: totalCost,
      status: 'COMPLETED',
    });

    return this.assemblyRepo.save(order);
  }

  async getAssemblyOrders() {
    return this.assemblyRepo.find({
      relations: ['bom', 'bom.product'],
      order: { date: 'DESC' },
    });
  }

  // ==================== RAW MATERIALS ====================

  // Get all raw materials with stock levels
  async getRawMaterials() {
    const rawMaterials = await this.rawMaterialRepo.find({
      relations: ['product', 'preferred_supplier'],
    });

    // Enrich with stock information
    const enriched = await Promise.all(
      rawMaterials.map(async (rm) => {
        const stock = await this.stockRepo.findOne({
          where: { product_id: rm.product_id },
        });

        return {
          ...rm,
          current_stock: stock ? Number(stock.quantity) : 0,
          stock_status:
            !stock || Number(stock.quantity) === 0
              ? 'OUT_OF_STOCK'
              : Number(stock.quantity) <= Number(rm.reorder_point)
                ? 'LOW_STOCK'
                : 'NORMAL',
        };
      }),
    );

    return enriched;
  }

  // Get single raw material
  async getRawMaterial(id: number) {
    const rm = await this.rawMaterialRepo.findOne({
      where: { id },
      relations: [
        'product',
        'preferred_supplier',
        'supplier_materials',
        'supplier_materials.supplier',
      ],
    });

    if (!rm) throw new Error('Raw material not found');

    const stock = await this.stockRepo.findOne({
      where: { product_id: rm.product_id },
    });

    return {
      ...rm,
      current_stock: stock ? Number(stock.quantity) : 0,
    };
  }

  // Create raw material
  async createRawMaterial(data: Partial<RawMaterial>) {
    // Ensure the product exists and is of type RAW
    if (data.product_id) {
      const product = await this.productRepo.findOne({
        where: { id: data.product_id },
      });
      if (!product) throw new Error('Product not found');
      if (product.type !== 'RAW')
        throw new Error('Product must be of type RAW');
    }

    const rawMaterial = this.rawMaterialRepo.create(data);
    return this.rawMaterialRepo.save(rawMaterial);
  }

  // Update raw material
  async updateRawMaterial(id: number, data: Partial<RawMaterial>) {
    await this.rawMaterialRepo.update(id, data);
    return this.getRawMaterial(id);
  }

  // Delete raw material
  async deleteRawMaterial(id: number) {
    return this.rawMaterialRepo.delete(id);
  }

  // Record consumption (manual or automatic)
  async recordConsumption(data: {
    raw_material_id: number;
    quantity: number;
    assembly_order_id?: number;
    production_id?: number;
    batch_number?: string;
    notes?: string;
  }) {
    const rawMaterial = await this.getRawMaterial(data.raw_material_id);
    if (!rawMaterial) throw new Error('Raw material not found');

    // Get current cost
    const costPerUnit =
      rawMaterial.last_purchase_price || rawMaterial.product.cost_price || 0;
    const totalCost = Number(costPerUnit) * Number(data.quantity);

    const consumption = this.consumptionRepo.create({
      ...data,
      cost_per_unit: costPerUnit,
      total_cost: totalCost,
      consumed_at: new Date(),
    });

    // Deduct from stock
    const stock = await this.stockRepo.findOne({
      where: { product_id: rawMaterial.product_id },
    });

    if (stock) {
      stock.quantity = Number(stock.quantity) - Number(data.quantity);
      await this.stockRepo.save(stock);

      // Record stock movement
      await this.stockMovementRepo.save({
        product_id: rawMaterial.product_id,
        warehouse_id: stock.warehouse_id,
        type: MovementType.OUT,
        quantity: data.quantity,
        reference_type: 'CONSUMPTION',
        reference_id: data.assembly_order_id || data.production_id || 0,
        date: new Date(),
        notes: data.notes || 'Raw material consumption',
      });
    }

    return this.consumptionRepo.save(consumption);
  }

  // Get consumption history
  async getConsumptionHistory(filters?: {
    raw_material_id?: number;
    start_date?: Date;
    end_date?: Date;
  }) {
    const where: any = {};

    if (filters?.raw_material_id) {
      where.raw_material_id = filters.raw_material_id;
    }

    if (filters?.start_date && filters?.end_date) {
      where.consumed_at = Between(filters.start_date, filters.end_date);
    }

    return this.consumptionRepo.find({
      where,
      relations: [
        'raw_material',
        'raw_material.product',
        'assembly_order',
        'production',
      ],
      order: { consumed_at: 'DESC' },
    });
  }

  // Get low stock alerts
  async getLowStockAlerts() {
    const rawMaterials = await this.getRawMaterials();
    return rawMaterials.filter(
      (rm) =>
        rm.stock_status === 'LOW_STOCK' || rm.stock_status === 'OUT_OF_STOCK',
    );
  }

  // Get supplier materials for a specific supplier
  async getSupplierMaterials(supplierId: number) {
    return this.supplierMaterialRepo.find({
      where: { supplier_id: supplierId },
      relations: ['raw_material', 'raw_material.product'],
    });
  }

  // Get materials for a specific raw material
  async getMaterialSuppliers(rawMaterialId: number) {
    return this.supplierMaterialRepo.find({
      where: { raw_material_id: rawMaterialId },
      relations: ['supplier'],
      order: { is_preferred: 'DESC', price: 'ASC' },
    });
  }

  // Add supplier to raw material
  async addSupplierMaterial(data: Partial<SupplierMaterial>) {
    // If this is marked as preferred, unmark others
    if (data.is_preferred && data.raw_material_id) {
      await this.supplierMaterialRepo.update(
        { raw_material_id: data.raw_material_id },
        { is_preferred: false },
      );
    }

    const supplierMaterial = this.supplierMaterialRepo.create(data);
    return this.supplierMaterialRepo.save(supplierMaterial);
  }

  // Update supplier material
  async updateSupplierMaterial(id: number, data: Partial<SupplierMaterial>) {
    // If marking as preferred, unmark others
    if (data.is_preferred) {
      const existing = await this.supplierMaterialRepo.findOne({
        where: { id },
      });
      if (existing) {
        await this.supplierMaterialRepo.update(
          { raw_material_id: existing.raw_material_id },
          { is_preferred: false },
        );
      }
    }

    await this.supplierMaterialRepo.update(id, data);
    return this.supplierMaterialRepo.findOne({ where: { id } });
  }

  // Delete supplier material
  async deleteSupplierMaterial(id: number) {
    return this.supplierMaterialRepo.delete(id);
  }

  // Calculate production cost based on BOM
  async calculateProductionCost(bomId: number, quantity: number) {
    const bom = await this.bomRepo.findOne({
      where: { id: bomId },
      relations: ['items', 'items.product'],
    });

    if (!bom) throw new Error('BOM not found');

    let totalCost = 0;
    const breakdown: any[] = [];

    for (const item of bom.items) {
      const requiredQty = Number(item.quantity) * Number(quantity);
      const itemCost = Number(item.product.cost_price) * requiredQty;

      totalCost += itemCost;
      breakdown.push({
        product: item.product,
        quantity_per_unit: item.quantity,
        total_quantity: requiredQty,
        cost_per_unit: item.product.cost_price,
        total_cost: itemCost,
      });
    }

    return {
      bom_id: bomId,
      quantity,
      total_cost: totalCost,
      cost_per_unit: totalCost / quantity,
      breakdown,
    };
  }
  // BOM Explosion: تفجير قائمة المكونات إلى أدق المستويات
  // تقوم بإرجاع جميع المكونات المطلوبة لتجميع منتج بكمية محددة
  // تدعم التفجير التكراري (إذا كان المكون نفسه له BOM)
  async explodeBOM(bomId: number, quantity: number) {
    const bom = await this.bomRepo.findOne({
      where: { id: bomId },
      relations: ['product', 'items', 'items.product'],
    });

    if (!bom) throw new Error('BOM not found');

    const components: any[] = [];
    let totalWeight = 0;

    for (const item of bom.items) {
      const requiredQty = Number(item.quantity) * Number(quantity);
      const product = item.product;

      // التحقق من وجود BOM فرعي لهذا المكون
      const subBom = await this.bomRepo.findOne({
        where: { product_id: product.id },
        relations: ['items', 'items.product'],
      });

      if (subBom && subBom.items.length > 0) {
        // تفجير تكراري للمكونات الفرعية
        const subResult = await this.explodeBOM(subBom.id, requiredQty);
        components.push(...subResult.components);
        totalWeight += subResult.total_weight_grams;
      } else {
        // مكون نهائي (leaf) — أضف تفاصيله
        const weight = Number(product.weight_grams) || 0;
        const itemWeight = weight * requiredQty;
        totalWeight += itemWeight;

        components.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          specs: product.description || '',
          weight_grams: weight,
          raw_material_type: product.raw_material_type || '',
          image_path: product.image_path || '',
          quantity_per_unit: Number(item.quantity), // كمية لكل وحدة من المنتج النهائي
          total_quantity: requiredQty,
          unit: product.unit,
          total_weight_grams: itemWeight,
          total_weight_kg: itemWeight / 1000,
        });
      }
    }

    return {
      bom_id: bomId,
      bom_name: bom.name,
      product_name: bom.product?.name || '',
      requested_quantity: quantity,
      total_components: components.length,
      total_weight_grams: totalWeight,
      total_weight_kg: totalWeight / 1000,
      components,
    };
  }

  // Add stock to raw material (Purchase/Manual In)
  async addRawMaterialStock(data: {
    raw_material_id: number;
    quantity: number;
    price?: number;
    supplier_id?: number;
    date: Date;
    notes?: string;
  }) {
    // Verify the raw material exists
    const rawMaterialEntity = await this.rawMaterialRepo.findOne({
      where: { id: data.raw_material_id },
    });
    if (!rawMaterialEntity) throw new Error('Raw material not found');

    // Use update() (not save()) to avoid TypeORM cascading the loaded relations
    if (data.price) {
      await this.rawMaterialRepo.update(data.raw_material_id, {
        last_purchase_price: data.price,
      });
      // Also keep the product cost_price in sync
      await this.productRepo.update(rawMaterialEntity.product_id, {
        cost_price: data.price,
      });
    }

    // Update Stock — resolve the real warehouse ID (not hardcoded 1)
    const warehouseId = await this.getDefaultWarehouseId();

    let stock = await this.stockRepo.findOne({
      where: { product_id: rawMaterialEntity.product_id },
    });

    if (!stock) {
      stock = this.stockRepo.create({
        product_id: rawMaterialEntity.product_id,
        warehouse_id: warehouseId,
        quantity: 0,
      });
    }

    stock.quantity = Number(stock.quantity) + Number(data.quantity);
    await this.stockRepo.save(stock);

    // Record Movement
    const movementDate = data.date ? new Date(data.date) : new Date();
    const movement = this.stockMovementRepo.create({
      product_id: rawMaterialEntity.product_id,
      warehouse_id: stock?.warehouse_id || (await this.getDefaultWarehouseId()),
      type: MovementType.IN,
      quantity: data.quantity,
      reference_type: 'PURCHASE',
      reference_id: data.supplier_id || 0,
      date: movementDate,
      notes:
        data.notes ||
        `Purchase/Add Stock | Date: ${movementDate.toISOString().split('T')[0]} | Price: ${data.price ?? 'N/A'}`,
    });
    return this.stockMovementRepo.save(movement);
  }

  // Get all movements for a raw material
  async getRawMaterialMovements(rawMaterialId: number) {
    const rawMaterial = await this.getRawMaterial(rawMaterialId);
    if (!rawMaterial) throw new Error('Raw material not found');

    // We need movements for the product ID
    const movements = await this.stockMovementRepo.find({
      where: { product_id: rawMaterial.product_id },
      order: { date: 'DESC' },
    });

    // Enrich with some context if needed (like Supplier name if reference_id is supplier)
    // For simplicity, returning movements directly. Frontend maps them.
    // We might want to map the structure to be cleaner for frontend
    return movements.map((m) => ({
      id: m.id,
      date: m.date,
      type: m.type,
      quantity: m.quantity,
      price: m.notes?.includes('Price:')
        ? parseFloat(m.notes.split('Price:')[1])
        : null, // Naive parsing, or valid if we store price
      reference:
        m.type === 'IN'
          ? m.reference_id
            ? `M-${m.reference_id}`
            : 'Manual'
          : m.reference_type,
      notes: m.notes,
    }));
  }

  // Delete stock movement
  async deleteStockMovement(id: number) {
    const movement = await this.stockMovementRepo.findOne({ where: { id } });
    if (!movement) throw new Error('Stock movement not found');

    // Reverse Stock Impact
    const stock = await this.stockRepo.findOne({
      where: {
        product_id: movement.product_id,
        warehouse_id: movement.warehouse_id,
      },
    });

    if (stock) {
      if (movement.type === MovementType.IN) {
        // Was IN, so we remove from stock
        stock.quantity = Number(stock.quantity) - Number(movement.quantity);
      } else if (movement.type === MovementType.OUT) {
        // Was OUT, so we add back to stock
        stock.quantity = Number(stock.quantity) + Number(movement.quantity);
      }
      await this.stockRepo.save(stock);
    }

    return this.stockMovementRepo.delete(id);
  }

  // Create stock movement (for OUT movements like consumption)
  async createStockMovement(data: {
    rawMaterialId: number;
    type: 'IN' | 'OUT';
    quantity: number;
    price?: number;
    date: Date;
    reference?: string;
    notes?: string;
  }) {
    // Verify the raw material exists
    const rawMaterial = await this.getRawMaterial(data.rawMaterialId);
    if (!rawMaterial) throw new Error('Raw material not found');

    // Get or create stock
    let stock = await this.stockRepo.findOne({
      where: { product_id: rawMaterial.product_id },
    });

    const warehouseId = await this.getDefaultWarehouseId();

    if (!stock) {
      stock = this.stockRepo.create({
        product_id: rawMaterial.product_id,
        warehouse_id: warehouseId,
        quantity: 0,
      });
    }

    // Update stock based on movement type
    if (data.type === 'IN') {
      stock.quantity = Number(stock.quantity) + Number(data.quantity);
    } else {
      stock.quantity = Number(stock.quantity) - Number(data.quantity);
    }
    await this.stockRepo.save(stock);

    // Record the movement
    const movement = this.stockMovementRepo.create({
      product_id: rawMaterial.product_id,
      warehouse_id: stock.warehouse_id || warehouseId,
      type: data.type === 'IN' ? MovementType.IN : MovementType.OUT,
      quantity: data.quantity,
      reference_type: data.reference || 'MANUAL',
      reference_id: 0,
      date: data.date ? new Date(data.date) : new Date(),
      notes: data.notes,
    });
    return this.stockMovementRepo.save(movement);
  }

  // Get All Stock Movements (with filters)
  async getAllStockMovements(filters: {
    type?: MovementType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.startDate && filters.endDate) {
      where.date = Between(filters.startDate, filters.endDate);
    }

    const movements = await this.stockMovementRepo.find({
      where,
      order: { date: 'DESC', id: 'DESC' },
      relations: ['product'],
    });

    return movements.map((m) => ({
      id: m.id,
      product_name: m.product?.name,
      date: m.date,
      quantity: m.quantity,
      type: m.type,
      price: m.notes?.includes('Price:')
        ? parseFloat(m.notes.split('Price:')[1])
        : null,
      reference: m.reference_id,
      notes: m.notes,
    }));
  }
  // Update Production
  // Update Production with Stock Adjustment
  async updateProduction(id: number, data: Partial<DailyProduction>) {
    const oldProduction = await this.productionRepo.findOne({
      where: { id },
      relations: ['mold', 'raw_material'],
    });
    if (!oldProduction) throw new Error('Production record not found');

    // 1. REVERSE Old Stock Movements

    // A. Add back Raw Material
    if (oldProduction.raw_material_id && oldProduction.total_production_kg) {
      const oldRm = await this.rawMaterialRepo.findOne({
        where: { id: oldProduction.raw_material_id },
      });
      if (oldRm) {
        const stock = await this.stockRepo.findOne({
          where: { product_id: oldRm.product_id },
        });
        if (stock) {
          stock.quantity =
            Number(stock.quantity) + Number(oldProduction.total_production_kg);
          await this.stockRepo.save(stock);

          // Log Reversal? Or just delete old movement?
          // Let's log a correction movement
          await this.stockMovementRepo.save({
            product_id: oldRm.product_id,
            warehouse_id: stock.warehouse_id,
            type: MovementType.IN, // Adding back
            quantity: oldProduction.total_production_kg,
            reference_type: 'PRODUCTION_CORRECTION',
            reference_id: id,
            date: new Date(),
            notes: `Modification reversal for Prod #${id}`,
          });
        }
      }
    }

    // B. Remove Semi-Finished Product
    if (oldProduction.mold && oldProduction.pieces_produced) {
      const productName = `بلاستيك ${oldProduction.mold.name}`;
      const product = await this.productRepo.findOne({
        where: { name: productName, type: 'SEMI_FINISHED' },
      });
      if (product) {
        const stock = await this.stockRepo.findOne({
          where: { product_id: product.id },
        });
        if (stock) {
          stock.quantity =
            Number(stock.quantity) - Number(oldProduction.pieces_produced);
          await this.stockRepo.save(stock);

          await this.stockMovementRepo.save({
            product_id: product.id,
            warehouse_id: stock.warehouse_id || (await this.getPlasticWarehouseId()),
            type: MovementType.OUT, // Removing
            quantity: oldProduction.pieces_produced,
            reference_type: 'PRODUCTION_CORRECTION',
            reference_id: id,
            date: new Date(),
            notes: `Modification reversal for Prod #${id}`,
          });
        }
      }
    }

    // 2. APPLY New Data (Recalculate Pieces)
    if (data.mold_id && data.total_production_kg) {
      const mold = await this.moldRepo.findOne({ where: { id: data.mold_id } });
      if (mold) {
        data.pieces_produced = Math.floor(
          (Number(data.total_production_kg) * 1000) /
            Number(mold.product_weight),
        );
      }
    }

    // 3. Update Database Record
    await this.productionRepo.update(id, data);
    const updatedProduction = await this.productionRepo.findOne({
      where: { id },
      relations: ['mold', 'raw_material'],
    });

    if (!updatedProduction)
      throw new Error('Failed to retrieve updated production record');

    // 4. APPLY New Stock Movements (Same as Create)

    // A. Deduct Raw Material
    if (
      updatedProduction.raw_material_id &&
      updatedProduction.total_production_kg
    ) {
      const rm = await this.rawMaterialRepo.findOne({
        where: { id: updatedProduction.raw_material_id },
      });
      if (rm) {
        const stock = await this.stockRepo.findOne({
          where: { product_id: rm.product_id },
        });
        if (stock) {
          stock.quantity =
            Number(stock.quantity) -
            Number(updatedProduction.total_production_kg);
          await this.stockRepo.save(stock);

          await this.stockMovementRepo.save({
            product_id: rm.product_id,
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

    // B. Add Semi-Finished Product
    if (updatedProduction.mold && updatedProduction.pieces_produced) {
      const productName = `بلاستيك ${updatedProduction.mold.name}`;
      let product = await this.productRepo.findOne({
        where: { name: productName, type: 'SEMI_FINISHED' },
      });

      // Create if not exists (unlikely if loop A succeeded, but possible if mold changed)
      if (!product) {
        product = this.productRepo.create({
          name: productName,
          type: 'SEMI_FINISHED',
          unit: 'piece',
        });
        await this.productRepo.save(product);
      }

      let stock = await this.stockRepo.findOne({
        where: { product_id: product.id },
      });
      if (!stock) {
        stock = this.stockRepo.create({
          product_id: product.id,
          warehouse_id: await this.getPlasticWarehouseId(),
          quantity: 0,
        });
      }
      stock.quantity =
        Number(stock.quantity) + Number(updatedProduction.pieces_produced);
      await this.stockRepo.save(stock);

      await this.stockMovementRepo.save({
        product_id: product.id,
        warehouse_id: await this.getPlasticWarehouseId(),
        type: MovementType.IN,
        quantity: updatedProduction.pieces_produced,
        reference_type: 'PRODUCTION',
        reference_id: id,
        date: updatedProduction.date || new Date(),
        notes: `Production: ${updatedProduction.total_production_kg}kg`,
      });
    }

    return updatedProduction;
  }

  // Recalculate Stock from History
  async recalculateRawMaterialStock(rawMaterialId: number) {
    const rawMaterial = await this.getRawMaterial(rawMaterialId);
    if (!rawMaterial) throw new Error('Raw material not found');

    const movements = await this.stockMovementRepo.find({
      where: { product_id: rawMaterial.product_id },
    });

    let calculatedQuantity = 0;
    for (const mov of movements) {
      if (mov.type === MovementType.IN) {
        calculatedQuantity += Number(mov.quantity);
      } else if (mov.type === MovementType.OUT) {
        calculatedQuantity -= Number(mov.quantity);
      }
    }

    // Update Stock
    let stock = await this.stockRepo.findOne({
      where: { product_id: rawMaterial.product_id },
    });
    if (!stock) {
      stock = this.stockRepo.create({
        product_id: rawMaterial.product_id,
        warehouse_id: 1, // Default
        quantity: 0,
      });
    }

    stock.quantity = calculatedQuantity;
    await this.stockRepo.save(stock);

    return {
      raw_material_id: rawMaterialId,
      product_id: rawMaterial.product_id,
      calculated_stock: calculatedQuantity,
      movement_count: movements.length,
    };
  }

  // ==================== IMPORT / EXPORT ====================

  async exportMachines() {
    const machines = await this.machineRepo.find();
    const data = machines.map((m) => ({
      ID: m.id,
      Name: m.name,
      'Serial Number': m.serial_number,
      'Power Consumption': m.power_consumption,
      'Purchase Date': m.purchase_date,
      Status: m.status,
      Notes: m.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Machines');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importMachines(data: any[]) {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    for (const row of data) {
      try {
        // Map CSV/Excel columns to entity fields
        const machineData: any = {
          name: row['Name'],
          serial_number: row['Serial Number']
            ? String(row['Serial Number'])
            : null,
          power_consumption: row['Power Consumption'],
          status: row['Status'] || 'ACTIVE',
          notes: row['Notes'],
        };

        // Handle Date
        if (row['Purchase Date']) {
          // Check if it's an Excel date number
          if (typeof row['Purchase Date'] === 'number') {
            // Excel date to JS Date: (Value - 25569) * 86400 * 1000
            const date = new Date(
              (row['Purchase Date'] - 25569) * 86400 * 1000,
            );
            machineData.purchase_date = date;
          } else {
            machineData.purchase_date = new Date(row['Purchase Date']);
          }
        }

        if (!machineData.name) throw new Error('Name is required');

        if (row['ID']) {
          const exists = await this.machineRepo.findOne({
            where: { id: row['ID'] },
          });
          if (exists) {
            await this.machineRepo.update(row['ID'], machineData);
          } else {
            const newMachine = this.machineRepo.create(machineData);
            await this.machineRepo.save(newMachine);
          }
        } else {
          await this.machineRepo.save(this.machineRepo.create(machineData));
        }
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${JSON.stringify(row)}: ${err.message}`);
      }
    }
    return results;
  }

  async exportMolds() {
    const molds = await this.moldRepo.find({ relations: ['product'] });
    const data = molds.map((m) => ({
      ID: m.id,
      Name: m.name,
      'Product ID': m.product_id,
      'Product Name': m.product?.name || '',
      Weight: m.product_weight,
      Cavities: m.cavities,
      Status: m.status,
      Notes: m.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Molds');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importMolds(data: any[]) {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    for (const row of data) {
      try {
        const moldData: any = {
          name: row['Name'],
          product_id: row['Product ID'] || null,
          product_weight: row['Weight'],
          cavities: row['Cavities'],
          status: row['Status'] || 'GOOD',
          notes: row['Notes'],
        };
        if (!moldData.name) throw new Error('Name is required');

        if (row['ID']) {
          const exists = await this.moldRepo.findOne({
            where: { id: row['ID'] },
          });
          if (exists) {
            await this.moldRepo.update(row['ID'], moldData);
          } else {
            const newMold = this.moldRepo.create(moldData);
            await this.moldRepo.save(newMold);
          }
        } else {
          await this.moldRepo.save(this.moldRepo.create(moldData));
        }
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${JSON.stringify(row)}: ${err.message}`);
      }
    }
    return results;
  }
  async exportRawMaterials() {
    const materials = await this.rawMaterialRepo.find({
      relations: ['product', 'preferred_supplier'],
    });
    const data = materials.map((m) => ({
      ID: m.id,
      Name: m.product?.name || 'Unknown',
      'Reorder Point': m.reorder_point,
      'Reorder Quantity': m.reorder_quantity,
      'Average Consumption': m.avg_consumption_rate,
      'Last Purchase Price': m.last_purchase_price,
      'Last Purchase Date': m.last_purchase_date,
      Notes: m.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RawMaterials');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importRawMaterials(data: any[]) {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        const normalized: Record<string, any> = {};
        for (const key of Object.keys(row)) {
          normalized[key.trim()] = row[key];
          const lower = key.trim().toLowerCase();
          if (!(lower in normalized)) normalized[lower] = row[key];
        }

        const name = normalized['name'] || normalized['Name'];
        if (!name) throw new Error('Name is required');

        // Helper: find first matching column (exact then case-insensitive)
        const col = (...variants: string[]) => {
          for (const v of variants) {
            if (v in normalized) return v;
            const lower = v.toLowerCase();
            if (lower in normalized) return lower;
          }
          return undefined;
        };

        const priceKey = col('Last Purchase Price', 'last purchase price', 'price', 'unit price') || 'Last Purchase Price';
        const dateKey = col('Last Purchase Date', 'last purchase date', 'date');
        const notesKey = col('Notes', 'notes');
        const reorderPointKey = col('Reorder Point', 'reorder point') || 'Reorder Point';
        const reorderQtyKey = col('Reorder Quantity', 'reorder quantity') || 'Reorder Quantity';
        const avgConsKey = col('Average Consumption', 'average consumption', 'avg consumption') || 'Average Consumption';
        const idKey = col('ID', 'id');

        const hasPrice = priceKey !== undefined;

        // 1. Find or Create Product
        let product = await this.productRepo.findOne({
          where: { name: name, type: 'RAW' },
        });

        if (!product) {

          const newPrice = hasPrice ? (normalized[priceKey] ?? 0) : 0;
          product = this.productRepo.create({
            name: name,
            type: 'RAW',
            unit: 'kg',
            cost_price: newPrice,
          });
          await this.productRepo.save(product);
        }

        // 2. Prepare Data — only include fields that exist in the Excel columns
        const rmData: any = {
          product_id: product.id,
          reorder_point: normalized[reorderPointKey] || 0,
          reorder_quantity: normalized[reorderQtyKey] || 0,
          avg_consumption_rate: normalized[avgConsKey] || 0,
        };

        if (hasPrice) {
          const v = normalized[priceKey];
          rmData.last_purchase_price = (v != null && v !== '') ? Number(v) : null;
        }
        if (notesKey) {
          rmData.notes = normalized[notesKey];
        }
        if (dateKey) {
          const dv = normalized[dateKey];
          if (dv) {
            rmData.last_purchase_date = typeof dv === 'number'
              ? new Date((dv - 25569) * 86400 * 1000)
              : new Date(dv);
          } else {
            rmData.last_purchase_date = null;
          }
        }

        // 3. Update or Create Raw Material
        if (idKey && normalized[idKey]) {
          const rawId = Number(normalized[idKey]);
          const exists = await this.rawMaterialRepo.findOne({ where: { id: rawId } });
          if (exists) {
            await this.rawMaterialRepo.update(rawId, rmData);
          } else {
            await this.rawMaterialRepo.save(this.rawMaterialRepo.create(rmData));
          }
        } else {
          const existingRm = await this.rawMaterialRepo.findOne({
            where: { product_id: product.id },
          });
          if (existingRm) {
            await this.rawMaterialRepo.update(existingRm.id, rmData);
          } else {
            await this.rawMaterialRepo.save(this.rawMaterialRepo.create(rmData));
          }
        }

        if (hasPrice && rmData.last_purchase_price != null) {
          await this.productRepo.update(product.id, {
            cost_price: rmData.last_purchase_price,
          });
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${JSON.stringify(row)}: ${err.message}`);
      }
    }
    return results;
  }

  async getManufacturingStats() {
    const todayStr = new Date().toISOString().split('T')[0];

    const activeMachines = await this.machineRepo.count({
      where: { status: MachineStatus.ACTIVE },
    });

    const dailyProductionOrders = await this.productionRepo.count({
      where: { date: todayStr as any },
    });

    const productions = await this.productionRepo.find({
      where: { date: todayStr as any },
      select: ['mold_id'],
    });
    const usedMoldsCount = new Set(productions.map((p) => p.mold_id)).size;

    return {
      activeMachines,
      dailyProductionOrders,
      usedMoldsCount,
    };
  }
}

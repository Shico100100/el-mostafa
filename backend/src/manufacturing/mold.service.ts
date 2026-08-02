import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Mold } from './entities/mold.entity';
import { MoldIssue } from './entities/mold-issue.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { Machine } from './entities/machine.entity';
import { WarehouseHelper } from './warehouse.helper';
import { FixedCostService } from './fixed-cost.service';
import { BOM, BOMItem } from './entities/bom.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';
import { jsonToSheetBuffer } from '../utils/excel-export';

@Injectable()
export class MoldService {
  private readonly logger = new Logger(MoldService.name);

  constructor(
    @InjectRepository(Mold)
    private moldRepo: Repository<Mold>,
    @InjectRepository(MoldIssue)
    private moldIssueRepo: Repository<MoldIssue>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
    @InjectRepository(BOM)
    private bomRepo: Repository<BOM>,
    @InjectRepository(BOMItem)
    private bomItemRepo: Repository<BOMItem>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepo: Repository<PurchaseOrderItem>,
    private warehouseHelper: WarehouseHelper,
    private fixedCostService: FixedCostService,
  ) {}

  async getAllMolds(page = 1, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await this.moldRepo.findAndCount({
      relations: ['product'],
      skip,
      take,
    });
    return {
      items,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
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
    if (updatedMold) await this.ensureProductForMold(updatedMold);
    return updatedMold;
  }

  async deleteMold(id: number) {
    return this.moldRepo.delete(id);
  }

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
    let stock = await this.stockRepo.findOne({
      where: { product_id: product.id },
    });
    if (!stock) {
      stock = this.stockRepo.create({
        product_id: product.id,
        warehouse_id: await this.warehouseHelper.getPlasticWarehouseId(),
        quantity: 0,
      });
      await this.stockRepo.save(stock);
    }
    return product;
  }

  async syncAllMoldProducts() {
    const molds = await this.moldRepo.find();
    await Promise.all(molds.map((mold) => this.ensureProductForMold(mold)));
    return {
      message: 'Synchronization complete',
      processed_molds: molds.length,
    };
  }

  async getSemiFinishedDetails(productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId, type: 'SEMI_FINISHED' },
    });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    const moldName = product.name.replace('بلاستيك ', '');
    const mold = await this.moldRepo.findOne({ where: { name: moldName } });
    if (!mold)
      return { product, mold: null, bestMachine: null, costBreakdown: null };

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
    if (machineStats?.machine_id)
      bestMachine =
        (await this.machineRepo.findOne({
          where: { id: machineStats.machine_id },
        })) || null;

    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const {
      avgTotalFixedCost,
      avgTotalElectricity,
      avgActiveDays,
      totalFixedCostDetails,
    } = await this.fixedCostService.getAveragedMonthlyCosts(monthStr, 1);
    const machineCount = (await this.machineRepo.count()) || 1;
    const nonElectricHourly =
      avgActiveDays > 0
        ? (avgTotalFixedCost - avgTotalElectricity) /
          avgActiveDays /
          8 /
          machineCount
        : 0;

    let rawMaterialPrice = 0;
    if (mold.product_id) {
      const rawProduct = await this.productRepo.findOne({
        where: { id: mold.product_id },
      });
      rawMaterialPrice =
        Number(rawProduct?.cost_price) ||
        Number(rawProduct?.last_purchase_price) ||
        0;
    }
    if (rawMaterialPrice === 0) {
      const lastProd = await this.productionRepo.findOne({
        where: { mold: { id: mold.id } },
        relations: ['product'],
        order: { date: 'DESC', id: 'DESC' },
      });
      if (lastProd?.product)
        rawMaterialPrice =
          Number(lastProd.product?.cost_price) ||
          Number(lastProd.product?.last_purchase_price) ||
          0;
    }

    const prevMonthStr = this.fixedCostService.getPreviousMonthStrings(
      monthStr,
      1,
    )[0];
    const [, pm] = prevMonthStr.split('-').map(Number);
    const pStart = `${prevMonthStr}-01`;
    const pEnd = `${prevMonthStr}-${new Date(new Date().getFullYear(), pm, 0).getDate()}`;
    const allMonthProds = await this.productionRepo.find({
      where: {
        date: Between(pStart as unknown as Date, pEnd as unknown as Date),
      },
    });
    const totalMachineHours = allMonthProds.reduce(
      (sum, p) => sum + (Number(p.hours_worked) || 0),
      0,
    );
    const electricityPerMachineHour =
      totalMachineHours > 0 ? avgTotalElectricity / totalMachineHours : 0;

    let costBreakdown: any = null;
    const machine =
      bestMachine ||
      (await this.machineRepo.findOne({ order: { id: 'ASC' as const } }));
    if (machine && Number(mold.product_weight) > 0) {
      const defaultHours = 8;
      const prodStats = await this.productionRepo
        .createQueryBuilder('p')
        .select('SUM(p.pieces_produced)', 'total_pieces')
        .addSelect('SUM(p.hours_worked)', 'total_hours')
        .where('p.mold_id = :moldId', { moldId: mold.id })
        .andWhere('p.pieces_produced IS NOT NULL')
        .andWhere('p.hours_worked IS NOT NULL')
        .andWhere('p.hours_worked > 0')
        .getRawOne();
      const defaultPieces =
        prodStats?.total_pieces &&
        prodStats?.total_hours &&
        Number(prodStats.total_hours) > 0
          ? Math.floor(
              (Number(prodStats.total_pieces) / Number(prodStats.total_hours)) *
                defaultHours,
            )
          : Math.floor((1000 * 1000) / Number(mold.product_weight)) || 1000;

      const rawCostPerPiece =
        (rawMaterialPrice / 1000) * Number(mold.product_weight);
      const electricityHourly = electricityPerMachineHour;
      const machineDepreciationHourly =
        Number(machine.price) > 0 && Number(machine.useful_life_years) > 0
          ? Number(machine.price) /
            Number(machine.useful_life_years) /
            313 /
            defaultHours
          : 0;
      const moldAmortizationPerPiece =
        Number(mold.price) > 0 && Number(mold.max_shots) > 0
          ? (Number(mold.price) * 1.5) / Number(mold.max_shots)
          : 0;
      const machineHourly =
        nonElectricHourly + electricityHourly + machineDepreciationHourly;
      const fixedPerPiece =
        defaultPieces > 0 ? (machineHourly * defaultHours) / defaultPieces : 0;
      const totalPerPiece =
        rawCostPerPiece + fixedPerPiece + moldAmortizationPerPiece;

      costBreakdown = {
        rawMaterialPrice,
        pieceWeightGrams: Number(mold.product_weight),
        rawCostPerPiece,
        nonElectricHourly,
        machinePowerKw: Number(machine.power_consumption),
        electricityPerMachineHour,
        electricityHourly,
        machineDepreciationHourly,
        machineHourly,
        hoursWorked: defaultHours,
        estimatedPieces: defaultPieces,
        fixedPerPiece,
        moldAmortizationPerPiece,
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
        price: Number(mold.price) || 0,
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
            price: Number(bestMachine.price) || 0,
            useful_life_years: bestMachine.useful_life_years || 5,
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
      relations: ['machine', 'mold', 'product'],
      order: { date: 'ASC', id: 'ASC' },
    });
    const productGroups: Record<
      string,
      { productions: typeof productions; productId?: number }
    > = {};
    for (const prod of productions) {
      if (!prod.mold || !prod.pieces_produced) continue;
      const productName = `بلاستيك ${prod.mold.name}`;
      if (!productGroups[productName])
        productGroups[productName] = { productions: [] };
      productGroups[productName].productions.push(prod);
    }
    let updatedCount = 0;
    for (const [productName, group] of Object.entries(productGroups)) {
      const product = await this.productRepo.findOne({
        where: { name: productName, type: 'SEMI_FINISHED' },
      });
      if (!product) continue;
      productGroups[productName].productId = product.id;
      let totalQty = 0,
        totalCost = 0;
      for (const prod of group.productions) {
        const monthStr = prod.date
          ? `${new Date(prod.date).getFullYear()}-${String(new Date(prod.date).getMonth() + 1).padStart(2, '0')}`
          : '';
        const hourlyCost = monthStr
          ? await this.fixedCostService.calculateHourlyCost(
              monthStr,
              prod.machine_id,
            )
          : 0;
        let rawMaterialPrice = 0;
        if (prod.product_id) {
          const rawProd = await this.productRepo.findOne({
            where: { id: prod.product_id },
          });
          rawMaterialPrice =
            Number(rawProd?.cost_price) ||
            Number(rawProd?.last_purchase_price) ||
            0;
        }
        const unitCost = this.fixedCostService.calculatePieceCost({
          rawMaterialPrice,
          pieceWeight: Number(prod.mold.product_weight),
          hourlyCost,
          hoursWorked: Number(prod.hours_worked || 8),
          totalPieces: Number(prod.pieces_produced),
        });
        totalQty += Number(prod.pieces_produced);
        totalCost += Number(prod.pieces_produced) * unitCost;
      }
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

  async getMoldIssues(moldId?: number) {
    const where: any = {};
    if (moldId) where.mold = { id: moldId };
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

  async getMoldStats(moldId: number) {
    const productions = await this.productionRepo.find({
      where: { mold: { id: moldId } },
      order: { date: 'DESC' },
      take: 30,
    });
    if (productions.length === 0) return { averageDailyProduction: 0 };
    const totalWeight = productions.reduce(
      (sum, p) => sum + Number(p.total_production_kg || 0),
      0,
    );
    return { averageDailyProduction: totalWeight / productions.length };
  }

  async getMoldHistory(moldId: number) {
    const production = await this.productionRepo.find({
      where: { mold: { id: moldId } },
      order: { date: 'ASC' },
      relations: ['machine'],
    });
    const history: any[] = [];
    let currentRun: any = null;
    for (const record of production) {
      if (!currentRun || currentRun.machine?.id !== record.machine?.id) {
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
      currentRun.totalCost += Number(record.overhead_cost || 0) * pieces;
    }
    if (currentRun) history.push(currentRun);
    return history
      .map((run) => ({
        ...run,
        averageCostPerPiece: run.pieces > 0 ? run.totalCost / run.pieces : 0,
      }))
      .reverse();
  }

  async getLastMoldForMachine(machineId: number) {
    const lastProduction = await this.productionRepo.findOne({
      where: { machine: { id: machineId } },
      order: { date: 'DESC', id: 'DESC' },
      relations: ['mold'],
    });
    return lastProduction?.mold || null;
  }

  async exportMolds() {
    const molds = await this.moldRepo.find({ relations: ['product'] });
    const rows = molds.map((m) => ({
      name: m.name,
      product_name: m.product?.name,
      cavities: m.cavities,
      product_weight: m.product_weight,
      price: m.price,
      max_shots: m.max_shots,
      status: m.status,
      life_cycle_status: m.life_cycle_status,
    }));
    return jsonToSheetBuffer(rows, 'Molds');
  }

  async importMolds(data: any[]) {
    let created = 0,
      updated = 0;
    for (const row of data) {
      if (!row.name) continue;
      const existing = await this.moldRepo.findOne({
        where: { name: row.name },
      });
      if (existing) {
        await this.moldRepo.update(existing.id, row);
        updated++;
      } else {
        await this.moldRepo.save(this.moldRepo.create(row));
        created++;
      }
    }
    return { created, updated };
  }
}

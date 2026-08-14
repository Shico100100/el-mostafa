import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { FixedCost } from './entities/fixed-cost.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { Machine } from './entities/machine.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class FixedCostService {
  constructor(
    @InjectRepository(FixedCost)
    private fixedCostRepo: Repository<FixedCost>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepo: Repository<PurchaseOrderItem>,
    @InjectRepository(StockMovement)
    private stockMovementRepo: Repository<StockMovement>,
    private accountingService: AccountingService,
  ) {}

  async createFixedCost(data: Partial<FixedCost>) {
    const cost = this.fixedCostRepo.create(data);
    return this.fixedCostRepo.save(cost);
  }

  async getFixedCosts(month?: string, year?: string, page = 1, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;
    let where: any = {};
    let order: any = {};
    if (month) {
      where = { month };
      order = { created_at: 'DESC' };
    } else if (year) {
      where = { month: Like(`${year}-%`) };
      order = { month: 'ASC', created_at: 'DESC' };
    } else {
      order = { month: 'DESC', created_at: 'DESC' };
    }
    const [items, total] = await this.fixedCostRepo.findAndCount({
      where,
      order,
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

  async deleteFixedCost(id: number) {
    await this.fixedCostRepo.delete(id);
    return { deleted: true };
  }

  private getActiveDaysInMonth(year: number, month: number): number {
    const endDate = new Date(year, month, 0);
    const totalDays = endDate.getDate();
    let fridays = 0;
    for (let day = 1; day <= totalDays; day++) {
      if (new Date(year, month - 1, day).getDay() === 5) fridays++;
    }
    return totalDays - fridays;
  }

  getPreviousMonthStrings(monthStr: string, count: number): string[] {
    const [y, m] = monthStr.split('-').map(Number);
    const months: string[] = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date(y, m - i - 1, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      );
    }
    return months;
  }

  async getAveragedMonthlyCosts(monthStr: string, monthsToAverage: number = 3) {
    const monthStrings = this.getPreviousMonthStrings(
      monthStr,
      monthsToAverage,
    );
    let totalFixedSum = 0,
      totalElectricSum = 0,
      totalDaysSum = 0;
    const details: { month: string; amount: number }[] = [];
    for (const mStr of monthStrings) {
      const [y, m] = mStr.split('-').map(Number);
      const costs = await this.fixedCostRepo.find({ where: { month: mStr } });
      const monthFixed = costs
        .filter((c) => c.category !== 'ASSEMBLY_WAGES')
        .reduce((sum, c) => sum + Number(c.amount), 0);
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

  async calculateHourlyCost(
    monthStr: string,
    machineId?: number,
    dailyHours: number = 8,
  ): Promise<number> {
    if (dailyHours <= 0) dailyHours = 8;
    const { avgTotalFixedCost, avgTotalElectricity, avgActiveDays } =
      await this.getAveragedMonthlyCosts(monthStr, 1);
    if (avgTotalFixedCost === 0 || avgActiveDays === 0) return 0;

    const [ly, lm] = monthStr.split('-').map(Number);
    const monthEndDate = `${monthStr}-${new Date(ly, lm, 0).getDate()}`;
    const activeMachines = await this.productionRepo
      .createQueryBuilder('p')
      .select('COUNT(DISTINCT p.machine_id)', 'cnt')
      .where('p.date BETWEEN :start AND :end', {
        start: monthStr + '-01',
        end: monthEndDate,
      })
      .getRawOne();
    const machineCount =
      Number(activeMachines?.cnt) || (await this.machineRepo.count()) || 1;

    const nonElectricHourly =
      (avgTotalFixedCost - avgTotalElectricity) /
      avgActiveDays /
      dailyHours /
      machineCount;
    let machineDepreciationHourly = 0;
    if (machineId) {
      const machine = await this.machineRepo.findOne({
        where: { id: machineId },
      });
      if (
        machine &&
        Number(machine.price) > 0 &&
        Number(machine.useful_life_years) > 0
      ) {
        machineDepreciationHourly =
          Number(machine.price) /
          Number(machine.useful_life_years) /
          313 /
          dailyHours;
      }
    }
    let machineElectricHourly = 0;
    if (machineId) {
      // Use current month's electricity bill first, fall back to averaged
      const currentMonthCosts = await this.fixedCostRepo.find({
        where: { month: monthStr },
      });
      const currentMonthElectric = currentMonthCosts
        .filter((c) => c.category === 'ELECTRICITY')
        .reduce((sum, c) => sum + Number(c.amount), 0);
      const electricBill =
        currentMonthElectric > 0 ? currentMonthElectric : avgTotalElectricity;

      const monthProductions = await this.productionRepo.find({
        where: {
          date: Between(
            (monthStr + '-01') as unknown as Date,
            monthEndDate as unknown as Date,
          ),
        },
      });
      const totalHours = monthProductions.reduce(
        (sum, p) => sum + (Number(p.hours_worked) || 0),
        0,
      );
      if (totalHours > 0) machineElectricHourly = electricBill / totalHours;
    }
    return (
      nonElectricHourly + machineElectricHourly + machineDepreciationHourly
    );
  }

  calculatePieceCost(params: {
    rawMaterialPrice: number;
    pieceWeight: number;
    hourlyCost: number;
    hoursWorked: number;
    totalPieces: number;
  }): number {
    const rawCost = (params.rawMaterialPrice / 1000) * params.pieceWeight;
    const fixedCost =
      params.totalPieces > 0
        ? (params.hourlyCost * params.hoursWorked) / params.totalPieces
        : 0;
    return rawCost + fixedCost;
  }

  async calculateOverheadRate(targetMonth: string): Promise<number> {
    const costs = await this.fixedCostRepo.find({
      where: { month: targetMonth },
    });
    const totalFixedCost = costs.reduce((sum, c) => sum + Number(c.amount), 0);
    if (totalFixedCost === 0) return 0;
    const startDate = new Date(`${targetMonth}-01`);
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0,
    );
    const productions = await this.productionRepo.find({
      where: { date: Between(startDate, endDate) },
    });
    const totalWeightKg = productions.reduce(
      (sum, p) => sum + Number(p.total_production_kg || 0),
      0,
    );
    if (totalWeightKg === 0) return 0;
    return totalFixedCost / totalWeightKg;
  }

  async getLastPurchasePrice(productId: number): Promise<number> {
    const item = await this.purchaseOrderItemRepo.findOne({
      where: { product: { id: productId } },
      order: { id: 'DESC' },
    });
    return item ? Number(item.price) : 0;
  }
}

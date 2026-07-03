import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../../purchases/entities/purchase-order.entity';
import { FixedCost } from '../../manufacturing/entities/fixed-cost.entity';
import { DailyProduction } from '../../manufacturing/entities/daily-production.entity';

@Injectable()
export class FinancialReportService {
  constructor(
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
    @InjectRepository(FixedCost)
    private fixedCostRepo: Repository<FixedCost>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
  ) {}

  async getSalesReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const sales = await this.salesOrderRepo.find({
      where: { order_date: Between(start, end) },
      relations: ['items', 'items.product'],
      order: { order_date: 'ASC' },
    });

    let totalSales = 0;
    sales.forEach((sale) => {
      totalSales += Number(sale.total_amount);
    });

    return { totalSales, salesCount: sales.length, sales };
  }

  async getPurchasesReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const purchases = await this.purchaseOrderRepo.find({
      where: { order_date: Between(start, end) },
      relations: ['items', 'items.product'],
      order: { order_date: 'ASC' },
    });

    let totalPurchases = 0;
    purchases.forEach((purchase) => {
      totalPurchases += Number(purchase.total_amount);
    });

    return { totalPurchases, purchasesCount: purchases.length, purchases };
  }

  async getProfitLossReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const sales = await this.salesOrderRepo.find({
      where: { order_date: Between(start, end) },
      relations: ['items', 'items.product'],
    });

    let totalSales = 0;
    let totalCOGS = 0;
    sales.forEach((order) => {
      totalSales += Number(order.total_amount);
      order.items.forEach((item) => {
        totalCOGS +=
          Number(item.quantity) * Number(item.product?.cost_price || 0);
      });
    });

    const purchases = await this.purchaseOrderRepo.find({
      where: { order_date: Between(start, end) },
    });
    const totalPurchases = purchases.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );

    const startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const endMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
    const fixedCosts = await this.fixedCostRepo.find({
      where: { month: Between(startMonth, endMonth) },
    });
    const totalFixedCosts = fixedCosts.reduce(
      (sum, cost) => sum + Number(cost.amount),
      0,
    );

    const grossProfit = totalSales - totalCOGS;
    const totalExpenses = totalCOGS + totalFixedCosts;
    const netProfit = totalSales - totalExpenses;

    return {
      totalSales,
      totalCOGS,
      grossProfit,
      totalFixedCosts,
      totalPurchases,
      totalExpenses,
      netProfit,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      sales,
    };
  }

  async getDashboardTrends() {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      );
    }

    return Promise.all(
      months.map(async (month) => {
        const [year, m] = month.split('-').map(Number);
        const start = new Date(year, m - 1, 1);
        const end = new Date(year, m, 0, 23, 59, 59, 999);

        const sales = await this.salesOrderRepo.find({
          where: { order_date: Between(start, end) },
        });
        const totalSales = sales.reduce(
          (sum, o) => sum + Number(o.total_amount),
          0,
        );

        const purchases = await this.purchaseOrderRepo.find({
          where: { order_date: Between(start, end) },
        });
        const totalPurchases = purchases.reduce(
          (sum, o) => sum + Number(o.total_amount),
          0,
        );

        const formations = await this.productionRepo.find({
          where: { date: Between(start, end) },
        });
        const totalProduction = formations.reduce(
          (sum, p) => sum + Number(p.pieces_produced || 0),
          0,
        );

        return {
          month,
          sales: totalSales,
          purchases: totalPurchases,
          production: totalProduction,
        };
      }),
    );
  }
}

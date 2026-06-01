import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Account } from '../accounting/entities/account.entity';
import { DailyProduction } from '../manufacturing/entities/daily-production.entity';
import { Machine } from '../manufacturing/entities/machine.entity';
import { Attendance } from '../manufacturing/entities/attendance.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';
import { LessThan } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SalesOrder)
    private salesRepo: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private purchaseRepo: Repository<PurchaseOrder>,
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(SalesOrderItem)
    private salesItemRepo: Repository<SalesOrderItem>,
  ) {}

  async getStats() {
    const now = new Date();
    // Start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    // Start of next month
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    monthEnd.setHours(0, 0, 0, 0);

    // 1. Total Sales (This Month)
    const sales = await this.salesRepo.find({
      where: {
        order_date: Between(monthStart, monthEnd),
      },
    });
    const totalSales = sales.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );

    // 2. Total Purchases (This Month)
    const purchases = await this.purchaseRepo.find({
      where: {
        order_date: Between(monthStart, monthEnd),
      },
    });
    const totalPurchases = purchases.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );

    // 3. Treasury Balance
    const treasury = await this.accountRepo.findOne({ where: { id: 1 } });
    const treasuryBalance = treasury ? Number(treasury.balance) : 0;

    // 4. Total Stock Value
    const stockValueQuery = await this.accountRepo.query(`
            SELECT SUM(s.quantity * p.cost_price) as total_value
            FROM stock s
            JOIN products p ON s.product_id = p.id
        `);
    const totalStockValue = Number(stockValueQuery[0]?.total_value || 0);

    // 5. Active Production Orders (This Month)
    const productionCount = await this.productionRepo.count({
      where: {
        date: Between(monthStart, monthEnd),
      },
    });

    // 6. Maintenance Stats
    const maintenanceOverdueCount = await this.machineRepo.count({
      where: {
        next_maintenance: LessThan(now),
      },
    });

    // 7. Top Customers (This Month)
    const topCustomers = await this.salesRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .select('customer.name', 'name')
      .addSelect('SUM(order.total_amount)', 'total')
      .where('order.order_date BETWEEN :start AND :end', {
        start: monthStart,
        end: monthEnd,
      })
      .groupBy('customer.id')
      .orderBy('total', 'DESC')
      .limit(5)
      .getRawMany();

    // 8. Top Products (This Month)
    const topProducts = await this.salesItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .leftJoin('item.product', 'product')
      .select('product.name', 'name')
      .addSelect('SUM(item.quantity)', 'total')
      .where('order.order_date BETWEEN :start AND :end', {
        start: monthStart,
        end: monthEnd,
      })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('total', 'DESC')
      .limit(5)
      .getRawMany();

    // 9. Today's Attendance Summary
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendance = await this.attendanceRepo.find({
      where: {
        date: Between(
          todayStart.toISOString().split('T')[0],
          todayEnd.toISOString().split('T')[0],
        ),
      },
    });

    const attendanceSummary = {
      present: attendance.filter((a) => a.status === 'PRESENT').length,
      absent: attendance.filter((a) => a.status === 'ABSENT').length,
      late: attendance.filter((a) => a.status === 'LATE').length,
      total: attendance.length,
    };

    // 10. Trends (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentSales = await this.salesRepo.find({
      where: {
        order_date: Between(thirtyDaysAgo, now),
      },
      order: { order_date: 'ASC' },
    });

    const latestSales = await this.salesRepo.find({
      relations: ['customer'],
      order: { created_at: 'DESC' },
      take: 5,
    });

    const latestPurchases = await this.purchaseRepo.find({
      relations: ['supplier'],
      order: { created_at: 'DESC' },
      take: 5,
    });

    return {
      totalSales,
      totalPurchases,
      treasuryBalance,
      totalStockValue,
      productionCount,
      maintenanceOverdueCount,
      topCustomers,
      topProducts,
      attendanceSummary,
      salesTrend: this.groupByDate(recentSales, 'order_date', 'total_amount'),
      latestSales,
      latestPurchases,
    };
  }

  private groupByDate(items: any[], dateField: string, valueField: string) {
    const groups = items.reduce((acc, item) => {
      const date = new Date(item[dateField]).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + Number(item[valueField]);
      return acc;
    }, {});

    return Object.keys(groups).map((date) => ({
      date,
      value: groups[date],
    }));
  }
}

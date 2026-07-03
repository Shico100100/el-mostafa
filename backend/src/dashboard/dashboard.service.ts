import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CacheService } from '../cache/cache.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Account } from '../accounting/entities/account.entity';
import { DailyProduction } from '../manufacturing/entities/daily-production.entity';
import { Machine } from '../manufacturing/entities/machine.entity';
import { Attendance } from '../manufacturing/entities/attendance.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';

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
    private cache: CacheService,
    private notificationsService: NotificationsService,
  ) {}

  async getStats() {
    const cacheKey = 'dashboard:stats';
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    monthEnd.setHours(0, 0, 0, 0);

    const [
      salesResult,
      purchasesResult,
      treasury,
      stockValueQuery,
      productionSum,
      maintenanceOverdueCount,
      topCustomers,
      topProducts,
      attendanceSummary,
      salesTrend,
      latestSales,
      latestPurchases,
      unreadNotifications,
    ] = await Promise.all([
      // 1. Total Sales (This Month)
      this.salesRepo
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.total_amount), 0)', 'total')
        .where('order.order_date BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
        .getRawOne(),

      // 2. Total Purchases (This Month)
      this.purchaseRepo
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.total_amount), 0)', 'total')
        .where('order.order_date BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
        .getRawOne(),

      // 3. Treasury Balance
      this.accountRepo.findOne({ where: { id: 1 } }),

      // 4. Total Stock Value
      this.accountRepo.query(`
        SELECT COALESCE(SUM(s.quantity * p.cost_price), 0) as total_value
        FROM stock s
        JOIN products p ON s.product_id = p.id
      `),

      // 5. Total Pieces Produced (This Month)
      this.productionRepo
        .createQueryBuilder('dp')
        .select('COALESCE(SUM(dp.pieces_produced), 0)', 'total')
        .where('dp.date BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
        .getRawOne(),

      // 6. Machines with Overdue Maintenance
      this.machineRepo.count({
        where: { next_maintenance: LessThan(now) },
      }),

      // 7. Top 5 Customers by Total Sales (This Month)
      this.salesRepo
        .createQueryBuilder('order')
        .leftJoin('order.customer', 'customer')
        .select('customer.name', 'name')
        .addSelect('SUM(order.total_amount)', 'total')
        .where('order.order_date BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
        .andWhere('customer.id IS NOT NULL')
        .groupBy('customer.id')
        .addGroupBy('customer.name')
        .orderBy('total', 'DESC')
        .limit(5)
        .getRawMany(),

      // 8. Top 5 Products by Total Sales Quantity (This Month)
      this.salesItemRepo
        .createQueryBuilder('item')
        .innerJoin('item.order', 'order')
        .innerJoin('item.product', 'product')
        .select('product.name', 'name')
        .addSelect('SUM(item.quantity)', 'total')
        .where('order.order_date BETWEEN :start AND :end', { start: monthStart, end: monthEnd })
        .groupBy('product.id')
        .addGroupBy('product.name')
        .orderBy('total', 'DESC')
        .limit(5)
        .getRawMany(),

      // 9. Today's Attendance Summary (SQL GROUP BY)
      this.attendanceRepo
        .createQueryBuilder('att')
        .select(
          `SUM(CASE WHEN att.status = 'PRESENT' THEN 1 ELSE 0 END)`,
          'present',
        )
        .addSelect(
          `SUM(CASE WHEN att.status = 'ABSENT' THEN 1 ELSE 0 END)`,
          'absent',
        )
        .addSelect(
          `SUM(CASE WHEN att.status = 'LATE' THEN 1 ELSE 0 END)`,
          'late',
        )
        .addSelect('COUNT(*)', 'total')
        .where('att.date = :today', {
          today: now.toISOString().split('T')[0],
        })
        .getRawOne(),

      // 10. Sales Trend (Last 7 Days) - SQL GROUP BY
      this.salesRepo
        .createQueryBuilder('order')
        .select("TO_CHAR(order.order_date, 'YYYY-MM-DD')", 'date')
        .addSelect('SUM(order.total_amount)', 'value')
        .where('order.order_date >= :sevenDaysAgo', {
          sevenDaysAgo: (() => {
            const d = new Date(now);
            d.setDate(d.getDate() - 6);
            d.setHours(0, 0, 0, 0);
            return d;
          })(),
        })
        .andWhere('order.order_date <= :endOfToday', { endOfToday: now })
        .groupBy("TO_CHAR(order.order_date, 'YYYY-MM-DD')")
        .orderBy("TO_CHAR(order.order_date, 'YYYY-MM-DD')", 'ASC')
        .getRawMany(),

      // 11. Latest 5 Sales Orders (with customer name in single query)
      this.salesRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.customer', 'customer')
        .orderBy('order.created_at', 'DESC')
        .take(5)
        .getMany(),

      // 12. Latest 5 Purchase Orders (with supplier name in single query)
      this.purchaseRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.supplier', 'supplier')
        .orderBy('order.created_at', 'DESC')
        .take(5)
        .getMany(),

      // 13. Unread Notifications Count
      this.notificationsService.getUnreadCount(),
    ]);

    const totalSales = Number(salesResult?.total) || 0;
    const totalPurchases = Number(purchasesResult?.total) || 0;
    const treasuryBalance = treasury ? Number(treasury.balance) : 0;
    const totalStockValue = Number(stockValueQuery[0]?.total_value) || 0;
    const productionCount = Number(productionSum?.total) || 0;

    const result = {
      totalSales,
      totalPurchases,
      treasuryBalance,
      totalStockValue,
      productionCount,
      maintenanceOverdueCount,
      topCustomers,
      topProducts,
      attendanceSummary: {
        present: Number(attendanceSummary?.present) || 0,
        absent: Number(attendanceSummary?.absent) || 0,
        late: Number(attendanceSummary?.late) || 0,
        total: Number(attendanceSummary?.total) || 0,
      },
      salesTrend: (salesTrend || []).map((row: any) => ({
        date: row.date,
        value: Number(row.value) || 0,
      })),
      latestSales,
      latestPurchases,
      unreadNotifications,
    };
    await this.cache.set(cacheKey, result, 60);
    return result;
  }
}

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

interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  treasuryBalance: number;
  totalStockValue: number;
  productionCount: number;
  maintenanceOverdueCount: number;
  topCustomers: Array<{ name: string; total: string }>;
  topProducts: Array<{ name: string; total: string }>;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  salesTrend: Array<{ date: string; value: number }>;
  latestSales: SalesOrder[];
  latestPurchases: PurchaseOrder[];
  unreadNotifications: number;
}

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
    const cached = await this.cache.get<DashboardStats>(cacheKey);
    if (cached) return cached;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    monthEnd.setHours(0, 0, 0, 0);

    const batch1 = await Promise.all([
      this.salesRepo
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.total_amount), 0)', 'total')
        .where('order.order_date BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getRawOne(),
      this.purchaseRepo
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.total_amount), 0)', 'total')
        .where('order.order_date BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getRawOne(),
      this.accountRepo.findOne({ where: { code: '1103' } }),
      this.productionRepo
        .createQueryBuilder('dp')
        .select('COALESCE(SUM(dp.pieces_produced), 0)', 'total')
        .where('dp.date BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .getRawOne(),
    ]);

    const batch2 = await Promise.all([
      this.accountRepo.query(`
        SELECT COALESCE(SUM(mov_net.current_stock * p.cost_price), 0) as total_value
        FROM (
          SELECT product_id,
            COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS current_stock
          FROM stock_movements
          GROUP BY product_id
        ) mov_net
        JOIN products p ON mov_net.product_id = p.id
      `),
      this.machineRepo.count({
        where: { next_maintenance: LessThan(now) },
      }),
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
    ]);

    const batch3 = await Promise.all([
      this.salesRepo
        .createQueryBuilder('order')
        .leftJoin('order.customer', 'customer')
        .select('customer.name', 'name')
        .addSelect('SUM(order.total_amount)', 'total')
        .where('order.order_date BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd,
        })
        .andWhere('customer.id IS NOT NULL')
        .groupBy('customer.id')
        .addGroupBy('customer.name')
        .orderBy('total', 'DESC')
        .limit(5)
        .getRawMany(),
      this.salesItemRepo
        .createQueryBuilder('item')
        .innerJoin('item.order', 'order')
        .innerJoin('item.product', 'product')
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
        .getRawMany(),
      this.salesRepo
        .createQueryBuilder('order')
        .select("TO_CHAR(order.order_date, 'YYYY-MM-DD')", 'date')
        .addSelect('SUM(order.total_amount)', 'value')
        .where('order.order_date >= :startOfMonth', {
          startOfMonth: (() => {
            const d = new Date(now);
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            return d;
          })(),
        })
        .andWhere('order.order_date <= :endOfToday', { endOfToday: now })
        .groupBy("TO_CHAR(order.order_date, 'YYYY-MM-DD')")
        .orderBy("TO_CHAR(order.order_date, 'YYYY-MM-DD')", 'ASC')
        .getRawMany(),
      this.salesRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.customer', 'customer')
        .orderBy('order.created_at', 'DESC')
        .take(5)
        .getMany(),
    ]);

    const [salesResult, purchasesResult, treasury, productionSum] = batch1;
    const [stockValueQuery, maintenanceOverdueCount, attendanceSummary] =
      batch2;
    const [topCustomers, topProducts, salesTrend, latestSales] = batch3;

    const batch4 = await Promise.all([
      this.purchaseRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.supplier', 'supplier')
        .orderBy('order.created_at', 'DESC')
        .take(5)
        .getMany(),
      this.notificationsService.getUnreadCount(),
    ]);
    const [latestPurchases, unreadNotifications] = batch4;

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
      salesTrend: (salesTrend || []).map((row: Record<string, string>) => ({
        date: row.date,
        value: Number(row.value) || 0,
      })),
      latestSales,
      latestPurchases,
      unreadNotifications,
    };
    await this.cache.set(cacheKey, result, 300);
    return result;
  }
}

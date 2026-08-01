import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { MachineMaintenance } from '../manufacturing/entities/machine-maintenance.entity';
import { SalesOrder, OrderStatus } from '../sales/entities/sales-order.entity';
import { MaintenanceStatus } from '../manufacturing/entities/machine-maintenance.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(MachineMaintenance)
    private maintenanceRepo: Repository<MachineMaintenance>,
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    private notificationsGateway: NotificationsGateway,
    private dataSource: DataSource,
  ) {}

  async create(
    title: string,
    message: string,
    userId?: number,
    actionType?: string,
    actionData?: any,
  ) {
    const notification = this.notificationRepo.create({
      title,
      message,
      userId,
      actionType,
      actionData,
    });
    const saved = await this.notificationRepo.save(notification);
    this.notificationsGateway.emitNotification(saved);
    return saved;
  }

  async findAll() {
    return this.notificationRepo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getUnreadCount(): Promise<number> {
    return this.notificationRepo.count({ where: { isRead: false } });
  }

  async markAsRead(id: number) {
    return this.notificationRepo.update(id, { isRead: true });
  }

  async markAllRead() {
    return this.notificationRepo.update({ isRead: false }, { isRead: true });
  }

  // Proactive Alert Checks
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runSystemChecks() {
    this.logger.log('Running system-wide alert checks...');
    await this.checkLowStock();
    await this.checkUpcomingMaintenance();
    await this.checkOverdueSalesOrders();
  }

  private async checkLowStock() {
    const products = await this.productRepo.find();
    for (const product of products) {
      const result = await this.dataSource.query(
        `SELECT COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS total
         FROM stock_movements WHERE product_id = $1`,
        [product.id],
      );
      const totalQty = Number(result[0]?.total) || 0;
      const minStock = Number(product.min_stock || 0);

      if (totalQty <= minStock && minStock > 0) {
        const title = 'تنبيه نقص مخزون';
        const message = `المنتج "${product.name}" وصل للحد الأدنى للمخزون (${totalQty} ${product.unit})`;

        // Check if a similar unread notification already exists
        const existing = await this.notificationRepo.findOne({
          where: { title, message, isRead: false },
        });

        if (!existing) {
          await this.create(title, message);
        }
      }
    }
  }

  private async checkUpcomingMaintenance() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const maintenanceDue = await this.maintenanceRepo.find({
      where: {
        date: LessThanOrEqual(threeDaysFromNow),
        status: Not(MaintenanceStatus.COMPLETED),
      },
      relations: ['machine'],
    });

    for (const entry of maintenanceDue) {
      const title = 'تنبيه صيانة قريبة';
      const message = `الماكينة "${entry.machine?.name}" تتطلب صيانة بحلول ${entry.date.toLocaleDateString('ar-EG')}`;

      const existing = await this.notificationRepo.findOne({
        where: { title, message, isRead: false },
      });

      if (!existing) {
        await this.create(title, message);
      }
    }
  }

  private async checkOverdueSalesOrders() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const overdueOrders = await this.salesOrderRepo.find({
      where: {
        order_date: LessThanOrEqual(thirtyDaysAgo),
        status: Not(OrderStatus.COMPLETED),
      },
      relations: ['customer'],
    });

    for (const order of overdueOrders) {
      const title = 'تنبيه مبيعات متأخرة';
      const message = `أمر البيع رقم #${order.id} للعميل "${order.customer?.name}" تجاوز 30 يوماً بدون إغلاق.`;

      const existing = await this.notificationRepo.findOne({
        where: { title, message, isRead: false },
      });

      if (!existing) {
        await this.create(title, message);
      }
    }
  }
}

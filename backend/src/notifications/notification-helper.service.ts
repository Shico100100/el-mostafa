import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationHelperService {
  private readonly logger = new Logger(NotificationHelperService.name);

  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async create(params: {
    type: string;
    title: string;
    message: string;
    userId?: number;
    link?: string;
  }): Promise<void> {
    try {
      await this.notifRepo.save({
        type: params.type,
        title: params.title,
        message: params.message,
        userId: params.userId || 1,
        isRead: false,
        link: params.link,
      });
    } catch (e) {
      // Don't let notification creation break the request, but log for observability
      this.logger.warn(
        `Failed to create notification: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  async notifyNewOrder(orderId: number, customerName: string, amount: number) {
    await this.create({
      type: 'ORDER_CREATED',
      title: 'طلب بيع جديد',
      message: `تم إنشاء طلب بيع #${orderId} للعميل ${customerName} بقيمة ${amount.toLocaleString()} ج.م`,
      link: `/sales/orders`,
    });
  }

  async notifyPaymentReceived(customerName: string, amount: number) {
    await this.create({
      type: 'PAYMENT_RECEIVED',
      title: 'دفعة مالية مستلمة',
      message: `تم استلام ${amount.toLocaleString()} ج.م من ${customerName}`,
      link: `/sales/orders`,
    });
  }

  async notifyProductionComplete(
    productionId: number,
    product: string,
    quantity: number,
  ) {
    await this.create({
      type: 'PRODUCTION_COMPLETE',
      title: 'اكتمال إنتاج',
      message: `تم إنتاج ${quantity} قطعة من ${product} (#${productionId})`,
      link: `/manufacturing/production`,
    });
  }
}

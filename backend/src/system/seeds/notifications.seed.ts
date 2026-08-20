import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedNotifications(qr: QueryRunner) {
  await insertIgnore(qr, 'notifications', [
    {
      id: 1,
      title: 'تم إضافة طلب شراء جديد',
      message: 'تم إنشاء طلب شراء رقم PO-2026-003 لمورد LDPE',
      isRead: false,
      userId: 1,
      actionType: 'create_order',
      actionData: { orderId: 3 },
    },
    {
      id: 2,
      title: 'تنبيه مخزون منخفض',
      message: 'مخزون HDPE أقل من حد إعادة الطلب (500 كجم)',
      isRead: false,
      userId: 1,
      actionType: 'low_stock',
      actionData: { productId: 1, currentStock: 200 },
    },
    {
      id: 3,
      title: 'تم تسجيل إنتاج جديد',
      message: 'تم إنتاج 250 كرسي في الوردية المسائية',
      isRead: true,
      userId: 1,
      actionType: 'production_record',
      actionData: { productionId: 7 },
    },
  ]);
}

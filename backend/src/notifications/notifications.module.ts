import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { MachineMaintenance } from '../manufacturing/entities/machine-maintenance.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      Product,
      Stock,
      MachineMaintenance,
      SalesOrder,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}

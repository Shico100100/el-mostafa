import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { NotificationsModule } from '../notifications/notifications.module';

import { FixedCost } from '../manufacturing/entities/fixed-cost.entity';
import { DailyProduction } from '../manufacturing/entities/daily-production.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      PurchaseOrder,
      Product,
      Stock,
      FixedCost,
      DailyProduction,
    ]),
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

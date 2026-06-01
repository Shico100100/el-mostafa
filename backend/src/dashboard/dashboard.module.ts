import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Account } from '../accounting/entities/account.entity';
import { DailyProduction } from '../manufacturing/entities/daily-production.entity';
import { Machine } from '../manufacturing/entities/machine.entity';

import { Attendance } from '../manufacturing/entities/attendance.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      PurchaseOrder,
      Account,
      DailyProduction,
      Machine,
      Attendance,
      SalesOrderItem,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

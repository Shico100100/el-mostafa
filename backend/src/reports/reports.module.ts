import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { FinancialReportService } from './reports/financial-report.service';
import { AnalyticsService } from './reports/analytics.service';
import { BalanceSheetService } from './reports/balance-sheet.service';
import { AgedReceivablesService } from './reports/aged-receivables.service';
import { AgedPayablesService } from './reports/aged-payables.service';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { Customer } from '../sales/entities/customer.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { FixedCost } from '../manufacturing/entities/fixed-cost.entity';
import { DailyProduction } from '../manufacturing/entities/daily-production.entity';
import { Account } from '../accounting/entities/account.entity';
import { JournalEntry } from '../accounting/entities/journal-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      Customer,
      PurchaseOrder,
      Supplier,
      Product,
      Stock,
      FixedCost,
      DailyProduction,
      Account,
      JournalEntry,
    ]),
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    FinancialReportService,
    AnalyticsService,
    BalanceSheetService,
    AgedReceivablesService,
    AgedPayablesService,
  ],
})
export class ReportsModule {}

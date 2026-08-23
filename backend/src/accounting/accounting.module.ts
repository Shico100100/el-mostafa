import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service';
import { AccountCrudService } from './accounts/account-crud.service';
import { AccountingController } from './accounting.controller';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { BankingModule } from './banking/banking.module';
import { BudgetModule } from './budgets/budget.module';
import { FixedAssetModule } from './fixed-assets/fixed-asset.module';
import { JobModule } from './jobs/job.module';
import { PeriodCloseModule } from './period-close/period-close.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { TimeBillingModule } from './time-billing/time-billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, JournalEntry]),
    BankingModule,
    BudgetModule,
    FixedAssetModule,
    JobModule,
    PeriodCloseModule,
    ReconciliationModule,
    TimeBillingModule,
  ],
  controllers: [AccountingController],
  providers: [AccountingService, AccountCrudService],
  exports: [AccountingService],
})
export class AccountingModule {}

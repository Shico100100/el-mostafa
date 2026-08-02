import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankingService } from './banking.service';
import { BankingController } from './banking.controller';
import { BankAccount } from './entities/bank-account.entity';
import { BankTransaction } from './entities/bank-transaction.entity';
import { BankReconciliation } from './entities/bank-reconciliation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccount, BankTransaction, BankReconciliation])],
  controllers: [BankingController],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}

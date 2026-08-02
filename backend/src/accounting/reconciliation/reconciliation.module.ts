import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';
import { Account } from '../entities/account.entity';
import { JournalEntry } from '../entities/journal-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, JournalEntry])],
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}

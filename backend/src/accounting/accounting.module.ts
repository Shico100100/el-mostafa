import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingService } from './accounting.service';
import { AccountCrudService } from './accounts/account-crud.service';
import { AccountingController } from './accounting.controller';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, JournalEntry])],
  controllers: [AccountingController],
  providers: [AccountingService, AccountCrudService],
  exports: [AccountingService],
})
export class AccountingModule {}

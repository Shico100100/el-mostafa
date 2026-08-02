import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import {
  CreateAccountDto,
  CreateJournalEntryDto,
  ReverseJournalEntryDto,
} from './dto';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('accounts')
  getAccounts() {
    return this.accountingService.getAccounts();
  }

  @Post('accounts')
  createAccount(@Body() data: CreateAccountDto) {
    return this.accountingService.createAccount(data);
  }

  @Put('accounts/:id')
  updateAccount(@Param('id') id: string, @Body() data: CreateAccountDto) {
    return this.accountingService.updateAccount(+id, data);
  }

  @Get('journal')
  getJournalEntries(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.accountingService.getJournalEntries({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      startDate,
      endDate,
      accountId: accountId ? parseInt(accountId, 10) : undefined,
    });
  }

  @Post('journal')
  createJournalEntry(@Body() data: CreateJournalEntryDto) {
    return this.accountingService.createJournalEntry(data);
  }

  @Post('journal/reverse')
  reverseJournalEntry(@Body() data: ReverseJournalEntryDto) {
    return this.accountingService.reverseJournalEntry(data.entryIds);
  }

  @Post('balances/reconcile')
  reconcileBalances() {
    return this.accountingService.reconcileBalances();
  }

  @Get('trial-balance')
  getTrialBalance() {
    return this.accountingService.getTrialBalance();
  }
}

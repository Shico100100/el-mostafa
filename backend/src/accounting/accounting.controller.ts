import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto';

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
  getJournalEntries() {
    return this.accountingService.getJournalEntries();
  }

  @Post('journal')
  createJournalEntry(@Body() data: CreateJournalEntryDto) {
    return this.accountingService.createJournalEntry(data);
  }

  @Get('trial-balance')
  getTrialBalance() {
    return this.accountingService.getTrialBalance();
  }
}

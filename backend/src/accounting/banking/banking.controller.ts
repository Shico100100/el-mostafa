import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { BankingService } from './banking.service';

@Controller('accounting/banking')
export class BankingController {
  constructor(private bankingService: BankingService) {}

  @Get('accounts')
  findAllAccounts() {
    return this.bankingService.findAllAccounts();
  }

  @Get('accounts/:id')
  findOneAccount(@Param('id', ParseIntPipe) id: number) {
    return this.bankingService.findOneAccount(id);
  }

  @Post('accounts')
  createAccount(@Body() data: any) {
    return this.bankingService.createAccount(data);
  }

  @Put('accounts/:id')
  updateAccount(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.bankingService.updateAccount(id, data);
  }

  @Get('accounts/:id/transactions')
  getTransactions(@Param('id', ParseIntPipe) id: number) {
    return this.bankingService.getTransactions(id);
  }

  @Post('accounts/:id/transactions')
  addTransaction(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.bankingService.addTransaction(id, data);
  }

  @Get('accounts/:id/statement')
  getStatement(@Param('id', ParseIntPipe) id: number) {
    return this.bankingService.getStatement(id);
  }

  @Post('accounts/:id/reconcile')
  startReconciliation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { statementDate: string; statementBalance: number },
  ) {
    return this.bankingService.startReconciliation(
      id,
      new Date(body.statementDate),
      body.statementBalance,
    );
  }

  @Post('reconciliations/:id/complete')
  completeReconciliation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reconciledTxIds: number[] },
  ) {
    return this.bankingService.completeReconciliation(id, body.reconciledTxIds);
  }
}

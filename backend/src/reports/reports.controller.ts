import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { BalanceSheetService } from './reports/balance-sheet.service';
import { AgedReceivablesService } from './reports/aged-receivables.service';
import { AgedPayablesService } from './reports/aged-payables.service';
import { ProfitLossService } from './reports/profit-loss.service';
import { CashFlowStatementService } from './reports/cash-flow-statement.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly balanceSheetService: BalanceSheetService,
    private readonly agedReceivablesService: AgedReceivablesService,
    private readonly agedPayablesService: AgedPayablesService,
    private readonly profitLossService: ProfitLossService,
    private readonly cashFlowStatementService: CashFlowStatementService,
  ) {}

  @Get('sales')
  async getSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getSalesReport(startDate, endDate, page, limit);
  }

  @Get('purchases')
  async getPurchasesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getPurchasesReport(
      startDate,
      endDate,
      page,
      limit,
    );
  }

  @Get('stock')
  async getStockReport() {
    return this.reportsService.getStockReport();
  }

  @Get('profit-loss')
  getProfitLossReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getProfitLossReport(startDate, endDate);
  }

  @Get('inventory-value')
  async getInventoryValueByCategory() {
    return this.reportsService.getInventoryValueByCategory();
  }

  @Get('sales-by-category')
  async getSalesByCategory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesByCategory(startDate, endDate);
  }

  @Get('trends')
  async getTrends() {
    return this.reportsService.getDashboardTrends();
  }

  @Get('shipment-profitability')
  async getShipmentProfitability(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getShipmentProfitability(startDate, endDate);
  }

  @Get('cash-flow-projection')
  async getCashFlowProjection(
    @Query('days') days?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCashFlowProjection(days, startDate, endDate);
  }

  @Get('balance-sheet')
  async getBalanceSheet(@Query('asOfDate') asOfDate?: string) {
    return this.balanceSheetService.generate(asOfDate);
  }

  @Get('aged-receivables')
  async getAgedReceivables() {
    return this.agedReceivablesService.generate();
  }

  @Get('aged-payables')
  async getAgedPayables() {
    return this.agedPayablesService.generate();
  }

  @Get('profit-loss-journal')
  async getProfitLossJournal(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.profitLossService.generate(startDate, endDate);
  }

  @Get('cash-flow-statement')
  async getCashFlowStatement(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cashFlowStatementService.generate(startDate, endDate);
  }
}

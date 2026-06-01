import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  async getSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesReport(startDate, endDate);
  }

  @Get('purchases')
  async getPurchasesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getPurchasesReport(startDate, endDate);
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
}

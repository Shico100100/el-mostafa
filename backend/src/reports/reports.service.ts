import { Injectable } from '@nestjs/common';
import { FinancialReportService } from './reports/financial-report.service';
import { AnalyticsService } from './reports/analytics.service';

@Injectable()
export class ReportsService {
  constructor(
    private financialReportService: FinancialReportService,
    private analyticsService: AnalyticsService,
  ) {}

  async getSalesReport(startDate: string, endDate: string) {
    return this.financialReportService.getSalesReport(startDate, endDate);
  }
  async getPurchasesReport(startDate: string, endDate: string) {
    return this.financialReportService.getPurchasesReport(startDate, endDate);
  }
  async getProfitLossReport(startDate: string, endDate: string) {
    return this.financialReportService.getProfitLossReport(startDate, endDate);
  }
  async getDashboardTrends() {
    return this.financialReportService.getDashboardTrends();
  }

  async getStockReport() {
    return this.analyticsService.getStockReport();
  }
  async getInventoryValueByCategory() {
    return this.analyticsService.getInventoryValueByCategory();
  }
  async getSalesByCategory(startDate: string, endDate: string) {
    return this.analyticsService.getSalesByCategory(startDate, endDate);
  }
  async getCashFlowProjection(
    days?: number,
    startDate?: string,
    endDate?: string,
  ) {
    return this.analyticsService.getCashFlowProjection(
      days,
      startDate,
      endDate,
    );
  }
  async getShipmentProfitability(startDate?: string, endDate?: string) {
    return this.analyticsService.getShipmentProfitability(startDate, endDate);
  }
}

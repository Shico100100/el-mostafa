import { Injectable } from '@nestjs/common';
import { FinancialReportService } from './reports/financial-report.service';
import { AnalyticsService } from './reports/analytics.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ReportsService {
  constructor(
    private financialReportService: FinancialReportService,
    private analyticsService: AnalyticsService,
    private cache: CacheService,
  ) {}

  async getSalesReport(startDate: string, endDate: string) {
    return this.financialReportService.getSalesReport(startDate, endDate);
  }
  async getPurchasesReport(startDate: string, endDate: string) {
    return this.financialReportService.getPurchasesReport(startDate, endDate);
  }
  async getProfitLossReport(startDate: string, endDate: string) {
    const key = `reports:profit-loss:${startDate || 'default'}:${endDate || 'default'}`;
    const cached = await this.cache.get<any>(key);
    if (cached) return cached;
    const result = await this.financialReportService.getProfitLossReport(
      startDate,
      endDate,
    );
    await this.cache.set(key, result, 60);
    return result;
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
    const key = `reports:cash-flow:${days || 'default'}:${startDate || 'default'}:${endDate || 'default'}`;
    const cached = await this.cache.get<any>(key);
    if (cached) return cached;
    const result = await this.analyticsService.getCashFlowProjection(
      days,
      startDate,
      endDate,
    );
    await this.cache.set(key, result, 60);
    return result;
  }
  async getShipmentProfitability(startDate?: string, endDate?: string) {
    return this.analyticsService.getShipmentProfitability(startDate, endDate);
  }
}

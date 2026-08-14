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

  async getSalesReport(
    startDate: string,
    endDate: string,
    page?: number,
    limit?: number,
  ) {
    const key = `reports:sales:${startDate || 'default'}:${endDate || 'default'}:${page || 1}:${limit || 20}`;
    const cached = await this.cache.get<any>(key);
    if (cached) return cached;
    const result = await this.financialReportService.getSalesReport(
      startDate,
      endDate,
      page,
      limit,
    );
    await this.cache.set(key, result, 120);
    return result;
  }
  async getPurchasesReport(
    startDate: string,
    endDate: string,
    page?: number,
    limit?: number,
  ) {
    const key = `reports:purchases:${startDate || 'default'}:${endDate || 'default'}:${page || 1}:${limit || 20}`;
    const cached = await this.cache.get<any>(key);
    if (cached) return cached;
    const result = await this.financialReportService.getPurchasesReport(
      startDate,
      endDate,
      page,
      limit,
    );
    await this.cache.set(key, result, 120);
    return result;
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
    const key = `reports:sales-category:${startDate || 'default'}:${endDate || 'default'}`;
    const cached = await this.cache.get<any>(key);
    if (cached) return cached;
    const result = await this.analyticsService.getSalesByCategory(
      startDate,
      endDate,
    );
    await this.cache.set(key, result, 120);
    return result;
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

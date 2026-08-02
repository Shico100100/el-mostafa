import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { FinancialReportService } from './reports/financial-report.service';
import { AnalyticsService } from './reports/analytics.service';
import { CacheService } from '../cache/cache.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let financialReportService: jest.Mocked<FinancialReportService>;
  let analyticsService: jest.Mocked<AnalyticsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: FinancialReportService,
          useValue: {
            getSalesReport: jest.fn(),
            getPurchasesReport: jest.fn(),
            getProfitLossReport: jest.fn(),
            getDashboardTrends: jest.fn(),
            getCashFlowProjection: jest.fn(),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            getStockReport: jest.fn(),
            getInventoryValueByCategory: jest.fn(),
            getSalesByCategory: jest.fn(),
            getCashFlowProjection: jest.fn(),
            getShipmentProfitability: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: { get: jest.fn().mockResolvedValue(null), set: jest.fn() },
        },
        ReportsService,
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    financialReportService = module.get(FinancialReportService);
    analyticsService = module.get(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCashFlowProjection', () => {
    it('should delegate to analyticsService.getCashFlowProjection', async () => {
      const mockResult = {
        startingCash: 10000,
        expectedInflows: 8000,
        expectedOutflows: 4000,
        netCashFlow: 4000,
        projectedBalance: 14000,
        dailyProjection: [],
      };
      analyticsService.getCashFlowProjection.mockResolvedValue(mockResult as any);

      const result = await service.getCashFlowProjection();

      expect(result).toEqual(mockResult);
      expect(analyticsService.getCashFlowProjection).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass days parameter to analyticsService', async () => {
      analyticsService.getCashFlowProjection.mockResolvedValue({
        dailyProjection: [],
      } as any);

      await service.getCashFlowProjection(7);

      expect(analyticsService.getCashFlowProjection).toHaveBeenCalledWith(
        7,
        undefined,
        undefined,
      );
    });

    it('should pass all parameters to analyticsService', async () => {
      analyticsService.getCashFlowProjection.mockResolvedValue({
        dailyProjection: [],
      } as any);

      await service.getCashFlowProjection(30, '2024-01-01', '2024-02-01');

      expect(analyticsService.getCashFlowProjection).toHaveBeenCalledWith(
        30,
        '2024-01-01',
        '2024-02-01',
      );
    });
  });

  describe('getSalesReport', () => {
    it('should delegate to financialReportService.getSalesReport', async () => {
      financialReportService.getSalesReport.mockResolvedValue({ total: 5000 } as any);

      const result = await service.getSalesReport('2024-01-01', '2024-02-01');

      expect(result).toEqual({ total: 5000 });
      expect(financialReportService.getSalesReport).toHaveBeenCalledWith(
        '2024-01-01',
        '2024-02-01',
      );
    });
  });

  describe('getStockReport', () => {
    it('should delegate to analyticsService.getStockReport', async () => {
      analyticsService.getStockReport.mockResolvedValue({ items: [] } as any);

      const result = await service.getStockReport();

      expect(result).toEqual({ items: [] });
      expect(analyticsService.getStockReport).toHaveBeenCalled();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesService } from './purchases.service';
import { PurchaseReportsService } from './purchase-reports/purchase-reports.service';
import { PurchaseOrderService } from './purchase-orders/purchase-order.service';
import { PurchaseReturnService } from './purchase-returns/purchase-return.service';
import { PaymentService } from './supplier-payments/payment.service';
import { LandedCostService } from './landed-cost/landed-cost.service';
import { PackingListService } from './packing-lists/packing-list.service';

describe('PurchasesService', () => {
  let service: PurchasesService;
  let reportsService: jest.Mocked<PurchaseReportsService>;

  beforeEach(async () => {
    const mockReports = {
      getSupplierAging: jest.fn(),
      getSupplierBalance: jest.fn(),
      getStatementOfAccount: jest.fn(),
      getLatestPurchasePrice: jest.fn(),
      getLatestPurchasePrices: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PurchaseReportsService,
          useValue: mockReports,
        },
        {
          provide: PurchaseOrderService,
          useValue: {},
        },
        {
          provide: PurchaseReturnService,
          useValue: {},
        },
        {
          provide: PaymentService,
          useValue: {},
        },
        {
          provide: LandedCostService,
          useValue: {},
        },
        {
          provide: PackingListService,
          useValue: {},
        },
        PurchasesService,
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
    reportsService = module.get(PurchaseReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSupplierAging', () => {
    it('should delegate to PurchaseReportsService', async () => {
      const expected = [
        {
          id: 1,
          name: 'Supplier A',
          total: 2000,
          current: 0,
          days1_30: 2000,
          days31_60: 0,
          days61_90: 0,
          over90: 0,
        },
      ];
      reportsService.getSupplierAging.mockResolvedValue(expected as any);

      const result = await service.getSupplierAging();

      expect(result).toEqual(expected);
      expect(reportsService.getSupplierAging).toHaveBeenCalled();
    });
  });
});

import { AccountType } from '../src/accounting/entities/account.entity';
import { PeachtreeMappingService } from '../src/peachtree-sync/peachtree-mapping.service';
import { PeachtreeReviewService } from '../src/peachtree-sync/peachtree-review.service';

// ─────────────────────────────────────────────────────────
// 1. PeachtreeMappingService (pure logic, no deps)
// ─────────────────────────────────────────────────────────
describe('PeachtreeMappingService', () => {
  let service: PeachtreeMappingService;

  beforeEach(() => {
    service = new PeachtreeMappingService();
  });

  describe('mapCustomer', () => {
    it('should map a full customer row', () => {
      const row = {
        Customer_Bill_Name: 'Acme Corp',
        CustomerID: 'CUST001',
        Phone_Number: '0123456789',
        PhoneNumber2: '0987654321',
        eMail_Address: 'acme@test.com',
        Balance: '1500.50',
      };
      const result = service.mapCustomer(row);
      expect(result).toEqual({
        name: 'Acme Corp',
        phone: '0123456789',
        email: 'acme@test.com',
        address: '',
        balance: 1500.5,
      });
    });

    it('should fall back to CustomerID when name is missing', () => {
      expect(service.mapCustomer({ CustomerID: 'C001' }).name).toBe('C001');
    });

    it('should handle empty row', () => {
      const result = service.mapCustomer({});
      expect(result.name).toBe('');
      expect(result.phone).toBe('');
      expect(result.email).toBe('');
      expect(result.balance).toBe(0);
    });

    it('should default balance to 0 for non-numeric strings', () => {
      expect(service.mapCustomer({ Balance: 'abc' }).balance).toBe(0);
    });
  });

  describe('mapSupplier', () => {
    it('should map a full supplier row', () => {
      const result = service.mapSupplier({
        Name: 'Supplier One',
        VendorID: 'V001',
        PhoneNumber: '111',
        PhoneNumber2: '222',
        Email: 's@test.com',
        Balance: '500',
      });
      expect(result.name).toBe('Supplier One');
      expect(result.phone).toBe('111');
      expect(result.email).toBe('s@test.com');
      expect(result.balance).toBe(500);
    });

    it('should fall back to VendorID', () => {
      expect(service.mapSupplier({ VendorID: 'V2' }).name).toBe('V2');
    });

    it('should handle empty row', () => {
      expect(service.mapSupplier({}).name).toBe('');
      expect(service.mapSupplier({}).balance).toBe(0);
    });
  });

  describe('mapProduct', () => {
    it('should map a full product row', () => {
      const result = service.mapProduct({
        ItemDescription: 'Widget',
        ItemID: 'I001',
        UPC_SKU: 'SKU-123',
        LaborCost: '10.50',
        PriceLevel1Amount: '25.00',
        SalesAmt1: '20.00',
        StockingUM: 'kg',
        SalesDescription: 'A widget',
      });
      expect(result.name).toBe('Widget');
      expect(result.sku).toBe('SKU-123');
      expect(result.barcode).toBe('SKU-123');
      expect(result.cost_price).toBe(10.5);
      expect(result.selling_price).toBe(25);
      expect(result.unit).toBe('kg');
      expect(result.description).toBe('A widget');
      expect(result.type).toBe('RAW');
    });

    it('should default unit to piece', () => {
      expect(service.mapProduct({ ItemDescription: 'X' }).unit).toBe('piece');
    });

    it('should use ItemID as fallback', () => {
      const result = service.mapProduct({ ItemID: 'ITEM-99' });
      expect(result.name).toBe('ITEM-99');
      expect(result.sku).toBe('ITEM-99');
    });
  });

  describe('mapGLAccount', () => {
    it('should map ASSET type (0-6)', () => {
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 0,
        }).type,
      ).toBe(AccountType.ASSET);
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 6,
        }).type,
      ).toBe(AccountType.ASSET);
    });

    it('should map LIABILITY type (10-14)', () => {
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 10,
        }).type,
      ).toBe(AccountType.LIABILITY);
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 14,
        }).type,
      ).toBe(AccountType.LIABILITY);
    });

    it('should map EQUITY type (16-19)', () => {
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 16,
        }).type,
      ).toBe(AccountType.EQUITY);
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 19,
        }).type,
      ).toBe(AccountType.EQUITY);
    });

    it('should map REVENUE type (21)', () => {
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 21,
        }).type,
      ).toBe(AccountType.REVENUE);
    });

    it('should map EXPENSE type (23-24)', () => {
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 23,
        }).type,
      ).toBe(AccountType.EXPENSE);
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 24,
        }).type,
      ).toBe(AccountType.EXPENSE);
    });

    it('should default unknown types to EXPENSE', () => {
      expect(
        service.mapGLAccount({
          GLAcntNumber: '1',
          AccountDescription: 'A',
          AccountType: 99,
        }).type,
      ).toBe(AccountType.EXPENSE);
    });

    it('should parse Balance0Net', () => {
      const result = service.mapGLAccount({
        GLAcntNumber: '1',
        AccountDescription: 'A',
        AccountType: 0,
        Balance0Net: '1234.56',
      });
      expect(result.balance).toBe(1234.56);
    });
  });

  describe('mapJournalEntry', () => {
    it('should map positive amount as debit', () => {
      const result = service.mapJournalEntry({
        RowDate: '/Date(1700000000000)/',
        RowDescription: 'Test',
        DistNumber: 'D001',
        GLAcntNumber: '100',
        Amount: '500.00',
      });
      expect(result.debit).toBe(500);
      expect(result.credit).toBe(0);
      expect(result.reference).toBe('D001');
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should map negative amount as credit (absolute value)', () => {
      const result = service.mapJournalEntry({ Amount: '-300.00' });
      expect(result.debit).toBe(0);
      expect(result.credit).toBe(300);
    });

    it('should map zero amount', () => {
      const result = service.mapJournalEntry({ Amount: '0' });
      expect(result.debit).toBe(0);
      expect(result.credit).toBe(0);
    });

    it('should handle missing date', () => {
      expect(service.mapJournalEntry({ Amount: '100' }).date).toBeInstanceOf(
        Date,
      );
    });
  });

  describe('mapBudget / mapBudgetLine', () => {
    it('should map budget row', () => {
      const result = service.mapBudget({
        BudgetID: 'Q1-2026',
        BudgetDescription: 'First quarter',
      });
      expect(result.name).toBe('Q1-2026');
      expect(result.period).toBe('Q1-2026');
      expect(result.status).toBe('ACTIVE');
    });

    it('should default budget name to Unknown', () => {
      expect(service.mapBudget({}).name).toBe('Unknown');
    });

    it('should map budget line', () => {
      const result = service.mapBudgetLine({ BudgetDescription: 'Line desc' });
      expect(result.notes).toBe('Line desc');
      expect(result.account_code).toBe('');
      expect(result.budgeted_amount).toBe(0);
    });
  });

  describe('mapEmployee', () => {
    it('should map a full employee row', () => {
      const result = service.mapEmployee({
        Employee_FirstName: 'Ahmed',
        Employee_LastName: 'Ali',
        Email: 'ahmed@test.com',
        PhoneNumber: '123',
      });
      expect(result.firstName).toBe('Ahmed');
      expect(result.lastName).toBe('Ali');
      expect(result.email).toBe('ahmed@test.com');
      expect(result.phone).toBe('123');
    });

    it('should generate email when missing', () => {
      expect(
        service.mapEmployee({ Employee_FirstName: 'John Smith' }).email,
      ).toBe('john.smith@peachtree.local');
    });

    it('should use EmployeeName fallback', () => {
      expect(service.mapEmployee({ EmployeeName: 'Bob' }).firstName).toBe(
        'Bob',
      );
    });
  });

  describe('mapBOMItem', () => {
    it('should map BOM fields', () => {
      const result = service.mapBOMItem({
        AssemblyRecordNo: '100',
        ComponentRecordNo: '200',
        QtyRequired: '5.5',
      });
      expect(result.parent_item).toBe('100');
      expect(result.component_item).toBe('200');
      expect(result.quantity).toBe(5.5);
    });
  });

  describe('mapBankAccount', () => {
    it('should map bank account', () => {
      const result = service.mapBankAccount({
        BankAccount: '12345',
        EndingBalance1: '9999.99',
      });
      expect(result.name).toBe('12345');
      expect(result.account_number).toBe('12345');
      expect(result.balance).toBe(9999.99);
    });
  });

  describe('mapJob / mapJobPhase', () => {
    it('should map active job', () => {
      const result = service.mapJob({
        JobDescription: 'Project A',
        JobID: 'J001',
        JobIsInactive: 0,
      });
      expect(result.code).toBe('J001');
      expect(result.status).toBe('ACTIVE');
    });

    it('should map inactive job', () => {
      expect(service.mapJob({ JobIsInactive: 1 }).status).toBe('INACTIVE');
    });

    it('should map job phase', () => {
      const result = service.mapJobPhase({
        PhaseDescription: 'Phase 1',
        PhaseID: 'P001',
        PhaseIsInactive: 0,
      });
      expect(result.code).toBe('P001');
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('mapTaxConfig', () => {
    it('should map tax config', () => {
      const result = service.mapTaxConfig({
        GrossMoreThan0: '10000',
        GrossMoreThan1: '20000',
        Withhold0: '0.10',
        State: 'EG',
      });
      expect(result.bracket_min).toBe(10000);
      expect(result.bracket_max).toBe(20000);
      expect(result.rate).toBe(0.1);
      expect(result.country).toBe('EG');
      expect(result.year).toBe(new Date().getFullYear());
    });
  });

  describe('mapSalesInvoice / mapPurchaseInvoice', () => {
    it('should map posted sales invoice', () => {
      const result = service.mapSalesInvoice({
        MainAmount: '5000',
        TrxIsPosted: 1,
        TransactionDate: '/Date(1700000000000)/',
        Description: 'Sale #1',
        Reference: 'INV-001',
        PaymentMethod: 'Cash',
        AmountPaid: '5000',
        CustVendId: '42',
        CustomerInvoiceNo: 'CI-001',
      });
      expect(result.total_amount).toBe(5000);
      expect(result.status).toBe('COMPLETED');
      expect(result.invoice_number).toBe('INV-001');
      expect(result.customer_vend_id).toBe(42);
      expect(result.amount_paid).toBe(5000);
    });

    it('should map unposted purchase invoice', () => {
      const result = service.mapPurchaseInvoice({
        MainAmount: '1000',
        TrxIsPosted: 0,
        Description: 'Purchase',
        Reference: 'PO-001',
        CustVendId: '7',
      });
      expect(result.status).toBe('PENDING');
      expect(result.invoice_number).toBe('PO-001');
    });
  });

  describe('mapSalesInvoiceItem / mapPurchaseInvoiceItem', () => {
    it('should map invoice line items', () => {
      const salesItem = service.mapSalesInvoiceItem({
        Quantity: '10',
        UnitCost: '5.5',
        Amount: '55',
        ItemRecordNumber: '1001',
        GLAcntNumber: '3',
        RowDescription: 'Widget',
      });
      expect(salesItem.quantity).toBe(10);
      expect(salesItem.price).toBe(5.5);
      expect(salesItem.total).toBe(55);
      expect(salesItem.item_record_number).toBe(1001);
    });

    it('should handle negative values (returns)', () => {
      const result = service.mapSalesInvoiceItem({
        Quantity: '-3',
        UnitCost: '-10',
        Amount: '-30',
      });
      expect(result.quantity).toBe(3);
      expect(result.price).toBe(10);
      expect(result.total).toBe(30);
    });
  });

  describe('parsePeachtreeDate (private)', () => {
    it('should parse .NET /Date(ms)/ format', () => {
      const result = (service as any).parsePeachtreeDate(
        '/Date(1700000000000)/',
      );
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(1700000000000);
    });

    it('should parse ISO date strings', () => {
      expect((service as any).parsePeachtreeDate('2024-01-15')).toBeInstanceOf(
        Date,
      );
    });

    it('should return null for null/undefined/empty', () => {
      expect((service as any).parsePeachtreeDate(null)).toBeNull();
      expect((service as any).parsePeachtreeDate(undefined)).toBeNull();
      expect((service as any).parsePeachtreeDate('')).toBeNull();
    });

    it('should return null for invalid strings', () => {
      expect((service as any).parsePeachtreeDate('not-a-date')).toBeNull();
    });
  });
});

// ─────────────────────────────────────────────────────────
// 2. PeachtreeConnectionService
// ─────────────────────────────────────────────────────────
import { ConfigService } from '@nestjs/config';
import { PeachtreeConnectionService } from '../src/peachtree-sync/peachtree-connection.service';

// Mock child_process so execFileAsync works
const mockExec = jest.fn();
jest.mock('child_process', () => ({
  execFile: (...args: any[]) => {
    const cb = args[args.length - 1];
    if (typeof cb === 'function') {
      const p = mockExec(...args.slice(0, args.length - 1));
      Promise.resolve(p).then(
        (r: any) =>
          cb(null, { stdout: r?.stdout ?? '', stderr: r?.stderr ?? '' }),
        (e: any) => cb(e, '', e?.stderr ?? ''),
      );
    }
  },
}));

describe('PeachtreeConnectionService', () => {
  let service: PeachtreeConnectionService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = {
      get: jest.fn((key: string, fallback?: string) => {
        const map: Record<string, string> = {
          PEACHTREE_DATA_PATH: 'mos',
          PEACHTREE_SERVER: 'localhost',
        };
        return map[key] ?? fallback;
      }),
    } as any;
    service = new PeachtreeConnectionService(configService);
  });

  describe('constructor', () => {
    it('should use env values', () => {
      expect(service.getDataPath()).toBe('mos');
      expect(service.getServerName()).toBe('localhost');
    });

    it('should use fallback when env missing', () => {
      configService.get.mockImplementation(
        (_key: string, fallback?: string) => fallback,
      );
      const svc = new PeachtreeConnectionService(configService);
      expect(svc.getDataPath()).toBe('mos');
      expect(svc.getServerName()).toBe('localhost');
    });
  });

  describe('setDataPath / getDataPath', () => {
    it('should update with trimmed value', () => {
      service.setDataPath('  mydb  ');
      expect(service.getDataPath()).toBe('mydb');
    });

    it('should ignore empty string', () => {
      service.setDataPath('');
      expect(service.getDataPath()).toBe('mos');
    });

    it('should ignore whitespace-only', () => {
      service.setDataPath('   ');
      expect(service.getDataPath()).toBe('mos');
    });

    it('should fallback to default when dataPath is empty', () => {
      (service as any).dataPath = '';
      expect(service.getDataPath()).toBe('mos');
    });
  });

  describe('isFilePath (private)', () => {
    it('should detect Windows paths', () => {
      expect((service as any).isFilePath('D:\\OneDrive\\Mostafaapp')).toBe(
        true,
      );
      expect((service as any).isFilePath('C:\\data')).toBe(true);
      expect((service as any).isFilePath('c:\\temp')).toBe(true);
    });

    it('should detect Unix paths', () => {
      expect((service as any).isFilePath('/home/user/data')).toBe(true);
    });

    it('should reject database names', () => {
      expect((service as any).isFilePath('mos')).toBe(false);
      expect((service as any).isFilePath('PeachData')).toBe(false);
      expect((service as any).isFilePath('')).toBe(false);
    });
  });

  describe('cache', () => {
    it('should clear cache on disable', () => {
      service.enableCache();
      (service as any).queryCache.set('key', [{ id: 1 }]);
      service.disableCache();
      expect((service as any).queryCache.size).toBe(0);
    });
  });

  describe('getCacheKey (private)', () => {
    it('should generate correct keys', () => {
      expect((service as any).getCacheKey('Chart', 1)).toBe('Chart|1||');
      expect((service as any).getCacheKey('Chart', 0, '*', 'id=1')).toBe(
        'Chart|0|*|id=1',
      );
    });
  });

  describe('getTableNames', () => {
    it('should return 14 tables', async () => {
      const tables = await service.getTableNames();
      expect(tables).toHaveLength(14);
      expect(tables).toContain('Chart');
      expect(tables).toContain('Customers');
      expect(tables).toContain('Vendors');
      expect(tables).toContain('LineItem');
      expect(tables).toContain('JrnlHdr');
      expect(tables).toContain('JrnlRow');
    });
  });

  describe('query', () => {
    it('should return parsed JSON array', async () => {
      mockExec.mockResolvedValueOnce({
        stdout: JSON.stringify([{ id: 1, name: 'Cash' }]),
        stderr: '',
      });
      const result = await service.query('Chart', 1);
      expect(result).toEqual([{ id: 1, name: 'Cash' }]);
    });

    it('should wrap single object in array', async () => {
      mockExec.mockResolvedValueOnce({
        stdout: JSON.stringify({ id: 1 }),
        stderr: '',
      });
      const result = await service.query('Chart', 1);
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should return empty array for empty stdout', async () => {
      mockExec.mockResolvedValueOnce({ stdout: '', stderr: '' });
      const result = await service.query('Chart', 1);
      expect(result).toEqual([]);
    });

    it('should throw on invalid JSON', async () => {
      mockExec.mockResolvedValueOnce({ stdout: 'not json', stderr: '' });
      await expect(service.query('Chart')).rejects.toThrow(
        'Peachtree query failed for table Chart',
      );
    });

    it('should include limit, fields, where args', async () => {
      mockExec.mockResolvedValueOnce({ stdout: '[]', stderr: '' });
      await service.query('Chart', 10, 'id,name', 'id > 5');
      const calledArgs = mockExec.mock.calls[0][1];
      expect(calledArgs).toContain('-Limit');
      expect(calledArgs).toContain('10');
      expect(calledArgs).toContain('-Fields');
      expect(calledArgs).toContain('id,name');
      expect(calledArgs).toContain('-Where');
      expect(calledArgs).toContain('id > 5');
    });

    it('should not include optional args when absent', async () => {
      mockExec.mockResolvedValueOnce({ stdout: '[]', stderr: '' });
      await service.query('Chart');
      const calledArgs = mockExec.mock.calls[0][1];
      expect(calledArgs).not.toContain('-Limit');
      expect(calledArgs).not.toContain('-Fields');
      expect(calledArgs).not.toContain('-Where');
    });

    it('should cache results when enabled', async () => {
      mockExec.mockResolvedValueOnce({ stdout: '[{"id":1}]', stderr: '' });
      service.enableCache();
      await service.query('Chart', 1);
      await service.query('Chart', 1);
      expect(mockExec).toHaveBeenCalledTimes(1);
    });

    it('should not cache when disabled', async () => {
      mockExec.mockResolvedValue({ stdout: '[]', stderr: '' });
      await service.query('Chart');
      await service.query('Chart');
      expect(mockExec).toHaveBeenCalledTimes(2);
    });

    it('should use 32-bit PowerShell', async () => {
      mockExec.mockResolvedValueOnce({ stdout: '[]', stderr: '' });
      await service.query('Chart');
      expect(mockExec.mock.calls[0][0]).toContain('SysWOW64');
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      jest
        .spyOn(service as any, 'ensurePervasiveRunning')
        .mockResolvedValue(undefined);
    });

    it('should return connected: true on success', async () => {
      mockExec.mockResolvedValueOnce({
        stdout: '[{"GLAcntNumber":1}]',
        stderr: '',
      });

      const result = await service.testConnection();
      expect(result.connected).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return connected: false with error', async () => {
      mockExec.mockRejectedValueOnce(new Error('Btrieve Error 2301'));

      const result = await service.testConnection();
      expect(result.connected).toBe(false);
      expect(result.error).toContain('Btrieve Error 2301');
    });

    it('should auto-correct file path to resolved DB name', async () => {
      service.setDataPath('D:\\OneDrive\\Mostafaapp');
      mockExec.mockResolvedValueOnce({ stdout: 'mos\n', stderr: '' }); // resolveDatabaseName
      mockExec.mockResolvedValueOnce({ stdout: '[{"id":1}]', stderr: '' }); // query

      const result = await service.testConnection();
      expect(result.connected).toBe(true);
      expect(service.getDataPath()).toBe('mos');
    });

    it('should not change dataPath for DB name input', async () => {
      mockExec.mockResolvedValueOnce({ stdout: '[{"id":1}]', stderr: '' }); // query

      const result = await service.testConnection();
      expect(result.connected).toBe(true);
      expect(service.getDataPath()).toBe('mos');
    });
  });

  describe('ensurePervasiveRunning (private)', () => {
    it('should detect running service', async () => {
      mockExec.mockResolvedValueOnce({
        stdout: 'SERVICE_NAME: psqlWGE\nSTATE: 4 RUNNING',
        stderr: '',
      });
      await (service as any).ensurePervasiveRunning();
      expect(mockExec.mock.calls[0]).toEqual([
        'sc',
        ['query', 'psqlWGE'],
        expect.objectContaining({ timeout: 10000 }),
      ]);
    });

    it('should try to start stopped service', async () => {
      mockExec
        .mockResolvedValueOnce({ stdout: 'STATE: 1 STOPPED', stderr: '' }) // sc query
        .mockResolvedValueOnce({ stdout: '', stderr: '' }); // net start

      await (service as any).ensurePervasiveRunning();
      expect(mockExec).toHaveBeenCalledWith(
        'net',
        ['start', 'psqlWGE'],
        expect.objectContaining({ timeout: 10000 }),
      );
    });

    it('should warn when no service found', async () => {
      mockExec.mockRejectedValue(new Error('not found'));
      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      await (service as any).ensurePervasiveRunning();
      expect(warnSpy).toHaveBeenCalledWith(
        'No known Pervasive PSQL service found — it may not be installed',
      );
    });
  });
});

// ─────────────────────────────────────────────────────────
// 3. PeachtreeSyncController
// ─────────────────────────────────────────────────────────
import { PeachtreeSyncController } from '../src/peachtree-sync/peachtree-sync.controller';
import { PeachtreeSyncService } from '../src/peachtree-sync/peachtree-sync.service';
import {
  SyncEntity,
  SyncStatus,
} from '../src/peachtree-sync/dto/sync-status.dto';

describe('PeachtreeSyncController', () => {
  let controller: PeachtreeSyncController;
  let syncService: jest.Mocked<PeachtreeSyncService>;

  beforeEach(() => {
    syncService = {
      runSync: jest.fn(),
      getSyncHistory: jest.fn(),
      testConnection: jest.fn(),
      getAvailableTables: jest.fn(),
      getDataPath: jest.fn().mockReturnValue('mos'),
      setDataPath: jest.fn(),
      getCurrentSync: jest.fn(),
      resyncItems: jest.fn(),
      preview: jest.fn().mockResolvedValue({ id: 'p1' }),
      getReview: jest.fn().mockResolvedValue([]),
      applyReview: jest.fn().mockResolvedValue({ applied: 1, errors: [] }),
      skipReview: jest.fn().mockResolvedValue({ skipped: 2 }),
      getLog: jest.fn().mockResolvedValue([]),
    } as any;
    controller = new PeachtreeSyncController(syncService);
  });

  describe('GET /config', () => {
    it('should return current DSN', async () => {
      expect(await controller.getConfig()).toEqual({ dsn: 'mos' });
    });
  });

  describe('PUT /config', () => {
    it('should update DSN via dsn field', async () => {
      const result = await controller.updateConfig({ dsn: 'newdb' });
      expect(syncService.setDataPath).toHaveBeenCalledWith('newdb');
      expect(result.dsn).toBe('mos');
    });

    it('should accept dataPath as fallback', async () => {
      await controller.updateConfig({ dataPath: 'oldapi' });
      expect(syncService.setDataPath).toHaveBeenCalledWith('oldapi');
    });

    it('should do nothing if both empty', async () => {
      await controller.updateConfig({});
      expect(syncService.setDataPath).not.toHaveBeenCalled();
    });
  });

  describe('POST /test', () => {
    it('should return connection result', async () => {
      syncService.testConnection.mockResolvedValue({ connected: true });
      const result = await controller.testConnection();
      expect(result).toEqual({
        connected: true,
        error: undefined,
        dataPath: 'mos',
      });
    });

    it('should return error when fails', async () => {
      syncService.testConnection.mockResolvedValue({
        connected: false,
        error: 'ODB Error',
      });
      const result = await controller.testConnection();
      expect(result.connected).toBe(false);
      expect(result.error).toBe('ODB Error');
    });
  });

  describe('GET /tables', () => {
    it('should return tables', async () => {
      syncService.getAvailableTables.mockResolvedValue(['Chart', 'Customers']);
      expect(await controller.getTables()).toEqual(['Chart', 'Customers']);
    });
  });

  describe('POST /run', () => {
    it('should fire-and-forget sync when not running', async () => {
      syncService.getCurrentSync.mockReturnValue(null);
      syncService.runSync.mockResolvedValue({
        id: 'sync_1',
        status: 'completed',
        results: [],
      } as any);
      const result = await controller.runSync({});
      expect(result.status).toBe('running');
      expect(result.message).toBe('Sync started');
      expect(syncService.runSync).toHaveBeenCalled();
    });

    it('should reject if sync already running', async () => {
      syncService.getCurrentSync.mockReturnValue({
        id: 'sync1',
        status: 'running',
      } as any);
      const result = await controller.runSync({});
      expect(result.status).toBe('running');
      expect(result.message).toContain('already in progress');
      expect(syncService.runSync).not.toHaveBeenCalled();
    });
  });

  describe('GET /status', () => {
    it('should return sync history', async () => {
      syncService.getSyncHistory.mockResolvedValue([
        { id: 's1', status: SyncStatus.COMPLETED },
        { id: 's2', status: SyncStatus.FAILED },
      ] as any);
      expect((await controller.getSyncHistory()).length).toBe(2);
    });
  });

  describe('GET /last', () => {
    it('should return current sync if running', async () => {
      syncService.getCurrentSync.mockReturnValue({
        id: 'current',
        status: 'running',
      } as any);
      expect((await controller.getLastSync())?.id).toBe('current');
    });

    it('should return latest history if no current', async () => {
      syncService.getCurrentSync.mockReturnValue(null);
      syncService.getSyncHistory.mockResolvedValue([{ id: 'h1' }] as any);
      expect((await controller.getLastSync())?.id).toBe('h1');
    });

    it('should return null when no history', async () => {
      syncService.getCurrentSync.mockReturnValue(null);
      syncService.getSyncHistory.mockResolvedValue([]);
      expect(await controller.getLastSync()).toBeNull();
    });
  });

  describe('GET /progress', () => {
    it('should return progress of current sync', async () => {
      syncService.getCurrentSync.mockReturnValue({
        id: 's1',
        status: 'running',
        percentComplete: 45,
        currentEntity: 'customers',
      } as any);
      const result = await controller.getProgress();
      expect(result.running).toBe(true);
      expect(result.percentComplete).toBe(45);
      expect(result.currentEntity).toBe('customers');
    });

    it('should return idle when no sync', async () => {
      syncService.getCurrentSync.mockReturnValue(null);
      syncService.getSyncHistory.mockResolvedValue([]);
      const result = await controller.getProgress();
      expect(result.running).toBe(false);
      expect(result.percentComplete).toBe(0);
      expect(result.status).toBe('idle');
    });

    it('should return 100% when history exists', async () => {
      syncService.getCurrentSync.mockReturnValue(null);
      syncService.getSyncHistory.mockResolvedValue([
        { id: 'h1', status: 'completed' },
      ] as any);
      const result = await controller.getProgress();
      expect(result.percentComplete).toBe(100);
    });
  });

  describe('POST /resync-items', () => {
    it('should fire-and-forget resyncItems when not running', async () => {
      syncService.getCurrentSync.mockReturnValue(null);
      syncService.resyncItems.mockResolvedValue({
        salesCreated: 5,
        purchaseCreated: 3,
        message: 'Done',
      });
      const result = await controller.resyncItems();
      expect(result.status).toBe('running');
      expect(result.message).toBe('Resync started');
      expect(syncService.resyncItems).toHaveBeenCalled();
    });

    it('should reject if sync already running', async () => {
      syncService.getCurrentSync.mockReturnValue({
        id: 'sync1',
        status: 'running',
      } as any);
      const result = await controller.resyncItems();
      expect(result.status).toBe('running');
      expect(result.message).toContain('already in progress');
      expect(syncService.resyncItems).not.toHaveBeenCalled();
    });
  });

  describe('POST /preview', () => {
    it('starts a preview when not running', async () => {
      syncService.getCurrentSync.mockReturnValue(null);
      const result = await controller.preview();
      expect(result.status).toBe('running');
      expect(syncService.preview).toHaveBeenCalledWith('manual-preview');
    });

    it('rejects if sync already running', async () => {
      syncService.getCurrentSync.mockReturnValue({
        id: 'x',
        status: 'running',
      } as any);
      const result = await controller.preview();
      expect(syncService.preview).not.toHaveBeenCalled();
      expect(result.message).toContain('already in progress');
    });
  });

  describe('GET /review', () => {
    it('returns pending review rows', async () => {
      syncService.getReview.mockResolvedValue([{ id: 1 }] as any);
      expect(await controller.getReview({})).toEqual([{ id: 1 }]);
      expect(syncService.getReview).toHaveBeenCalledWith(undefined);
    });

    it('filters by entity', async () => {
      await controller.getReview({ entity: 'customers' });
      expect(syncService.getReview).toHaveBeenCalledWith('customers');
    });
  });

  describe('POST /review/apply', () => {
    it('applies selected ids', async () => {
      const result = await controller.applyReview({ ids: [1, 2] });
      expect(result).toEqual({ applied: 1, errors: [] });
      expect(syncService.applyReview).toHaveBeenCalledWith([1, 2]);
    });
  });

  describe('POST /review/skip', () => {
    it('skips selected ids', async () => {
      expect(await controller.skipReview({ ids: [1] })).toEqual({ skipped: 2 });
    });
  });

  describe('GET /log', () => {
    it('returns audit log', async () => {
      syncService.getLog.mockResolvedValue([{ id: 1 }] as any);
      expect(await controller.getLog({})).toEqual([{ id: 1 }]);
    });
  });
});

// ─────────────────────────────────────────────────────────
// 3. PeachtreeSyncService pipeline — new invoice → header + line items
//    (mocked connection + repos; no writes to live Peachtree data)
// ─────────────────────────────────────────────────────────
describe('PeachtreeSyncService pipeline (new invoice)', () => {
  function mockQueryBuilder(insertedValues: any[]) {
    const qb: any = {
      insert: jest.fn(),
      into: jest.fn(),
      values: jest.fn(),
      orIgnore: jest.fn(),
      execute: jest.fn().mockResolvedValue({}),
      select: jest.fn(),
      getRawOne: jest.fn().mockResolvedValue({ cnt: '1' }),
    };
    qb.insert.mockReturnValue(qb);
    qb.into.mockReturnValue(qb);
    qb.values.mockImplementation((v: any) => {
      insertedValues.push(...(Array.isArray(v) ? v : [v]));
      return qb;
    });
    qb.orIgnore.mockReturnValue(qb);
    qb.select.mockReturnValue(qb);
    return qb;
  }

  function buildService() {
    const insertedSalesOrders: any[] = [];
    const insertedSalesItems: any[] = [];

    const connectionService: any = {
      query: jest.fn((table: string) => {
        const rows =
          table === 'JrnlHdr'
            ? [
                {
                  JrnlKey_TrxNumber: '90001',
                  JrnlKey_Per: '202607',
                  JrnlKey_Journal: '1',
                  TransactionDate: '/Date(1750000000000)/',
                  Description: 'Acme Corp',
                  MainAmount: '1250.50',
                  Reference: 'INV-90001',
                  TrxIsPosted: 1,
                  CustVendId: '5',
                  PaymentMethod: 'Cash',
                  AmountPaid: '1250.50',
                  TrxName: 'Sale',
                  PostOrder: '501',
                  Module: 'R',
                },
              ]
            : table === 'Customers'
              ? [
                  {
                    CustomerRecordNumber: '5',
                    Customer_Bill_Name: 'Acme Corp',
                    CustomerID: 'ACME',
                  },
                ]
              : table === 'LineItem'
                ? [
                    {
                      ItemRecordNumber: '77',
                      ItemDescription: 'Widget',
                      ItemID: 'WIDGET-1',
                      UPC_SKU: 'SKU-WIDGET',
                    },
                  ]
                : table === 'JrnlRow'
                  ? [
                      {
                        PostOrder: '501',
                        ItemRecordNumber: '77',
                        GLAcntNumber: '3',
                        Quantity: '10',
                        UnitCost: '120',
                        Amount: '1200',
                      },
                    ]
                  : [];
        return Promise.resolve(rows);
      }),
      enableCache: jest.fn(),
      disableCache: jest.fn(),
    };

    const customerRepo: any = {
      find: jest.fn().mockResolvedValue([{ id: 5, name: 'Acme Corp' }]),
    };
    const supplierRepo: any = { find: jest.fn().mockResolvedValue([]) };
    const productRepo: any = {
      find: jest.fn().mockResolvedValue([
        { id: 9, name: 'Widget', sku: 'SKU-WIDGET', type: 'FINISHED' },
        { id: 10, name: 'Semi Widget', sku: 'SKU-SEMI', type: 'SEMI' },
      ]),
    };
    const salesOrderRepo: any = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => mockQueryBuilder(insertedSalesOrders)),
    };
    const salesOrderItemRepo: any = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => mockQueryBuilder(insertedSalesItems)),
    };
    const purchaseOrderRepo: any = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => mockQueryBuilder([])),
    };
    const purchaseOrderItemRepo: any = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(() => mockQueryBuilder([])),
    };

    const reviewService: any = {
      clearPendingForEntity: jest.fn().mockResolvedValue(undefined),
      createReview: jest.fn().mockResolvedValue({ id: 1 }),
      log: jest.fn().mockResolvedValue({ id: 1 }),
      computeDiff: (oldObj: any, newObj: any) => {
        const changes: any[] = [];
        for (const k of new Set([
          ...Object.keys(oldObj),
          ...Object.keys(newObj),
        ])) {
          if (JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k])) {
            changes.push({ field: k, old: oldObj[k], new: newObj[k] });
          }
        }
        return changes;
      },
    };

    const service = new PeachtreeSyncService(
      connectionService,
      new PeachtreeMappingService(),
      customerRepo,
      supplierRepo,
      productRepo,
      salesOrderRepo,
      salesOrderItemRepo,
      purchaseOrderRepo,
      purchaseOrderItemRepo,
      reviewService,
    );

    return {
      service,
      insertedSalesOrders,
      insertedSalesItems,
      salesOrderRepo,
      salesOrderItemRepo,
      reviewService,
    };
  }

  it('should create a new sales order header for a brand-new Peachtree invoice', async () => {
    const { service, insertedSalesOrders } = buildService();
    const status = await service.runSyncPartial(
      [SyncEntity.SALES_INVOICES],
      'test',
    );

    const salesResult = status.results[0];
    expect(status.status).toBe(SyncStatus.COMPLETED);
    expect(salesResult.status).toBe(SyncStatus.COMPLETED);
    expect(salesResult.recordsCreated).toBe(1);
    expect(salesResult.recordsProcessed).toBe(1);

    const inserted = insertedSalesOrders[0];
    expect(inserted.customer_id).toBe(5);
    expect(inserted.total_amount).toBe(1250.5);
    expect(inserted.invoice_number).toBe('INV-90001');
    expect(inserted.status).toBe('COMPLETED');
    expect(inserted.notes).toContain('[PQ-90001_202607_1]');
  });

  it('should not duplicate an invoice that already exists in the system', async () => {
    const { service, insertedSalesOrders, salesOrderRepo } = buildService();
    // Simulate the invoice already imported: connection query returns a header whose
    // invoice_number already exists in the sales orders table.
    salesOrderRepo.find.mockResolvedValue([
      {
        id: 77,
        invoice_number: 'INV-90001',
        total_amount: 1250.5,
        status: 'COMPLETED',
        order_date: new Date(1750000000000),
        notes: '[PQ-90001_202607_1] Acme Corp',
      },
    ]);

    const status = await service.runSyncPartial(
      [SyncEntity.SALES_INVOICES],
      'test',
    );
    const salesResult = status.results[0];
    expect(salesResult.recordsCreated).toBe(0);
    expect(salesResult.recordsSkipped).toBe(1);
    expect(insertedSalesOrders).toHaveLength(0);
  });

  it('should link a new invoice line item to the created order (order_id resolved via PQ notes)', async () => {
    const { service, insertedSalesItems, salesOrderRepo, salesOrderItemRepo } =
      buildService();

    // The header was already imported in a previous step with a PQ note:
    salesOrderRepo.find.mockImplementation((opts: any) => {
      if (opts?.select?.includes('notes')) {
        return Promise.resolve([
          { id: 77, notes: '[PQ-90001_202607_1] INV-90001' },
        ]);
      }
      return Promise.resolve([]);
    });
    salesOrderItemRepo.find.mockResolvedValue([]);

    const status = await service.runSyncPartial(
      [SyncEntity.INVOICE_LINE_ITEMS],
      'test',
    );
    const itemsResult = status.results[0];
    expect(status.status).toBe(SyncStatus.COMPLETED);
    expect(itemsResult.recordsCreated).toBe(1);

    const item = insertedSalesItems[0];
    expect(item.order_id).toBe(77);
    expect(item.product_id).toBe(9);
    expect(item.quantity).toBe(10);
    expect(item.price).toBe(120);
    expect(item.total).toBe(1200);
  });

  it('should NOT delete existing PQ orders during a full sync', async () => {
    const { service, salesOrderRepo } = buildService();
    salesOrderRepo.remove = jest.fn();
    salesOrderRepo.find.mockResolvedValue([{ id: 77, notes: '[PQ-1_2_3] x' }]);
    await service.runSync('manual', 'full');
    expect(salesOrderRepo.remove).not.toHaveBeenCalled();
  });

  it('should create a review row when an existing invoice total differs', async () => {
    const { service, salesOrderRepo } = buildService();
    salesOrderRepo.find.mockImplementation((opts: any) => {
      if (opts?.select?.includes('invoice_number')) {
        return Promise.resolve([
          {
            id: 77,
            invoice_number: 'INV-90001',
            total_amount: 999,
            status: 'PENDING',
            order_date: null,
            notes: '[PQ-90001_202607_1] INV-90001',
          },
        ]);
      }
      return Promise.resolve([]);
    });
    const reviewService: any = (service as any).reviewService;
    reviewService.clearPendingForEntity.mockResolvedValue(undefined);

    const status = await service.runSyncPartial(
      [SyncEntity.SALES_INVOICES],
      'test',
    );
    const salesResult = status.results[0];
    expect(salesResult.recordsCreated).toBe(0);
    expect(salesResult.recordsUpdated).toBe(1);
    expect(reviewService.createReview).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'sales_invoices',
        changeType: 'update',
        dbRecordId: 77,
      }),
    );
  });
});

describe('PeachtreeSyncService review orchestration', () => {
  function buildService() {
    const reviewRow = {
      id: 1,
      entity: 'customers',
      record_key: 'Acme',
      change_type: 'update',
      db_record_id: 5,
      old_values: { phone: '111' },
      new_values: { phone: '222' },
      status: 'pending',
    };
    const reviewRepo: any = {
      create: jest.fn((input: any) => input),
      save: jest.fn(async (r: any) => r),
      find: jest.fn().mockResolvedValue([reviewRow]),
    };
    const logRepo: any = {
      create: jest.fn((input: any) => input),
      save: jest.fn(async (r: any) => r),
    };
    const reviewService = new PeachtreeReviewService(reviewRepo, logRepo);
    const customerRepo: any = { update: jest.fn().mockResolvedValue({}) };
    const service = new PeachtreeSyncService(
      {} as any,
      new PeachtreeMappingService(),
      customerRepo,
      { update: jest.fn() } as any,
      { update: jest.fn() } as any,
      { update: jest.fn() } as any,
      {} as any,
      { update: jest.fn() } as any,
      {} as any,
      reviewService,
    );
    return { service, customerRepo, reviewRepo, logRepo };
  }

  it('applies an accepted review row and flips its status', async () => {
    const { service, customerRepo, reviewRepo, logRepo } = buildService();
    const result = await service.applyReview([1]);
    expect(result.applied).toBe(1);
    expect(customerRepo.update).toHaveBeenCalledWith(5, { phone: '222' });
    expect(reviewRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted' }),
    );
    expect(logRepo.save).toHaveBeenCalled();
  });

  it('skips review rows and logs the decision', async () => {
    const { service, reviewRepo, logRepo } = buildService();
    const result = await service.skipReview([1]);
    expect(result.skipped).toBe(1);
    expect(reviewRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'skipped' }),
    );
    expect(logRepo.save).toHaveBeenCalled();
  });
});

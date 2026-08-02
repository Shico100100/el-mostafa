import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BalanceSheetService } from './balance-sheet.service';
import { Account, AccountType } from '../../accounting/entities/account.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';

describe('BalanceSheetService', () => {
  let service: BalanceSheetService;
  let accountRepo: Repository<Account>;
  let journalRepo: Repository<JournalEntry>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceSheetService,
        {
          provide: getRepositoryToken(Account),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BalanceSheetService>(BalanceSheetService);
    accountRepo = module.get(getRepositoryToken(Account));
    journalRepo = module.get(getRepositoryToken(JournalEntry));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should return balanced sheet when assets = liabilities + equity', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '1101', name: 'Inventory', type: AccountType.ASSET, balance: 50000 },
        { id: 2, code: '1103', name: 'Treasury', type: AccountType.ASSET, balance: 30000 },
        { id: 3, code: '2101', name: 'Suppliers', type: AccountType.LIABILITY, balance: 40000 },
        { id: 4, code: '3101', name: 'Equity', type: AccountType.EQUITY, balance: 40000 },
      ]);

      const result = await service.generate();

      expect(result.balanced).toBe(true);
      expect(result.assets.total).toBe(80000);
      expect(result.total_liabilities_and_equity).toBe(80000);
    });

    it('should not flip sign on liabilities/equity', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '1101', name: 'Inventory', type: AccountType.ASSET, balance: 100000 },
        { id: 2, code: '2101', name: 'Suppliers', type: AccountType.LIABILITY, balance: 60000 },
        { id: 3, code: '3101', name: 'Equity', type: AccountType.EQUITY, balance: 40000 },
      ]);

      const result = await service.generate();

      expect(result.liabilities.total).toBe(60000);
      expect(result.equity.total).toBe(40000);
      expect(result.balanced).toBe(true);
    });

    it('should filter out zero-balance items', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '1101', name: 'Inventory', type: AccountType.ASSET, balance: 50000 },
        { id: 2, code: '1102', name: 'Customer Debt', type: AccountType.ASSET, balance: 0 },
        { id: 3, code: '2101', name: 'Suppliers', type: AccountType.LIABILITY, balance: 50000 },
      ]);

      const result = await service.generate();

      expect(result.assets.items).toHaveLength(1);
      expect(result.assets.items[0].code).toBe('1101');
      expect(result.liabilities.items).toHaveLength(1);
    });

    it('should handle empty accounts', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.generate();

      expect(result.balanced).toBe(true);
      expect(result.assets.total).toBe(0);
      expect(result.total_liabilities_and_equity).toBe(0);
    });

    it('should include as_of_date', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.generate('2026-06-30');
      expect(result.as_of_date).toBe('2026-06-30');
    });
  });
});

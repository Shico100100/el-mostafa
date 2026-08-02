import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashFlowStatementService } from './cash-flow-statement.service';
import { Account, AccountType } from '../../accounting/entities/account.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';

describe('CashFlowStatementService', () => {
  let service: CashFlowStatementService;
  let accountRepo: Repository<Account>;
  let journalRepo: Repository<JournalEntry>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowStatementService,
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

    service = module.get<CashFlowStatementService>(CashFlowStatementService);
    accountRepo = module.get(getRepositoryToken(Account));
    journalRepo = module.get(getRepositoryToken(JournalEntry));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should exclude cash account (1103) from cash flow', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '1103', name: 'Treasury', type: AccountType.ASSET, balance: 50000 },
        { id: 2, code: '4101', name: 'Sales', type: AccountType.REVENUE, balance: 0 },
      ]);
      (journalRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, account_id: 1, debit: 10000, credit: 0, description: 'Cash received' },
        { id: 2, account_id: 2, debit: 0, credit: 10000, description: 'Sale' },
      ]);

      const result = await service.generate('2026-01-01', '2026-06-30');

      expect(result.operating_activities.items).toHaveLength(1);
      expect(result.operating_activities.items[0].account_code).toBe('4101');
    });

    it('should classify revenue as operating', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '4101', name: 'Sales', type: AccountType.REVENUE, balance: 0 },
      ]);
      (journalRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, account_id: 1, debit: 0, credit: 50000, description: 'Sale' },
      ]);

      const result = await service.generate('2026-01-01', '2026-06-30');

      expect(result.operating_activities.items).toHaveLength(1);
      expect(result.operating_activities.items[0].net).toBe(-50000);
    });

    it('should classify expense as operating', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '5101', name: 'COGS', type: AccountType.EXPENSE, balance: 0 },
      ]);
      (journalRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, account_id: 1, debit: 20000, credit: 0, description: 'COGS' },
      ]);

      const result = await service.generate('2026-01-01', '2026-06-30');

      expect(result.operating_activities.items).toHaveLength(1);
      expect(result.operating_activities.items[0].net).toBe(20000);
    });

    it('should classify current assets (1101, 1102) as operating', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '1101', name: 'Inventory', type: AccountType.ASSET, balance: 0 },
        { id: 2, code: '1102', name: 'Customer Debt', type: AccountType.ASSET, balance: 0 },
      ]);
      (journalRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, account_id: 1, debit: 5000, credit: 2000, description: 'Inv' },
        { id: 2, account_id: 2, debit: 3000, credit: 1000, description: 'Debt' },
      ]);

      const result = await service.generate('2026-01-01', '2026-06-30');

      expect(result.operating_activities.items).toHaveLength(2);
      expect(result.operating_activities.total).toBe(5000);
    });

    it('should classify non-current assets as investing', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '1201', name: 'Machines', type: AccountType.ASSET, balance: 0 },
      ]);
      (journalRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, account_id: 1, debit: 50000, credit: 0, description: 'Machine purchase' },
      ]);

      const result = await service.generate('2026-01-01', '2026-06-30');

      expect(result.investing_activities.items).toHaveLength(1);
      expect(result.investing_activities.items[0].net).toBe(50000);
    });

    it('should classify equity as financing', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '3101', name: 'Equity', type: AccountType.EQUITY, balance: 0 },
      ]);
      (journalRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, account_id: 1, debit: 0, credit: 100000, description: 'Capital' },
      ]);

      const result = await service.generate('2026-01-01', '2026-06-30');

      expect(result.financing_activities.items).toHaveLength(1);
      expect(result.financing_activities.items[0].net).toBe(-100000);
    });

    it('should calculate net_cash_flow as sum of all sections', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '4101', name: 'Sales', type: AccountType.REVENUE, balance: 0 },
        { id: 2, code: '5101', name: 'COGS', type: AccountType.EXPENSE, balance: 0 },
        { id: 3, code: '3101', name: 'Equity', type: AccountType.EQUITY, balance: 0 },
      ]);
      (journalRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, account_id: 1, debit: 0, credit: 50000, description: 'Sale' },
        { id: 2, account_id: 2, debit: 20000, credit: 0, description: 'COGS' },
        { id: 3, account_id: 3, debit: 0, credit: 30000, description: 'Capital' },
      ]);

      const result = await service.generate('2026-01-01', '2026-06-30');

      expect(result.net_cash_flow).toBe(
        result.operating_activities.total +
        result.investing_activities.total +
        result.financing_activities.total,
      );
    });

    it('should handle empty journal entries', async () => {
      (accountRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, code: '4101', name: 'Sales', type: AccountType.REVENUE, balance: 0 },
      ]);
      (journalRepo.find as jest.Mock).mockResolvedValue([]);

      const result = await service.generate('2026-01-01', '2026-06-30');

      expect(result.net_cash_flow).toBe(0);
      expect(result.operating_activities.items).toHaveLength(0);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AccountingService } from './accounting.service';
import { Account, AccountType } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { AccountCrudService } from './accounts/account-crud.service';

describe('AccountingService', () => {
  let service: AccountingService;
  let accountRepo: Repository<Account>;
  let journalRepo: Repository<JournalEntry>;
  let accountCrudService: AccountCrudService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
        {
          provide: AccountCrudService,
          useValue: {
            getAccounts: jest.fn(),
            createAccount: jest.fn(),
            updateAccount: jest.fn(),
            getAccountByCode: jest.fn(),
            invalidateCache: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => {
              const mockManager = {
                getRepository: jest.fn().mockImplementation((entity) => {
                  if (entity === Account) return accountRepo;
                  if (entity === JournalEntry) return journalRepo;
                  return {};
                }),
                query: jest.fn().mockResolvedValue([]),
              };
              return cb(mockManager);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
    accountCrudService = module.get<AccountCrudService>(AccountCrudService);
    accountRepo = module.get<Repository<Account>>(getRepositoryToken(Account));
    journalRepo = module.get<Repository<JournalEntry>>(
      getRepositoryToken(JournalEntry),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAccounts', () => {
    it('should return an array of accounts', async () => {
      const accounts = [{ id: 1, name: 'Cash', code: '101' }];
      (accountCrudService.getAccounts as jest.Mock).mockResolvedValue(accounts);

      const result = await service.getAccounts();
      expect(result).toEqual(accounts);
      expect(accountCrudService.getAccounts).toHaveBeenCalled();
    });
  });

  describe('createJournalEntry', () => {
    it('should throw an error if debit does not equal credit', async () => {
      const data = {
        date: new Date(),
        description: 'Unbalanced entry',
        entries: [
          { account_id: 1, debit: 100, credit: 0 },
          { account_id: 2, debit: 0, credit: 50 },
        ],
      };

      await expect(service.createJournalEntry(data)).rejects.toThrow(
        /قيود غير متوازنة/,
      );
    });

    it('should successfully create balanced entry and update balances', async () => {
      const data = {
        date: new Date(),
        description: 'Balanced entry',
        entries: [
          { account_id: 1, debit: 100, credit: 0 },
          { account_id: 2, debit: 0, credit: 100 },
        ],
      };

      const account1 = { id: 1, type: AccountType.ASSET, balance: 500 };
      const account2 = { id: 2, type: AccountType.LIABILITY, balance: 200 };

      (accountRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(account1)
        .mockResolvedValueOnce(account2);

      (journalRepo.create as jest.Mock).mockImplementation((d) => d);
      (journalRepo.save as jest.Mock).mockImplementation((d) => ({
        id: Math.random(),
        ...d,
      }));

      const result = await service.createJournalEntry(data);

      expect(result).toHaveLength(2);
      expect(accountRepo.save).toHaveBeenCalled();
      // Account 1 (Asset): 500 + 100 - 0 = 600
      expect(account1.balance).toBe(600);
      // Account 2 (Liability): 200 + 100 - 0 = 300
      expect(account2.balance).toBe(300);
    });
  });

  describe('reverseJournalEntry', () => {
    it('should create mirrored entries and update balances', async () => {
      const originals = [
        {
          id: 1,
          account_id: 1,
          debit: 100,
          credit: 0,
          description: 'قيد',
          reversal_of: null,
        },
        {
          id: 2,
          account_id: 2,
          debit: 0,
          credit: 100,
          description: 'قيد',
          reversal_of: null,
        },
      ];
      const account1 = { id: 1, type: AccountType.ASSET, balance: 600 };
      const account2 = { id: 2, type: AccountType.LIABILITY, balance: 300 };

      (journalRepo.find as jest.Mock).mockResolvedValueOnce(originals);
      (journalRepo.findOne as jest.Mock).mockResolvedValue(null);
      (journalRepo.create as jest.Mock).mockImplementation((d) => d);
      (journalRepo.save as jest.Mock).mockImplementation((d) => ({
        id: Math.random(),
        ...d,
      }));
      (accountRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(account1)
        .mockResolvedValueOnce(account2);

      const result = await service.reverseJournalEntry([1, 2]);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        account_id: 1,
        debit: 0,
        credit: 100,
        reversal_of: 1,
      });
      expect(result[1]).toMatchObject({
        account_id: 2,
        debit: 100,
        credit: 0,
        reversal_of: 2,
      });
      expect(account1.balance).toBe(500);
      expect(account2.balance).toBe(200);
    });

    it('should throw if any line is missing', async () => {
      const originals = [
        {
          id: 1,
          account_id: 1,
          debit: 100,
          credit: 0,
          description: 'قيد',
          reversal_of: null,
        },
      ];
      (journalRepo.find as jest.Mock).mockResolvedValueOnce(originals);

      await expect(service.reverseJournalEntry([1, 2])).rejects.toThrow(
        /بعض أسطر القيد غير موجودة/,
      );
    });

    it('should throw if a line was already reversed', async () => {
      const originals = [
        {
          id: 1,
          account_id: 1,
          debit: 100,
          credit: 0,
          description: 'قيد',
          reversal_of: null,
        },
      ];
      (journalRepo.find as jest.Mock).mockResolvedValueOnce(originals);
      (journalRepo.findOne as jest.Mock).mockResolvedValueOnce({
        id: 99,
        reversal_of: 1,
      });

      await expect(service.reverseJournalEntry([1])).rejects.toThrow(
        /تم عكسه بالفعل/,
      );
    });

    it('should throw if a line is itself a reversal', async () => {
      const originals = [
        {
          id: 1,
          account_id: 1,
          debit: 0,
          credit: 100,
          description: 'عكسي: قيد',
          reversal_of: 7,
        },
      ];
      (journalRepo.find as jest.Mock).mockResolvedValueOnce(originals);

      await expect(service.reverseJournalEntry([1])).rejects.toThrow(
        /لا يمكن عكس قيد عكسي/,
      );
    });
  });

  describe('reconcileBalances', () => {
    it('should correct drifted balances from journal entries', async () => {
      const accounts = [
        { id: 1, type: AccountType.ASSET, balance: 999 },
        { id: 2, type: AccountType.LIABILITY, balance: 200 },
      ];
      const rows = [
        { account_id: 1, total_debit: 600, total_credit: 100 },
        { account_id: 2, total_debit: 100, total_credit: 300 },
      ];

      (accountRepo.find as jest.Mock).mockResolvedValueOnce(accounts);
      const dataSource = service['dataSource'] as any;
      dataSource.transaction = jest.fn((cb) => {
        const mockManager = {
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === Account) return accountRepo;
            if (entity === JournalEntry) return journalRepo;
            return {};
          }),
          query: jest.fn().mockResolvedValue(rows),
        };
        return cb(mockManager);
      });

      const result = await service.reconcileBalances();

      expect(result.corrected).toBe(1);
      expect(accounts[0].balance).toBe(500);
      expect(accounts[1].balance).toBe(200);
    });
  });

  describe('postAutomaticEntry', () => {
    it('should handle SALE type correctly', async () => {
      const params = {
        type: 'SALE' as const,
        amount: 1000,
        reference: 'INV-001',
        description: 'Sale of goods',
      };

      const receivableAcc = { id: 10, code: '1102', name: 'Receivables' };
      const salesAcc = { id: 20, code: '4101', name: 'Sales' };
      const cogsAcc = { id: 30, code: '5101', name: 'COGS' };
      const inventoryAcc = { id: 40, code: '1101', name: 'Inventory' };

      (accountCrudService.getAccountByCode as jest.Mock)
        .mockResolvedValueOnce(receivableAcc)
        .mockResolvedValueOnce(salesAcc)
        .mockResolvedValueOnce(cogsAcc)
        .mockResolvedValueOnce(inventoryAcc);

      jest.spyOn(service, 'createJournalEntry').mockResolvedValue([] as any);

      await service.postAutomaticEntry(params);

      expect(accountCrudService.getAccountByCode).toHaveBeenCalledWith('1102');
      expect(accountCrudService.getAccountByCode).toHaveBeenCalledWith('4101');
      expect(service.createJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          description: params.description,
          entries: [
            { account_id: 10, debit: 1000, credit: 0 },
            { account_id: 20, debit: 0, credit: 1000 },
          ],
        }),
      );
    });

    it('should include COGS entries when cogsAmount is provided', async () => {
      const params = {
        type: 'SALE' as const,
        amount: 1000,
        cogsAmount: 600,
        reference: 'INV-002',
        description: 'Sale with COGS',
      };

      const receivableAcc = { id: 10, code: '1102', name: 'Receivables' };
      const salesAcc = { id: 20, code: '4101', name: 'Sales' };
      const cogsAcc = { id: 30, code: '5101', name: 'COGS' };
      const inventoryAcc = { id: 40, code: '1101', name: 'Inventory' };

      (accountCrudService.getAccountByCode as jest.Mock)
        .mockResolvedValueOnce(receivableAcc)
        .mockResolvedValueOnce(salesAcc)
        .mockResolvedValueOnce(cogsAcc)
        .mockResolvedValueOnce(inventoryAcc);

      jest.spyOn(service, 'createJournalEntry').mockResolvedValue([] as any);

      await service.postAutomaticEntry(params);

      expect(service.createJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            { account_id: 10, debit: 1000, credit: 0 },
            { account_id: 20, debit: 0, credit: 1000 },
            { account_id: 30, debit: 600, credit: 0 },
            { account_id: 40, debit: 0, credit: 600 },
          ],
        }),
      );
    });

    it('should handle negative cogsAmount for returns', async () => {
      const params = {
        type: 'SALE' as const,
        amount: -500,
        cogsAmount: -300,
        reference: 'RET-001',
        description: 'Sales return',
      };

      const receivableAcc = { id: 10, code: '1102', name: 'Receivables' };
      const salesAcc = { id: 20, code: '4101', name: 'Sales' };
      const cogsAcc = { id: 30, code: '5101', name: 'COGS' };
      const inventoryAcc = { id: 40, code: '1101', name: 'Inventory' };

      (accountCrudService.getAccountByCode as jest.Mock)
        .mockResolvedValueOnce(receivableAcc)
        .mockResolvedValueOnce(salesAcc)
        .mockResolvedValueOnce(cogsAcc)
        .mockResolvedValueOnce(inventoryAcc);

      jest.spyOn(service, 'createJournalEntry').mockResolvedValue([] as any);

      await service.postAutomaticEntry(params);

      expect(service.createJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            { account_id: 10, debit: -500, credit: 0 },
            { account_id: 20, debit: 0, credit: -500 },
            { account_id: 30, debit: -300, credit: 0 },
            { account_id: 40, debit: 0, credit: -300 },
          ],
        }),
      );
    });

    it('should handle PURCHASE type correctly', async () => {
      const params = {
        type: 'PURCHASE' as const,
        amount: 2000,
        reference: 'PO-001',
        description: 'Purchase of goods',
      };

      const inventoryAcc = { id: 40, code: '1101', name: 'Inventory' };
      const payableAcc = { id: 50, code: '2101', name: 'Payables' };

      (accountCrudService.getAccountByCode as jest.Mock)
        .mockResolvedValueOnce(inventoryAcc)
        .mockResolvedValueOnce(payableAcc);

      jest.spyOn(service, 'createJournalEntry').mockResolvedValue([] as any);

      await service.postAutomaticEntry(params);

      expect(service.createJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            { account_id: 40, debit: 2000, credit: 0 },
            { account_id: 50, debit: 0, credit: 2000 },
          ],
        }),
      );
    });

    it('should handle PRODUCTION type with debit expense / credit inventory', async () => {
      const params = {
        type: 'PRODUCTION' as const,
        amount: 800,
        reference: 'PRD-001',
        description: 'Production cost',
      };

      const stockAcc = { id: 40, code: '1101', name: 'Inventory' };
      const manufacturingAcc = { id: 60, code: '5102', name: 'Manufacturing' };

      (accountCrudService.getAccountByCode as jest.Mock)
        .mockResolvedValueOnce(stockAcc)
        .mockResolvedValueOnce(manufacturingAcc);

      jest.spyOn(service, 'createJournalEntry').mockResolvedValue([] as any);

      await service.postAutomaticEntry(params);

      expect(service.createJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          entries: [
            { account_id: 60, debit: 800, credit: 0 },
            { account_id: 40, debit: 0, credit: 800 },
          ],
        }),
      );
    });
  });
});

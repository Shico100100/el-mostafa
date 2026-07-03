import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AccountingService } from './accounting.service';
import { Account, AccountType } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';

describe('AccountingService', () => {
  let service: AccountingService;
  let accountRepo: Repository<Account>;
  let journalRepo: Repository<JournalEntry>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountingService,
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
              };
              return cb(mockManager);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AccountingService>(AccountingService);
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
      (accountRepo.find as jest.Mock).mockResolvedValue(accounts);

      const result = await service.getAccounts();
      expect(result).toEqual(accounts);
      expect(accountRepo.find).toHaveBeenCalled();
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
        /Unbalanced entry/,
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

      (accountRepo.findOne as jest.Mock)
        .mockResolvedValueOnce(receivableAcc) // getAccountByCode('1102')
        .mockResolvedValueOnce(salesAcc) // getAccountByCode('4101')
        .mockResolvedValueOnce(receivableAcc) // inside createJournalEntry -> account_id 10
        .mockResolvedValueOnce(salesAcc); // inside createJournalEntry -> account_id 20

      jest.spyOn(service, 'createJournalEntry').mockResolvedValue([] as any);

      await service.postAutomaticEntry(params);

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
  });
});

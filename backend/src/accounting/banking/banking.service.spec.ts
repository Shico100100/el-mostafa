import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BankingService } from './banking.service';
import { BankAccount } from './entities/bank-account.entity';
import { BankTransaction } from './entities/bank-transaction.entity';
import { BankReconciliation } from './entities/bank-reconciliation.entity';

describe('BankingService', () => {
  let service: BankingService;
  let bankAccountRepo: Repository<BankAccount>;
  let bankTxRepo: Repository<BankTransaction>;
  let reconRepo: Repository<BankReconciliation>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankingService,
        {
          provide: getRepositoryToken(BankAccount),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BankTransaction),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BankReconciliation),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BankingService>(BankingService);
    bankAccountRepo = module.get(getRepositoryToken(BankAccount));
    bankTxRepo = module.get(getRepositoryToken(BankTransaction));
    reconRepo = module.get(getRepositoryToken(BankReconciliation));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addTransaction', () => {
    it('should update bank account balance correctly for debit', async () => {
      const account = { id: 1, name: 'Primary', balance: 10000 };
      (bankAccountRepo.findOne as jest.Mock).mockResolvedValue(account);
      (bankTxRepo.create as jest.Mock).mockImplementation((d) => d);
      (bankTxRepo.save as jest.Mock).mockImplementation((d) => ({
        id: 1,
        ...d,
      }));
      (bankAccountRepo.save as jest.Mock).mockResolvedValue({});

      await service.addTransaction(1, {
        debit: 5000,
        credit: 0,
        description: 'deposit',
      });

      const savedAccount = (bankAccountRepo.save as jest.Mock).mock.calls[0][0];
      expect(savedAccount.balance).toBe(15000);
    });

    it('should update bank account balance correctly for credit', async () => {
      const account = { id: 1, name: 'Primary', balance: 10000 };
      (bankAccountRepo.findOne as jest.Mock).mockResolvedValue(account);
      (bankTxRepo.create as jest.Mock).mockImplementation((d) => d);
      (bankTxRepo.save as jest.Mock).mockImplementation((d) => ({
        id: 1,
        ...d,
      }));
      (bankAccountRepo.save as jest.Mock).mockResolvedValue({});

      await service.addTransaction(1, {
        debit: 0,
        credit: 3000,
        description: 'payment',
      });

      const savedAccount = (bankAccountRepo.save as jest.Mock).mock.calls[0][0];
      expect(savedAccount.balance).toBe(7000);
    });

    it('should throw NotFoundException for invalid account', async () => {
      (bankAccountRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.addTransaction(999, { debit: 100, credit: 0 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startReconciliation', () => {
    it('should create reconciliation with correct initial difference', async () => {
      const account = { id: 1, name: 'Primary', balance: 50000 };
      (bankAccountRepo.findOne as jest.Mock).mockResolvedValue(account);
      (reconRepo.create as jest.Mock).mockImplementation((d) => d);
      (reconRepo.save as jest.Mock).mockImplementation((d) => ({
        id: 1,
        ...d,
      }));

      const result = await service.startReconciliation(
        1,
        new Date('2026-07-01'),
        52000,
      );

      expect(result.difference).toBe(2000);
      expect(result.status).toBe('PENDING');
      expect(result.reconciled_balance).toBe(50000);
    });
  });

  describe('completeReconciliation', () => {
    it('should calculate actual difference between statement and book balance', async () => {
      const recon = {
        id: 1,
        bank_account_id: 1,
        statement_balance: 52000,
        status: 'PENDING',
      };
      (reconRepo.findOne as jest.Mock).mockResolvedValue(recon);
      (bankTxRepo.find as jest.Mock).mockResolvedValue([
        { id: 1, debit: 1000, credit: 0 },
        { id: 2, debit: 0, credit: 500 },
      ]);
      (bankTxRepo.update as jest.Mock).mockResolvedValue({});
      const account = { id: 1, balance: 50500 };
      (bankAccountRepo.findOne as jest.Mock).mockResolvedValue(account);
      (reconRepo.save as jest.Mock).mockImplementation((d) => d);

      const result = await service.completeReconciliation(1, [1, 2]);

      expect(result.status).toBe('COMPLETED');
      expect(result.reconciled_balance).toBe(50500);
      expect(result.difference).toBe(1500);
    });

    it('should handle zero difference (fully reconciled)', async () => {
      const recon = {
        id: 1,
        bank_account_id: 1,
        statement_balance: 50000,
        status: 'PENDING',
      };
      (reconRepo.findOne as jest.Mock).mockResolvedValue(recon);
      (bankTxRepo.find as jest.Mock).mockResolvedValue([]);
      (bankTxRepo.update as jest.Mock).mockResolvedValue({});
      const account = { id: 1, balance: 50000 };
      (bankAccountRepo.findOne as jest.Mock).mockResolvedValue(account);
      (reconRepo.save as jest.Mock).mockImplementation((d) => d);

      const result = await service.completeReconciliation(1, []);

      expect(result.difference).toBe(0);
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw NotFoundException for invalid reconciliation', async () => {
      (reconRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.completeReconciliation(999, [])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStatement', () => {
    it('should return statement with correct totals', async () => {
      const account = { id: 1, name: 'Primary', balance: 75000 };
      (bankAccountRepo.findOne as jest.Mock).mockResolvedValue(account);
      (bankTxRepo.find as jest.Mock).mockResolvedValue([
        { debit: 10000, credit: 0 },
        { debit: 5000, credit: 2000 },
        { debit: 0, credit: 8000 },
      ]);

      const result = await service.getStatement(1);

      expect(result.currentBalance).toBe(75000);
      expect(result.totalDebits).toBe(15000);
      expect(result.totalCredits).toBe(10000);
    });
  });
});

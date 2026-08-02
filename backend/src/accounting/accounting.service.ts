import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
} from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { AccountCrudService } from './accounts/account-crud.service';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(JournalEntry)
    private journalRepo: Repository<JournalEntry>,
    private accountCrudService: AccountCrudService,
    private dataSource: DataSource,
  ) {}

  // ---- Account Delegation ----

  async getAccounts() {
    return this.accountCrudService.getAccounts();
  }

  async createAccount(data: Partial<Account>) {
    return this.accountCrudService.createAccount(data);
  }

  async updateAccount(id: number, data: Partial<Account>) {
    return this.accountCrudService.updateAccount(id, data);
  }

  // ---- Journal Entries ----

  async getJournalEntries(query: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    accountId?: number;
  }) {
    const { page = 1, limit = 50, startDate, endDate, accountId } = query;
    const where: any = {};

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    } else if (startDate) {
      where.date = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.date = LessThanOrEqual(endDate);
    }
    if (accountId) {
      where.account_id = accountId;
    }

    const [data, total] = await this.journalRepo.findAndCount({
      where,
      relations: ['account'],
      order: { date: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createJournalEntry(data: {
    date: Date;
    description: string;
    reference?: string;
    entries: { account_id: number; debit: number; credit: number }[];
  }) {
    const totalDebit = data.entries.reduce(
      (sum, entry) => sum + Number(entry.debit),
      0,
    );
    const totalCredit = data.entries.reduce(
      (sum, entry) => sum + Number(entry.credit),
      0,
    );

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `قيود غير متوازنة: مدين (${totalDebit}) != دائن (${totalCredit})`,
      );
    }

    const savedEntries = await this.dataSource.transaction(async (manager) => {
      const journalRepo = manager.getRepository(JournalEntry);
      const accountRepo = manager.getRepository(Account);

      const saved: JournalEntry[] = [];
      for (const entry of data.entries) {
        const journalEntry = journalRepo.create({
          date: data.date,
          description: data.description,
          reference: data.reference,
          account_id: entry.account_id,
          debit: entry.debit,
          credit: entry.credit,
        });
        saved.push(await journalRepo.save(journalEntry));

        const account = await accountRepo.findOne({
          where: { id: entry.account_id },
        });
        if (account) {
          const isDebitNormal = [
            AccountType.ASSET,
            AccountType.EXPENSE,
          ].includes(account.type);

          if (isDebitNormal) {
            account.balance =
              Number(account.balance) +
              Number(entry.debit) -
              Number(entry.credit);
          } else {
            account.balance =
              Number(account.balance) +
              Number(entry.credit) -
              Number(entry.debit);
          }
          await accountRepo.save(account);
        }
      }

      return saved;
    });

    await this.accountCrudService.invalidateCache();
    return savedEntries;
  }

  async reverseJournalEntry(entryIds: number[]) {
    if (!entryIds || entryIds.length === 0) {
      throw new BadRequestException('لا توجد أسطر قيد لعكسها');
    }
    const uniqueIds = [...new Set(entryIds)];

    return this.dataSource.transaction(async (manager) => {
      const journalRepo = manager.getRepository(JournalEntry);
      const accountRepo = manager.getRepository(Account);

      const originals = await journalRepo.find({
        where: { id: In(uniqueIds) },
      });
      if (originals.length !== uniqueIds.length) {
        throw new BadRequestException('بعض أسطر القيد غير موجودة');
      }

      for (const line of originals) {
        if (line.reversal_of != null) {
          throw new BadRequestException('لا يمكن عكس قيد عكسي');
        }
        const existingReversal = await journalRepo.findOne({
          where: { reversal_of: line.id },
        });
        if (existingReversal) {
          throw new BadRequestException('هذا القيد تم عكسه بالفعل');
        }
      }

      const savedEntries: JournalEntry[] = [];
      for (const line of originals) {
        const journalEntry = journalRepo.create({
          date: new Date(),
          description: `عكسي: ${line.description}`,
          reference: line.reference,
          account_id: line.account_id,
          debit: line.credit,
          credit: line.debit,
          reversal_of: line.id,
        });
        savedEntries.push(await journalRepo.save(journalEntry));

        const account = await accountRepo.findOne({
          where: { id: line.account_id },
        });
        if (account) {
          const isDebitNormal = [
            AccountType.ASSET,
            AccountType.EXPENSE,
          ].includes(account.type);

          if (isDebitNormal) {
            account.balance =
              Number(account.balance) +
              Number(journalEntry.debit) -
              Number(journalEntry.credit);
          } else {
            account.balance =
              Number(account.balance) +
              Number(journalEntry.credit) -
              Number(journalEntry.debit);
          }
          await accountRepo.save(account);
        }
      }

      await this.accountCrudService.invalidateCache();
      return savedEntries;
    });
  }

  async reconcileBalances() {
    return this.dataSource.transaction(async (manager) => {
      const accountRepo = manager.getRepository(Account);
      const rows: any[] = await manager.query(`
        SELECT
          account_id,
          COALESCE(SUM(debit), 0) AS total_debit,
          COALESCE(SUM(credit), 0) AS total_credit
        FROM journal_entries
        GROUP BY account_id
      `);

      const accounts = await accountRepo.find();
      let corrected = 0;

      for (const acc of accounts) {
        const agg = rows.find((r) => Number(r.account_id) === acc.id) || {
          total_debit: 0,
          total_credit: 0,
        };
        const isDebitNormal = [AccountType.ASSET, AccountType.EXPENSE].includes(
          acc.type,
        );
        const computed = isDebitNormal
          ? Number(agg.total_debit) - Number(agg.total_credit)
          : Number(agg.total_credit) - Number(agg.total_debit);

        if (Math.abs(Number(acc.balance) - computed) > 0.01) {
          acc.balance = computed;
          await accountRepo.save(acc);
          corrected++;
        }
      }

      await this.accountCrudService.invalidateCache();
      return { corrected };
    });
  }

  async getTrialBalance() {
    const accounts = await this.accountRepo.find({ order: { code: 'ASC' } });

    const rawBalances = await this.dataSource.query(`
      SELECT
        account_id,
        COALESCE(SUM(debit), 0) AS total_debit,
        COALESCE(SUM(credit), 0) AS total_credit
      FROM journal_entries
      GROUP BY account_id
    `);

    const balanceMap = new Map<number, { debit: number; credit: number }>();
    for (const row of rawBalances) {
      balanceMap.set(row.account_id, {
        debit: Number(row.total_debit),
        credit: Number(row.total_credit),
      });
    }

    return accounts.map((acc) => {
      const agg = balanceMap.get(acc.id) || { debit: 0, credit: 0 };
      const balance = Math.round((agg.debit - agg.credit) * 100) / 100;
      const isDebitNormal = [AccountType.ASSET, AccountType.EXPENSE].includes(
        acc.type,
      );

      let displayBalance: { dr: number; cr: number };
      if (isDebitNormal) {
        displayBalance =
          balance >= 0 ? { dr: balance, cr: 0 } : { dr: 0, cr: -balance };
      } else {
        displayBalance =
          balance <= 0 ? { dr: 0, cr: -balance } : { dr: balance, cr: 0 };
      }

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        balance,
        displayBalance,
      };
    });
  }

  async postAutomaticEntry(params: {
    type: 'SALE' | 'PURCHASE' | 'PRODUCTION' | 'PAYMENT';
    amount: number;
    reference: string;
    description: string;
    partnerId?: number;
    cogsAmount?: number;
  }) {
    let entries: { account_id: number; debit: number; credit: number }[] = [];

    switch (params.type) {
      case 'SALE':
        const receivableAcc =
          await this.accountCrudService.getAccountByCode('1102');
        const salesAcc = await this.accountCrudService.getAccountByCode('4101');
        const cogsAcc = await this.accountCrudService.getAccountByCode('5101');
        const saleInventoryAcc =
          await this.accountCrudService.getAccountByCode('1101');
        if (receivableAcc && salesAcc) {
          entries = [
            { account_id: receivableAcc.id, debit: params.amount, credit: 0 },
            { account_id: salesAcc.id, debit: 0, credit: params.amount },
          ];
        }
        if (
          params.cogsAmount &&
          Math.abs(params.cogsAmount) > 0.01 &&
          cogsAcc &&
          saleInventoryAcc
        ) {
          entries.push(
            { account_id: cogsAcc.id, debit: params.cogsAmount, credit: 0 },
            {
              account_id: saleInventoryAcc.id,
              debit: 0,
              credit: params.cogsAmount,
            },
          );
        }
        break;

      case 'PURCHASE':
        const inventoryAcc =
          await this.accountCrudService.getAccountByCode('1101');
        const payableAcc =
          await this.accountCrudService.getAccountByCode('2101');
        if (inventoryAcc && payableAcc) {
          entries = [
            { account_id: inventoryAcc.id, debit: params.amount, credit: 0 },
            { account_id: payableAcc.id, debit: 0, credit: params.amount },
          ];
        }
        break;

      case 'PRODUCTION':
        const stockAcc = await this.accountCrudService.getAccountByCode('1101');
        const manufacturingAcc =
          await this.accountCrudService.getAccountByCode('5102');
        if (stockAcc && manufacturingAcc) {
          entries = [
            {
              account_id: manufacturingAcc.id,
              debit: params.amount,
              credit: 0,
            },
            { account_id: stockAcc.id, debit: 0, credit: params.amount },
          ];
        }
        break;

      case 'PAYMENT':
        const cashAcc = await this.accountCrudService.getAccountByCode('1103');
        const partnerAcc = await this.accountCrudService.getAccountByCode(
          params.partnerId ? '1102' : '2101',
        );

        if (cashAcc && partnerAcc) {
          if (params.partnerId) {
            entries = [
              { account_id: cashAcc.id, debit: params.amount, credit: 0 },
              { account_id: partnerAcc.id, debit: 0, credit: params.amount },
            ];
          } else {
            entries = [
              { account_id: partnerAcc.id, debit: params.amount, credit: 0 },
              { account_id: cashAcc.id, debit: 0, credit: params.amount },
            ];
          }
        }
        break;
    }

    if (entries.length === 0) {
      throw new BadRequestException(
        `تعذر ترجيع القيد المحاسبي: لم يتم العثور على حسابات النظام للنوع ${params.type}`,
      );
    }

    return this.createJournalEntry({
      date: new Date(),
      description: params.description,
      reference: params.reference,
      entries,
    });
  }
}

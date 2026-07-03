import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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

  async getJournalEntries() {
    return this.journalRepo.find({
      relations: ['account'],
      order: { date: 'DESC', id: 'DESC' },
    });
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
        `Unbalanced entry: Debit (${totalDebit}) != Credit (${totalCredit})`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const journalRepo = manager.getRepository(JournalEntry);
      const accountRepo = manager.getRepository(Account);

      const savedEntries: JournalEntry[] = [];
      for (const entry of data.entries) {
        const journalEntry = journalRepo.create({
          date: data.date,
          description: data.description,
          reference: data.reference,
          account_id: entry.account_id,
          debit: entry.debit,
          credit: entry.credit,
        });
        savedEntries.push(await journalRepo.save(journalEntry));

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

      return savedEntries;
    });
  }

  async getTrialBalance() {
    const accounts = await this.accountRepo.find({ order: { code: 'ASC' } });
    return accounts.map((acc) => ({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
    }));
  }

  async postAutomaticEntry(params: {
    type: 'SALE' | 'PURCHASE' | 'PRODUCTION' | 'PAYMENT';
    amount: number;
    reference: string;
    description: string;
    partnerId?: number;
  }) {
    let entries: { account_id: number; debit: number; credit: number }[] = [];

    switch (params.type) {
      case 'SALE':
        const receivableAcc =
          await this.accountCrudService.getAccountByCode('1102');
        const salesAcc = await this.accountCrudService.getAccountByCode('4101');
        if (receivableAcc && salesAcc) {
          entries = [
            { account_id: receivableAcc.id, debit: params.amount, credit: 0 },
            { account_id: salesAcc.id, debit: 0, credit: params.amount },
          ];
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
            { account_id: stockAcc.id, debit: params.amount, credit: 0 },
            {
              account_id: manufacturingAcc.id,
              debit: 0,
              credit: params.amount,
            },
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

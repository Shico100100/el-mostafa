import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(JournalEntry)
    private journalRepo: Repository<JournalEntry>,
  ) {}

  async onModuleInit() {
    await this.ensureSystemAccounts();
  }

  async ensureSystemAccounts() {
    const systemAccounts = [
      {
        code: '1101',
        name: 'المخزون',
        type: AccountType.ASSET,
        description: 'مخزون المواد الخام والمنتجات',
      },
      {
        code: '1102',
        name: 'العملاء',
        type: AccountType.ASSET,
        description: 'حسابات العملاء المدينين',
      },
      {
        code: '1103',
        name: 'الخزينة',
        type: AccountType.ASSET,
        description: 'النقدية بالصندوق',
      },
      {
        code: '2101',
        name: 'الموردين',
        type: AccountType.LIABILITY,
        description: 'حسابات الموردين الدائنين',
      },
      {
        code: '3101',
        name: 'رأس المال',
        type: AccountType.EQUITY,
        description: 'رأس مال الشركة',
      },
      {
        code: '4101',
        name: 'المبيعات',
        type: AccountType.REVENUE,
        description: 'إيرادات مبيعات المنتجات',
      },
      {
        code: '5101',
        name: 'تكلفة المبيعات',
        type: AccountType.EXPENSE,
        description: 'تكلفة البضاعة المباعة',
      },
      {
        code: '5102',
        name: 'مصاريف التصنيع',
        type: AccountType.EXPENSE,
        description: 'تكاليف الكهرباء والعمالة والأعباء',
      },
    ];

    for (const acc of systemAccounts) {
      const exists = await this.accountRepo.findOne({
        where: { code: acc.code },
      });
      if (!exists) {
        await this.accountRepo.save(this.accountRepo.create(acc));
      }
    }
  }

  async getAccountByCode(code: string) {
    return this.accountRepo.findOne({ where: { code } });
  }

  // Accounts
  async getAccounts() {
    return this.accountRepo.find({ order: { code: 'ASC' } });
  }

  async createAccount(data: Partial<Account>) {
    const account = this.accountRepo.create(data);
    return this.accountRepo.save(account);
  }

  async updateAccount(id: number, data: Partial<Account>) {
    await this.accountRepo.update(id, data);
    return this.accountRepo.findOne({ where: { id } });
  }

  // Journal Entries
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
    // Verify total debit equals total credit
    const totalDebit = data.entries.reduce(
      (sum, entry) => sum + Number(entry.debit),
      0,
    );
    const totalCredit = data.entries.reduce(
      (sum, entry) => sum + Number(entry.credit),
      0,
    );

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Unbalanced entry: Debit (${totalDebit}) != Credit (${totalCredit})`,
      );
    }

    const savedEntries: JournalEntry[] = [];
    for (const entry of data.entries) {
      const journalEntry = this.journalRepo.create({
        date: data.date,
        description: data.description,
        reference: data.reference,
        account_id: entry.account_id,
        debit: entry.debit,
        credit: entry.credit,
      });
      savedEntries.push(await this.journalRepo.save(journalEntry));

      // Update Account Balance
      const account = await this.accountRepo.findOne({
        where: { id: entry.account_id },
      });
      if (account) {
        // Asset/Expense: Debit increases, Credit decreases
        // Liability/Equity/Revenue: Credit increases, Debit decreases
        const isDebitNormal = [AccountType.ASSET, AccountType.EXPENSE].includes(
          account.type,
        );

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
        await this.accountRepo.save(account);
      }
    }

    return savedEntries;
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
    partnerId?: number; // Customer/Supplier ID if needed
  }) {
    let entries: { account_id: number; debit: number; credit: number }[] = [];

    switch (params.type) {
      case 'SALE':
        const receivableAcc = await this.getAccountByCode('1102');
        const salesAcc = await this.getAccountByCode('4101');
        if (receivableAcc && salesAcc) {
          entries = [
            { account_id: receivableAcc.id, debit: params.amount, credit: 0 },
            { account_id: salesAcc.id, debit: 0, credit: params.amount },
          ];
        }
        break;

      case 'PURCHASE':
        const inventoryAcc = await this.getAccountByCode('1101');
        const payableAcc = await this.getAccountByCode('2101');
        if (inventoryAcc && payableAcc) {
          entries = [
            { account_id: inventoryAcc.id, debit: params.amount, credit: 0 },
            { account_id: payableAcc.id, debit: 0, credit: params.amount },
          ];
        }
        break;

      case 'PRODUCTION':
        const stockAcc = await this.getAccountByCode('1101');
        const manufacturingAcc = await this.getAccountByCode('5101'); // COGS or Manufacturing Expense
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
        const cashAcc = await this.getAccountByCode('1103'); // Cash/Treasury
        const partnerAcc = await this.getAccountByCode(
          params.partnerId ? '1102' : '2101',
        ); // 1102 for Customer, 2101 for Supplier

        if (cashAcc && partnerAcc) {
          if (params.partnerId) {
            // Customer Payment (Inflow)
            entries = [
              { account_id: cashAcc.id, debit: params.amount, credit: 0 },
              { account_id: partnerAcc.id, debit: 0, credit: params.amount },
            ];
          } else {
            // Supplier Payment (Outflow)
            entries = [
              { account_id: partnerAcc.id, debit: params.amount, credit: 0 },
              { account_id: cashAcc.id, debit: 0, credit: params.amount },
            ];
          }
        }
        break;
    }

    if (entries.length > 0) {
      return this.createJournalEntry({
        date: new Date(),
        description: params.description,
        reference: params.reference,
        entries,
      });
    }
  }
}

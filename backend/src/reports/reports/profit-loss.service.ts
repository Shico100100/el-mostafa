import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Account, AccountType } from '../../accounting/entities/account.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';

@Injectable()
export class ProfitLossService {
  constructor(
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(JournalEntry) private journalRepo: Repository<JournalEntry>,
  ) {}

  async generate(startDate?: string, endDate?: string): Promise<any> {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const accounts = await this.accountRepo.find({ order: { code: 'ASC' } });
    const revenueAccounts = accounts.filter(a => a.type === AccountType.REVENUE);
    const expenseAccounts = accounts.filter(a => a.type === AccountType.EXPENSE);

    const accountMap = new Map<number, { code: string; name: string; type: AccountType }>();
    for (const a of accounts) {
      accountMap.set(a.id, { code: a.code, name: a.name, type: a.type });
    }

    const journalEntries = await this.journalRepo
      .createQueryBuilder('je')
      .select('je.account_id', 'account_id')
      .addSelect('SUM(je.debit)', 'total_debit')
      .addSelect('SUM(je.credit)', 'total_credit')
      .where('je.date BETWEEN :start AND :end', { start, end })
      .groupBy('je.account_id')
      .getRawMany();

    const accountBalances = new Map<number, number>();
    for (const row of journalEntries) {
      const accountId = Number(row.account_id);
      const info = accountMap.get(accountId);
      if (!info) continue;

      const totalDebit = Number(row.total_debit);
      const totalCredit = Number(row.total_credit);

      const isDebitNormal = [AccountType.ASSET, AccountType.EXPENSE].includes(info.type);
      const balance = isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit;
      accountBalances.set(accountId, balance);
    }

    const mapAccount = (accountId: number) => {
      const info = accountMap.get(accountId)!;
      return {
        code: info.code,
        name: info.name,
        balance: accountBalances.get(accountId) || 0,
      };
    };

    const revenue = revenueAccounts.map(a => mapAccount(a.id));
    const expenses = expenseAccounts.map(a => mapAccount(a.id));

    const totalRevenue = revenue.reduce((s, r) => s + r.balance, 0);
    const totalExpenses = expenses.reduce((s, e) => s + Math.abs(e.balance), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      revenue: { items: revenue, total: totalRevenue },
      expenses: { items: expenses, total: totalExpenses },
      net_profit: netProfit,
      is_profit: netProfit >= 0,
    };
  }
}

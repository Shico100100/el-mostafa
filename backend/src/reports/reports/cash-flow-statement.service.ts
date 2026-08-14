import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';
import { Account, AccountType } from '../../accounting/entities/account.entity';

@Injectable()
export class CashFlowStatementService {
  constructor(
    @InjectRepository(JournalEntry)
    private journalRepo: Repository<JournalEntry>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
  ) {}

  async generate(startDate?: string, endDate?: string): Promise<any> {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const accounts = await this.accountRepo.find();
    const accountMap = new Map<number, Account>();
    accounts.forEach((a) => accountMap.set(a.id, a));

    // Exclude cash account (1103) — the cash flow statement explains changes IN cash
    const cashAccountIds = new Set(
      accounts.filter((a) => a.code?.startsWith('1103')).map((a) => a.id),
    );

    const entries = await this.journalRepo.find({
      where: { date: Between(start, end) },
    });

    const operating = { items: [] as any[], total: 0 };
    const investing = { items: [] as any[], total: 0 };
    const financing = { items: [] as any[], total: 0 };

    const grouped = new Map<
      number,
      { debit: number; credit: number; description: string }
    >();

    for (const entry of entries) {
      if (cashAccountIds.has(entry.account_id)) continue;

      const existing = grouped.get(entry.account_id);
      if (existing) {
        existing.debit += Number(entry.debit);
        existing.credit += Number(entry.credit);
      } else {
        grouped.set(entry.account_id, {
          debit: Number(entry.debit),
          credit: Number(entry.credit),
          description: entry.description || '',
        });
      }
    }

    for (const [accountId, totals] of grouped) {
      const account = accountMap.get(accountId);
      if (!account) continue;

      const netFlow = totals.debit - totals.credit;

      const code = account.code || '';
      const isCurrentAsset =
        account.type === AccountType.ASSET &&
        (code.startsWith('1101') || code.startsWith('1102'));
      const isCurrentLiability =
        account.type === AccountType.LIABILITY &&
        (code.startsWith('2101') || code.startsWith('2102'));

      if (
        account.type === AccountType.REVENUE ||
        account.type === AccountType.EXPENSE ||
        isCurrentAsset ||
        isCurrentLiability
      ) {
        operating.items.push({
          account_code: account.code,
          account_name: account.name,
          type: account.type,
          debit: totals.debit,
          credit: totals.credit,
          net: netFlow,
        });
        operating.total += netFlow;
      } else if (account.type === AccountType.ASSET) {
        investing.items.push({
          account_code: account.code,
          account_name: account.name,
          type: account.type,
          debit: totals.debit,
          credit: totals.credit,
          net: netFlow,
        });
        investing.total += netFlow;
      } else if (
        account.type === AccountType.LIABILITY ||
        account.type === AccountType.EQUITY
      ) {
        financing.items.push({
          account_code: account.code,
          account_name: account.name,
          type: account.type,
          debit: totals.debit,
          credit: totals.credit,
          net: netFlow,
        });
        financing.total += netFlow;
      }
    }

    operating.items.sort((a, b) =>
      a.account_code?.localeCompare(b.account_code),
    );
    investing.items.sort((a, b) =>
      a.account_code?.localeCompare(b.account_code),
    );
    financing.items.sort((a, b) =>
      a.account_code?.localeCompare(b.account_code),
    );

    return {
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      operating_activities: operating,
      investing_activities: investing,
      financing_activities: financing,
      net_cash_flow: operating.total + investing.total + financing.total,
    };
  }
}

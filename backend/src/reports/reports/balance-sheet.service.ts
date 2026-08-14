import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '../../accounting/entities/account.entity';
import { JournalEntry } from '../../accounting/entities/journal-entry.entity';

@Injectable()
export class BalanceSheetService {
  constructor(
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(JournalEntry)
    private journalRepo: Repository<JournalEntry>,
  ) {}

  async generate(asOfDate?: string): Promise<any> {
    const accounts = await this.accountRepo.find({ order: { code: 'ASC' } });

    const mapAccount = (account: Account) => {
      const balance = Number(account.balance) || 0;
      return { code: account.code, name: account.name, balance };
    };

    const assetAccounts = accounts.filter((a) => a.type === AccountType.ASSET);
    const liabilityAccounts = accounts.filter(
      (a) => a.type === AccountType.LIABILITY,
    );
    const equityAccounts = accounts.filter(
      (a) => a.type === AccountType.EQUITY,
    );

    const assets = assetAccounts.map((a) => mapAccount(a));
    const liabilities = liabilityAccounts.map((a) => mapAccount(a));
    const equity = equityAccounts.map((a) => mapAccount(a));

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);
    const totalEquity = equity.reduce((s, e) => s + e.balance, 0);

    return {
      as_of_date: asOfDate || new Date().toISOString().split('T')[0],
      assets: {
        items: assets.filter((a) => a.balance !== 0),
        total: totalAssets,
      },
      liabilities: {
        items: liabilities.filter((l) => l.balance !== 0),
        total: totalLiabilities,
      },
      equity: {
        items: equity.filter((e) => e.balance !== 0),
        total: totalEquity,
      },
      total_liabilities_and_equity: totalLiabilities + totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }
}

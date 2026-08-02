import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { JournalEntry } from '../entities/journal-entry.entity';

export interface ReconciliationItem {
  account_code: string;
  account_name: string;
  type: string;
  elmostafa_balance: number;
  journal_computed: number;
  difference: number;
  status: 'MATCHED' | 'DISCREPANCY' | 'NO_JOURNAL';
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(JournalEntry) private journalRepo: Repository<JournalEntry>,
  ) {}

  async reconcile(): Promise<ReconciliationItem[]> {
    const accounts = await this.accountRepo.find({ order: { code: 'ASC' } });

    const journalBalances = await this.journalRepo
      .createQueryBuilder('je')
      .select('je.account_id', 'account_id')
      .addSelect(
        `SUM(CASE 
          WHEN a.type IN ('ASSET', 'EXPENSE') THEN CAST(je.debit AS NUMERIC) - CAST(je.credit AS NUMERIC)
          ELSE CAST(je.credit AS NUMERIC) - CAST(je.debit AS NUMERIC)
        END)`,
        'computed_balance',
      )
      .innerJoin('je.account', 'a')
      .groupBy('je.account_id')
      .getRawMany();

    const balanceMap = new Map<number, number>();
    for (const row of journalBalances) {
      balanceMap.set(row.account_id, Number(row.computed_balance) || 0);
    }

    const items: ReconciliationItem[] = accounts.map((acc) => {
      const elmostafaBalance = Number(acc.balance) || 0;
      const journalComputed = balanceMap.get(acc.id) || 0;
      const diff = Math.abs(elmostafaBalance - journalComputed);

      let status: ReconciliationItem['status'] = 'MATCHED';
      if (diff > 0.01) status = 'DISCREPANCY';
      if (!balanceMap.has(acc.id)) status = 'NO_JOURNAL';

      return {
        account_code: acc.code,
        account_name: acc.name,
        type: acc.type,
        elmostafa_balance: elmostafaBalance,
        journal_computed: journalComputed,
        difference: elmostafaBalance - journalComputed,
        status,
      };
    });

    const discrepancies = items.filter((i) => i.status !== 'MATCHED');
    this.logger.log(
      `Reconciliation: ${items.length} accounts, ${discrepancies.length} discrepancies`,
    );

    return items;
  }

  async getSummary() {
    const items = await this.reconcile();
    const matched = items.filter((i) => i.status === 'MATCHED').length;
    const discrepancies = items.filter((i) => i.status === 'DISCREPANCY').length;
    const noJournal = items.filter((i) => i.status === 'NO_JOURNAL').length;
    const totalDifference = items.reduce(
      (sum, i) => sum + Math.abs(i.difference),
      0,
    );

    return {
      total_accounts: items.length,
      matched,
      discrepancies,
      no_journal: noJournal,
      total_difference: totalDifference,
      items,
    };
  }
}

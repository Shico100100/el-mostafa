import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { BankTransaction } from './entities/bank-transaction.entity';
import { BankReconciliation } from './entities/bank-reconciliation.entity';

@Injectable()
export class BankingService {
  constructor(
    @InjectRepository(BankAccount) private bankAccountRepo: Repository<BankAccount>,
    @InjectRepository(BankTransaction) private bankTxRepo: Repository<BankTransaction>,
    @InjectRepository(BankReconciliation) private reconRepo: Repository<BankReconciliation>,
  ) {}

  async findAllAccounts(): Promise<BankAccount[]> {
    return this.bankAccountRepo.find({ order: { name: 'ASC' } });
  }

  async findOneAccount(id: number): Promise<BankAccount> {
    const acc = await this.bankAccountRepo.findOne({ where: { id } });
    if (!acc) throw new NotFoundException(`Bank account #${id} not found`);
    return acc;
  }

  async createAccount(data: Partial<BankAccount>): Promise<BankAccount> {
    return this.bankAccountRepo.save(this.bankAccountRepo.create(data));
  }

  async updateAccount(id: number, data: Partial<BankAccount>): Promise<BankAccount> {
    const acc = await this.findOneAccount(id);
    Object.assign(acc, data);
    return this.bankAccountRepo.save(acc);
  }

  async getTransactions(bankAccountId: number): Promise<BankTransaction[]> {
    return this.bankTxRepo.find({ where: { bank_account_id: bankAccountId }, order: { date: 'DESC', id: 'DESC' } });
  }

  async addTransaction(bankAccountId: number, data: Partial<BankTransaction>): Promise<BankTransaction> {
    const account = await this.findOneAccount(bankAccountId);
    const tx = this.bankTxRepo.create({ ...data, bank_account_id: bankAccountId });
    const saved = await this.bankTxRepo.save(tx);

    const delta = Number(saved.debit) - Number(saved.credit);
    account.balance = Number(account.balance) + delta;
    await this.bankAccountRepo.save(account);

    return saved;
  }

  async startReconciliation(bankAccountId: number, statementDate: Date, statementBalance: number): Promise<BankReconciliation> {
    const account = await this.findOneAccount(bankAccountId);
    const recon = this.reconRepo.create({
      bank_account_id: bankAccountId,
      statement_date: statementDate,
      statement_balance: statementBalance,
      reconciled_balance: account.balance,
      difference: statementBalance - Number(account.balance),
      status: 'PENDING',
    });
    return this.reconRepo.save(recon);
  }

  async completeReconciliation(reconciliationId: number, reconciledTxIds: number[]): Promise<BankReconciliation> {
    const recon = await this.reconRepo.findOne({ where: { id: reconciliationId } });
    if (!recon) throw new NotFoundException(`Reconciliation #${reconciliationId} not found`);

    for (const txId of reconciledTxIds) {
      await this.bankTxRepo.update(txId, { is_reconciled: true, reconciliation_id: reconciliationId });
    }

    const reconciledTxs = await this.bankTxRepo.find({ where: { reconciliation_id: reconciliationId } });
    const reconciledTotal = reconciledTxs.reduce((sum, tx) => sum + Number(tx.debit) - Number(tx.credit), 0);

    const account = await this.findOneAccount(recon.bank_account_id);
    const reconciledBalance = Number(account.balance);

    recon.reconciled_balance = reconciledBalance;
    recon.difference = Math.round((Number(recon.statement_balance) - reconciledBalance) * 100) / 100;
    recon.status = 'COMPLETED';
    return this.reconRepo.save(recon);
  }

  async getStatement(bankAccountId: number): Promise<any> {
    const account = await this.findOneAccount(bankAccountId);
    const transactions = await this.getTransactions(bankAccountId);
    const totalDebits = transactions.reduce((s, t) => s + Number(t.debit), 0);
    const totalCredits = transactions.reduce((s, t) => s + Number(t.credit), 0);
    return { account, transactions, totalDebits, totalCredits, currentBalance: account.balance };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { BudgetLine } from './entities/budget-line.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { Account } from '../entities/account.entity';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget) private budgetRepo: Repository<Budget>,
    @InjectRepository(BudgetLine) private budgetLineRepo: Repository<BudgetLine>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
  ) {}

  async findAll(): Promise<Budget[]> {
    return this.budgetRepo.find({ relations: ['lines', 'lines.account'], order: { created_at: 'DESC' } });
  }

  async findOne(id: number): Promise<Budget> {
    const budget = await this.budgetRepo.findOne({ where: { id }, relations: ['lines', 'lines.account'] });
    if (!budget) throw new NotFoundException(`Budget #${id} not found`);
    return budget;
  }

  async create(dto: CreateBudgetDto): Promise<Budget> {
    const budget = this.budgetRepo.create({
      name: dto.name,
      period: dto.period,
      description: dto.description,
      status: dto.status || 'DRAFT',
    });
    const saved = await this.budgetRepo.save(budget);

    for (const line of dto.lines) {
      const budgetLine = this.budgetLineRepo.create({
        budget_id: saved.id,
        account_id: line.account_id,
        budgeted_amount: line.budgeted_amount,
        notes: line.notes,
      });
      await this.budgetLineRepo.save(budgetLine);
    }

    return this.findOne(saved.id);
  }

  async update(id: number, dto: Partial<CreateBudgetDto>): Promise<Budget> {
    const budget = await this.findOne(id);
    if (dto.name) budget.name = dto.name;
    if (dto.period) budget.period = dto.period;
    if (dto.description !== undefined) budget.description = dto.description;
    if (dto.status) budget.status = dto.status;
    await this.budgetRepo.save(budget);

    if (dto.lines) {
      await this.budgetLineRepo.delete({ budget_id: id });
      for (const line of dto.lines) {
        await this.budgetLineRepo.save(
          this.budgetLineRepo.create({ budget_id: id, account_id: line.account_id, budgeted_amount: line.budgeted_amount, notes: line.notes }),
        );
      }
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const budget = await this.findOne(id);
    await this.budgetRepo.remove(budget);
  }

  async getVariance(id: number): Promise<any> {
    const budget = await this.findOne(id);

    const lines = await Promise.all(
      budget.lines.map(async (line) => {
        const account = await this.accountRepo.findOne({ where: { id: line.account_id } });
        const actual = account ? Number(account.balance) : 0;
        const budgeted = Number(line.budgeted_amount);
        return {
          account_code: account?.code,
          account_name: account?.name,
          budgeted,
          actual,
          variance: actual - budgeted,
          variancePercent: budgeted !== 0 ? ((actual - budgeted) / budgeted * 100).toFixed(2) : '0',
        };
      }),
    );

    return {
      budget_id: budget.id,
      name: budget.name,
      period: budget.period,
      lines,
      totalBudgeted: lines.reduce((s, l) => s + l.budgeted, 0),
      totalActual: lines.reduce((s, l) => s + l.actual, 0),
    };
  }
}

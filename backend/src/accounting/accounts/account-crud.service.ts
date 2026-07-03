import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account, AccountType } from '../entities/account.entity';

@Injectable()
export class AccountCrudService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    private dataSource: DataSource,
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

    await this.dataSource.transaction(async (manager) => {
      for (const acc of systemAccounts) {
        const exists = await manager.findOne(Account, {
          where: { code: acc.code },
        });
        if (!exists) {
          await manager.save(manager.create(Account, acc));
        }
      }
    });
  }

  async getAccountByCode(code: string) {
    return this.accountRepo.findOne({ where: { code } });
  }

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
}

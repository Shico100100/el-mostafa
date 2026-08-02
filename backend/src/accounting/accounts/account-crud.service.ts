import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account, AccountType } from '../entities/account.entity';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class AccountCrudService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    private dataSource: DataSource,
    @Inject(CacheService) private cacheService: CacheService,
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

  async invalidateCache() {
    await this.cacheService.del('accounts_all');
  }

  async getAccounts() {
    const cached = await this.cacheService.get<any[]>('accounts_all');
    if (cached) return cached;
    const accounts = await this.accountRepo.find({ order: { code: 'ASC' } });
    await this.cacheService.set('accounts_all', accounts, 3600);
    return accounts;
  }

  async createAccount(data: Partial<Account>) {
    const account = this.accountRepo.create(data);
    const saved = await this.accountRepo.save(account);
    await this.cacheService.del('accounts_all');
    return saved;
  }

  async updateAccount(id: number, data: Partial<Account>) {
    await this.accountRepo.update(id, data);
    await this.cacheService.del('accounts_all');
    return this.accountRepo.findOne({ where: { id } });
  }
}

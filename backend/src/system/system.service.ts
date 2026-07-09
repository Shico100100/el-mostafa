import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../inventory/entities/category.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { Account, AccountType } from '../accounting/entities/account.entity';
import { seedDemoData as seedDemoDataFn } from './seed-data';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(private dataSource: DataSource) {}

  async resetSystem() {
    this.logger.warn('RESET START');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Truncate all tables (inside transaction for rollback safety)
      const existingTables: { table_name: string }[] =
        await queryRunner.manager.query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`,
        );
      const existingSet = new Set(existingTables.map((r) => r.table_name));
      const entities = this.dataSource.entityMetadatas;
      for (const entity of entities) {
        if (!existingSet.has(entity.tableName)) {
          this.logger.warn(`Skipping table "${entity.tableName}" — does not exist`);
          continue;
        }
        await queryRunner.manager.query(
          `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
        );
      }
      this.logger.log('Tables cleared');

      // 2. Re-seed default data

      // Seed all roles (required by user FK constraint)
      const roleRepo = queryRunner.manager.getRepository('RoleEntity');
      const allRoles = [
        { id: 1, name: 'admin' },
        { id: 2, name: 'user' },
        { id: 3, name: 'manager' },
        { id: 4, name: 'accountant' },
        { id: 5, name: 'storekeeper' },
        { id: 6, name: 'worker' },
        { id: 7, name: 'viewer' },
      ];
      for (const r of allRoles) {
        await roleRepo.save(roleRepo.create(r));
      }
      const adminRole = await roleRepo.findOneByOrFail({ id: 1 });

      // Seed all statuses (required by user FK constraint)
      const statusRepo = queryRunner.manager.getRepository('StatusEntity');
      const allStatuses = [
        { id: 1, name: 'active' },
        { id: 2, name: 'inactive' },
      ];
      for (const s of allStatuses) {
        await statusRepo.save(statusRepo.create(s));
      }
      this.logger.log('Statuses created');

      // Seed Admin User
      const userRepo = queryRunner.manager.getRepository(User);

      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('admin123', salt);
      const admin = userRepo.create({
        email: 'admin@example.com',
        password,
        role: adminRole,
      });
      await userRepo.save(admin);
      this.logger.log('Admin created');

      // Create additional admin user as requested
      const extraAdminPassword = await bcrypt.hash(
        'admin123',
        await bcrypt.genSalt(),
      );
      const extraAdmin = userRepo.create({
        email: 'admin@admin.com',
        password: extraAdminPassword,
        role: adminRole,
      });
      await userRepo.save(extraAdmin);
      this.logger.log('Extra admin created');

      // Seed Categories
      const categoryRepo = queryRunner.manager.getRepository(Category);
      const categories = ['Raw Materials', 'Finished Products', 'Spare Parts'];
      for (const name of categories) {
        await categoryRepo.save({ name, description: `Category for ${name}` });
      }
      this.logger.log('Categories created');

      // Seed Warehouses
      const warehouseRepo = queryRunner.manager.getRepository(Warehouse);
      await warehouseRepo.save({
        name: 'Main Warehouse',
        location: 'Factory Floor',
      });
      this.logger.log('Warehouse created');

      // Seed Accounts
      const accountRepo = queryRunner.manager.getRepository(Account);
      const accounts = [
        { code: '101', name: 'Cash', type: AccountType.ASSET },
        { code: '102', name: 'Bank', type: AccountType.ASSET },
        { code: '201', name: 'Accounts Payable', type: AccountType.LIABILITY },
        { code: '301', name: 'Sales Revenue', type: AccountType.REVENUE },
        { code: '401', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
      ];

      for (const acc of accounts) {
        await accountRepo.save(acc);
      }
      this.logger.log('Accounts created');

      await queryRunner.commitTransaction();
      this.logger.log('RESET DONE');
      return { message: 'System reset successfully' };
    } catch (error) {
      this.logger.error('System reset failed', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async seedDemoData() {
    return seedDemoDataFn(this.dataSource);
  }
}

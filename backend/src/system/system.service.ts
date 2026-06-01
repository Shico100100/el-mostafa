import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../inventory/entities/category.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { Account, AccountType } from '../accounting/entities/account.entity';
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
      // 1. Truncate all tables
      // We get all entity metadatas and truncate them
      const entities = this.dataSource.entityMetadatas;
      for (const entity of entities) {
        const repository = this.dataSource.getRepository(entity.name);
        await repository.query(
          `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
        );
      }
      this.logger.log('Tables cleared');

      // 2. Re-seed default data

      // Seed Admin User
      const userRepo = queryRunner.manager.getRepository(User);
      const roleRepo = queryRunner.manager.getRepository('RoleEntity');

      // Get or create admin role (role ID 1 is admin based on roles.enum.ts)
      const adminRole = await roleRepo.findOne({ where: { id: 1 } });

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
}

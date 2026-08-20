import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { seedRoles } from './roles.seed';
import { seedCurrencies } from './currencies.seed';
import { seedUsers } from './users.seed';
import { seedCategories } from './categories.seed';
import { seedWarehouses } from './warehouses.seed';
import { seedProducts } from './products.seed';
import { seedCustomers } from './customers.seed';
import { seedSuppliers } from './suppliers.seed';
import { seedMachines } from './machines.seed';
import { seedMolds } from './molds.seed';
import { seedBoms } from './boms.seed';
import { seedOrders } from './orders.seed';
import { seedStock } from './stock.seed';
import { seedProduction } from './production.seed';
import { seedCosts } from './costs.seed';
import { seedAccounting } from './accounting.seed';
import { seedAttendance } from './attendance.seed';
import { seedNotifications } from './notifications.seed';
import { seedPayments } from './payments.seed';

const logger = new Logger('SeedData');

export async function seedDemoData(dataSource: DataSource) {
  logger.log('SEED DEMO DATA START');
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await seedRoles(queryRunner);
    logger.log('Roles seeded');

    await seedCurrencies(queryRunner);
    logger.log('Currencies seeded');

    await seedUsers(queryRunner);
    logger.log('Users seeded');

    await seedCategories(queryRunner);
    logger.log('Categories seeded');

    await seedWarehouses(queryRunner);
    logger.log('Warehouses seeded');

    await seedProducts(queryRunner);
    logger.log('Products seeded');

    await seedCustomers(queryRunner);
    logger.log('Customers seeded');

    await seedSuppliers(queryRunner);
    logger.log('Suppliers seeded');

    await seedMachines(queryRunner);
    logger.log('Machines seeded');

    await seedMolds(queryRunner);
    logger.log('Molds seeded');

    await seedBoms(queryRunner);
    logger.log('BOMs seeded');

    await seedOrders(queryRunner);
    logger.log('Orders seeded');

    await seedStock(queryRunner);
    logger.log('Stock seeded');

    await seedProduction(queryRunner);
    logger.log('Production seeded');

    await seedCosts(queryRunner);
    logger.log('Costs seeded');

    await seedAccounting(queryRunner);
    logger.log('Accounting seeded');

    await seedAttendance(queryRunner);
    logger.log('Attendance seeded');

    await seedNotifications(queryRunner);
    logger.log('Notifications seeded');

    await seedPayments(queryRunner);
    logger.log('Payments seeded');

    await queryRunner.commitTransaction();
    logger.log('SEED DEMO DATA DONE');
    return { message: 'Demo data seeded successfully' };
  } catch (error) {
    logger.error('Seed demo data failed', error);
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

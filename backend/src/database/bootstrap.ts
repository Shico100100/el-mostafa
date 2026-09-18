import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { RoleEntity } from '../roles/infrastructure/persistence/relational/entities/role.entity';
import { StatusEntity } from '../statuses/infrastructure/persistence/relational/entities/status.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';

const ALL_ROLES = [
  { id: 1, name: 'admin' },
  { id: 2, name: 'user' },
  { id: 3, name: 'manager' },
  { id: 4, name: 'accountant' },
  { id: 5, name: 'storekeeper' },
  { id: 6, name: 'worker' },
  { id: 7, name: 'viewer' },
];

const ALL_STATUSES = [
  { id: 1, name: 'active' },
  { id: 2, name: 'inactive' },
];

async function firstRun(): Promise<void> {
  const ds = await AppDataSource.initialize();

  const userTable = await ds.query(
    `SELECT to_regclass('"user"') AS table_name`,
  );
  const schemaMissing = !userTable[0]?.table_name;

  if (schemaMissing) {
    await ds.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await ds.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await ds.synchronize();
    console.log('[bootstrap] schema created from entities');
    if (process.env.BOOTSTRAP_FRESH_MARKER) {
      await import('fs').then((fs) =>
        fs.promises.writeFile(process.env.BOOTSTRAP_FRESH_MARKER!, '1'),
      );
    }
  }

  const roleRepo = ds.getRepository(RoleEntity);
  const statusRepo = ds.getRepository(StatusEntity);
  const userRepo = ds.getRepository(UserEntity);

  for (const role of ALL_ROLES) {
    const exists = await roleRepo.findOneBy({ id: role.id });
    if (!exists) await roleRepo.insert(role);
  }
  for (const status of ALL_STATUSES) {
    const exists = await statusRepo.findOneBy({ id: status.id });
    if (!exists) await statusRepo.insert(status);
  }

  const userCount = await userRepo.count();
  if (userCount === 0) {
    const adminRole = await roleRepo.findOneByOrFail({ id: 1 });
    const activeStatus = await statusRepo.findOneByOrFail({ id: 1 });
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash('admin123', salt);
    const admin = await userRepo.save(
      userRepo.create({
        email: 'admin@admin.com',
        password,
        role: adminRole,
        status: activeStatus,
      }),
    );
    console.log(`[bootstrap] created initial admin user id=${admin.id}`);
  }

  await ds.destroy();
  console.log('[bootstrap] done');
}

firstRun().catch((error) => {
  console.error('[bootstrap] failed', error);
  process.exit(1);
});
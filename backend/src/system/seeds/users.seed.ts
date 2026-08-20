import { QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { insertIgnore } from './helpers';

export async function seedUsers(qr: QueryRunner) {
  const hash = await bcrypt.hash('admin123', await bcrypt.genSalt());
  await insertIgnore(qr, 'user', [
    {
      id: 1,
      email: 'admin@admin.com',
      password: hash,
      provider: 'email',
      firstName: 'مدير',
      lastName: 'النظام',
      roleId: 1,
      statusId: 1,
    },
    {
      id: 2,
      email: 'admin@example.com',
      password: hash,
      provider: 'email',
      firstName: 'Admin',
      lastName: 'User',
      roleId: 1,
      statusId: 1,
    },
  ]);

  const managerPassword = await bcrypt.hash(
    'admin123',
    await bcrypt.genSalt(),
  );
  const workerPassword = managerPassword;
  const viewerPassword = managerPassword;

  await insertIgnore(qr, 'user', [
    {
      id: 3,
      email: 'manager@admin.com',
      password: managerPassword,
      provider: 'email',
      firstName: 'Manager',
      lastName: 'Account',
      roleId: 3,
      statusId: 1,
    },
    {
      id: 4,
      email: 'worker@admin.com',
      password: workerPassword,
      provider: 'email',
      firstName: 'Worker',
      lastName: 'Account',
      roleId: 6,
      statusId: 1,
    },
    {
      id: 5,
      email: 'viewer@admin.com',
      password: viewerPassword,
      provider: 'email',
      firstName: 'Viewer',
      lastName: 'Account',
      roleId: 7,
      statusId: 1,
    },
  ]);
}

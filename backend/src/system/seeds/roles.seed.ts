import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedRoles(qr: QueryRunner) {
  await insertIgnore(qr, 'role', [
    { id: 1, name: 'admin' },
    { id: 2, name: 'user' },
    { id: 3, name: 'manager' },
    { id: 4, name: 'accountant' },
    { id: 5, name: 'storekeeper' },
    { id: 6, name: 'worker' },
    { id: 7, name: 'viewer' },
  ]);

  await insertIgnore(qr, 'status', [
    { id: 1, name: 'active' },
    { id: 2, name: 'inactive' },
  ]);
}

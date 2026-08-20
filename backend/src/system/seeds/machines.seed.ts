import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedMachines(qr: QueryRunner) {
  await insertIgnore(qr, 'machines', [
    {
      id: 1,
      name: 'Injection Molding Machine 200T',
      serial_number: 'IM-200-001',
      purchase_date: '2024-01-15',
      status: 'ACTIVE',
      last_maintenance: '2026-05-01',
      next_maintenance: '2026-07-01',
      maintenance_interval_days: 60,
      total_hours: 4500,
      power_consumption: 75,
      price: 450000,
      useful_life_years: 10,
      notes: 'ماكينة حقن 200 طن',
    },
    {
      id: 2,
      name: 'Blow Molding Machine 100T',
      serial_number: 'BM-100-001',
      purchase_date: '2024-03-20',
      status: 'ACTIVE',
      last_maintenance: '2026-04-15',
      next_maintenance: '2026-06-15',
      maintenance_interval_days: 60,
      total_hours: 3200,
      power_consumption: 55,
      price: 320000,
      useful_life_years: 8,
      notes: 'ماكينة نفخ 100 طن',
    },
    {
      id: 3,
      name: 'Extrusion Line',
      serial_number: 'EL-001',
      purchase_date: '2024-06-01',
      status: 'ACTIVE',
      last_maintenance: '2026-05-20',
      next_maintenance: '2026-08-20',
      maintenance_interval_days: 90,
      total_hours: 2800,
      power_consumption: 90,
      price: 550000,
      useful_life_years: 12,
      notes: 'خط بثق',
    },
  ]);
}

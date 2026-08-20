import { QueryRunner } from 'typeorm';
import { insertIgnore } from './helpers';

export async function seedAttendance(qr: QueryRunner) {
  await insertIgnore(qr, 'attendance', [
    {
      id: 1,
      user_id: 1,
      date: '2026-05-20',
      status: 'PRESENT',
      check_in: '07:00',
      check_out: '15:00',
      notes: 'حضور عادي',
    },
    {
      id: 2,
      user_id: 1,
      date: '2026-05-21',
      status: 'PRESENT',
      check_in: '07:15',
      check_out: '15:00',
      notes: 'تأخير 15 دقيقة',
    },
    {
      id: 3,
      user_id: 1,
      date: '2026-05-22',
      status: 'ABSENT',
      notes: 'إجازة مرضية',
    },
  ]);
}

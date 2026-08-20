import { DataSource } from 'typeorm';
import { seedDemoData as _seedDemoData } from './seeds/index';

export async function seedDemoData(dataSource: DataSource) {
  return _seedDemoData(dataSource);
}

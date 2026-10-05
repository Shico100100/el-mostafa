import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../inventory/entities/category.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { Account, AccountType } from '../accounting/entities/account.entity';
import { seedDemoData as seedDemoDataFn } from './seed-data';
import * as bcrypt from 'bcryptjs';
import { exec } from 'child_process';
import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = util.promisify(exec);

const GITHUB_REPO = 'Shico100100/el-mostafa';
const GITHUB_RELEASES_LATEST_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const CACHE_TTL_MS = 10 * 60 * 1000;

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
          this.logger.warn(
            `Skipping table "${entity.tableName}" — does not exist`,
          );
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

  private updateCache: { ts: number; data: UpdateCheckResult } | null = null;

  async checkForUpdates(force = false): Promise<UpdateCheckResult> {
    const currentVersion = process.env.APP_VERSION || 'dev';
    if (
      !force &&
      this.updateCache &&
      Date.now() - this.updateCache.ts < CACHE_TTL_MS
    ) {
      return { ...this.updateCache.data, currentVersion };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(GITHUB_RELEASES_LATEST_URL, {
        headers: {
          'User-Agent': 'el-mostafa-erp',
          Accept: 'application/vnd.github+json',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`GitHub API responded ${res.status}`);
      }

      const release = await res.json();
      const latestVersion =
        typeof release?.tag_name === 'string' ? release.tag_name : '';
      const updateAvailable =
        currentVersion !== 'dev' &&
        latestVersion !== '' &&
        isVersionNewer(latestVersion, currentVersion);

      const data: UpdateCheckResult = {
        currentVersion,
        latestVersion,
        updateAvailable,
        releaseUrl:
          typeof release?.html_url === 'string' ? release.html_url : null,
        changelog:
          typeof release?.body === 'string' ? release.body.slice(0, 2000) : '',
        publishedAt:
          typeof release?.published_at === 'string'
            ? release.published_at
            : null,
        checkedAt: new Date().toISOString(),
        checkFailed: false,
      };
      this.updateCache = { ts: Date.now(), data };
      return data;
    } catch (error) {
      this.logger.error('Update check failed:', error);
      return {
        currentVersion,
        latestVersion: this.updateCache?.data.latestVersion ?? null,
        updateAvailable: false,
        releaseUrl: this.updateCache?.data.releaseUrl ?? null,
        changelog: this.updateCache?.data.changelog ?? '',
        publishedAt: this.updateCache?.data.publishedAt ?? null,
        checkedAt: new Date().toISOString(),
        checkFailed: true,
      };
    }
  }

  async triggerUpdate() {
    const dockerSocket = '/var/run/docker.sock';
    if (!fs.existsSync(dockerSocket)) {
      throw new Error(
        'مقبس Docker غير متاح — تأكد من وجود /var/run/docker.sock داخل الحاوية',
      );
    }

    const composeDir = process.env.UPDATE_COMPOSE_DIR || '/host/app';
    const composeFile = path.join(composeDir, 'docker-compose.yml');
    if (!fs.existsSync(composeFile)) {
      throw new Error(
        `ملف docker-compose.yml غير موجود على المسار: ${composeDir}`,
      );
    }

    const namespace =
      process.env.UPDATE_GHCR_NAMESPACE || 'ghcr.io/shico100100/el-mostafa';

    await execPromise('docker version --format "{{.Server.Version}}"', {
      timeout: 15000,
    });

    const pullTag = async (service: string) => {
      const remote = `${namespace}/${service}:latest`;
      const local = `elmostafa-${service}:prod`;
      this.logger.log(`Pulling ${remote}`);
      await execPromise(`docker pull ${remote}`, {
        timeout: 300000,
        maxBuffer: 10 * 1024 * 1024,
      });
      this.logger.log(`Tagging ${local}`);
      await execPromise(`docker tag ${remote} ${local}`, { timeout: 30000 });
    };

    await pullTag('backend');
    await pullTag('frontend');

    const run =
      `docker run -d --rm --name elmostafa-updater ` +
      `-e UPDATE_COMPOSE_DIR=${composeDir} ` +
      `-v /var/run/docker.sock:/var/run/docker.sock ` +
      `-v ${composeDir}:${composeDir}:ro ` +
      `--workdir ${composeDir} ` +
      `elmostafa-backend:prod ` +
      `node /opt/update.mjs`;

    this.logger.log('Spawning updater container');
    const { stdout, stderr } = await execPromise(run, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr) {
      this.logger.warn('Updater spawn stderr:', stderr);
    }

    return {
      started: true,
      updater: stdout.trim(),
      message: 'تم بدء الترقية، سيعاد تشغيل النظام خلال لحظات',
    };
  }
}

function parseVersion(v: string): number[] {
  const clean = v.replace(/^v/i, '').trim();
  return clean.split('.').map((part) => parseInt(part, 10) || 0);
}

function isVersionNewer(a: string, b: string): boolean {
  const A = parseVersion(a);
  const B = parseVersion(b);
  const len = Math.max(A.length, B.length);
  for (let i = 0; i < len; i++) {
    const aN = A[i] || 0;
    const bN = B[i] || 0;
    if (aN > bN) return true;
    if (aN < bN) return false;
  }
  return false;
}

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  changelog: string;
  publishedAt: string | null;
  checkedAt: string;
  checkFailed: boolean;
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import type { AllConfigType } from '../config/config.type';

const execPromise = util.promisify(exec);

@Injectable()
export class BackupSchedulerService {
  private readonly logger = new Logger(BackupSchedulerService.name);
  private readonly backupDir: string;
  private readonly retentionDays = 60;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.backupDir = path.join(process.cwd(), '..', 'backups');
  }

  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async handleDailyBackup() {
    this.logger.log('Starting scheduled daily backup...');
    try {
      await this.createBackup();
      await this.cleanupOldBackups();
      this.logger.log('Scheduled backup completed successfully.');
    } catch (error) {
      this.logger.error('Scheduled backup failed:', error);
    }
  }

  private async createBackup() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const date = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    const dbName = this.configService.getOrThrow('database.name', {
      infer: true,
    });
    const backupFile = path.join(this.backupDir, `${dbName}-${date}.sql`);

    const containerName = 'backend-postgres-1';
    const dbUser = this.configService.getOrThrow('database.username', {
      infer: true,
    });
    const dbPass = this.configService.getOrThrow('database.password', {
      infer: true,
    });

    // Use docker exec for pg_dump (no host pg_dump needed)
    const dumpCommand = `docker exec ${containerName} pg_dump -U ${dbUser} ${dbName}`;
    const env = { ...process.env, PGPASSWORD: dbPass };

    const { stdout } = await execPromise(dumpCommand, {
      maxBuffer: 50 * 1024 * 1024,
      env,
    });

    fs.writeFileSync(backupFile, stdout, 'utf-8');
    this.logger.log(
      `Backup saved: ${backupFile} (${(stdout.length / 1024 / 1024).toFixed(2)} MB)`,
    );
  }

  private cleanupOldBackups() {
    if (!fs.existsSync(this.backupDir)) return;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    const dbName = this.configService.getOrThrow('database.name', {
      infer: true,
    });
    let deleted = 0;

    for (const file of fs.readdirSync(this.backupDir)) {
      if (!file.startsWith(dbName) || !file.endsWith('.sql')) continue;
      const filePath = path.join(this.backupDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtime < cutoff) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }

    if (deleted > 0) {
      this.logger.log(
        `Cleaned up ${deleted} old backup(s) (retention: ${this.retentionDays} days)`,
      );
    }
  }
}

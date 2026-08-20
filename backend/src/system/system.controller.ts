import {
  Controller,
  Post,
  Body,
  UseGuards,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { exec } from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execPromise = util.promisify(exec);

function getPgDumpPath(): string {
  // On Windows, check common install paths
  if (process.platform === 'win32') {
    for (const pgDir of ['18', '17', '16', '15', '14']) {
      const p = `C:\\Program Files\\PostgreSQL\\${pgDir}\\bin\\pg_dump.exe`;
      if (fs.existsSync(p)) return `"${p}"`;
    }
  }
  return 'pg_dump';
}

function sanitizeDbName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '');
}

function getPsqlPath(): string {
  if (process.platform === 'win32') {
    for (const pgDir of ['18', '17', '16', '15', '14']) {
      const p = `C:\\Program Files\\PostgreSQL\\${pgDir}\\bin\\psql.exe`;
      if (fs.existsSync(p)) return `"${p}"`;
    }
  }
  return 'psql';
}

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin)
export class SystemController {
  private readonly logger = new Logger(SystemController.name);

  constructor(private readonly systemService: SystemService) {}

  @Post('backup')
  async createBackup() {
    try {
      // Ensure backup directory exists
      const backupDir = path.join(process.cwd(), '..', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Build backup file name
      const date = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
      const rawDbName = process.env.DATABASE_NAME || 'db';
      const dbName = sanitizeDbName(rawDbName);
      const backupFile = path.join(backupDir, `${dbName}-${date}.sql`);

      // Construct pg_dump command
      const pgPassword = process.env.DATABASE_PASSWORD || '';
      const pgUser = process.env.DATABASE_USERNAME || 'postgres';
      const pgHost = process.env.DATABASE_HOST || 'localhost';
      const pgPort = process.env.DATABASE_PORT || '5432';

      // Use environment variable for password
      const env = { ...process.env, PGPASSWORD: pgPassword };

      const pgDump = getPgDumpPath();
      const dumpCommand = `${pgDump} -U ${pgUser} -h ${pgHost} -p ${pgPort} ${dbName} > "${backupFile}"`;

      const { stdout, stderr } = await execPromise(dumpCommand, {
        cwd: process.cwd() + '/..',
        maxBuffer: 10 * 1024 * 1024,
        env,
      });

      if (stderr) {
        this.logger.warn('Backup command stderr:', stderr);
      }

      this.logger.log('Backup command stdout:', stdout);
      return { message: 'Backup created successfully', details: stdout };
    } catch (error) {
      this.logger.error('Backup failed:', error);
      const err = error as Error;
      const message =
        typeof err?.message === 'string' ? err.message : String(err);
      throw new InternalServerErrorException(`Backup failed: ${message}`);
    }
  }

  @Post('reset')
  async resetSystem(@Body() body: { confirm?: boolean }) {
    if (body?.confirm !== true) {
      throw new BadRequestException(
        'Send { "confirm": true } to confirm system reset',
      );
    }
    return this.systemService.resetSystem();
  }

  @Post('seed')
  async seedDemoData(@Body() body: { confirm?: boolean }) {
    if (body?.confirm !== true) {
      throw new BadRequestException(
        'Send { "confirm": true } to confirm seeding demo data',
      );
    }
    return this.systemService.seedDemoData();
  }

  @Post('restore')
  @UseInterceptors(FileInterceptor('file'))
  async restoreBackup(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const tempPath = path.join(
      process.cwd(),
      '..',
      'backups',
      `restore_${Date.now()}.sql`,
    );

    try {
      // Ensure backups directory exists
      const backupDir = path.join(process.cwd(), '..', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Save the uploaded file temporarily
      fs.writeFileSync(tempPath, file.buffer);

      // Prepare DB connection parameters
      const pgPassword = process.env.DATABASE_PASSWORD || '';
      const pgUser = process.env.DATABASE_USERNAME || 'postgres';
      const pgHost = process.env.DATABASE_HOST || 'localhost';
      const pgPort = process.env.DATABASE_PORT || '5432';
      const rawDbName = process.env.DATABASE_NAME || 'elmostafa_db';
      const dbName = sanitizeDbName(rawDbName);
      const env = { ...process.env, PGPASSWORD: pgPassword };

      const psql = getPsqlPath();

      // Terminate connections before dropping
      const termCmd = `${psql} -U ${pgUser} -h ${pgHost} -p ${pgPort} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`;
      await execPromise(termCmd, { env }).catch(() => {});

      // Drop existing database
      const dropCmd = `${psql} -U ${pgUser} -h ${pgHost} -p ${pgPort} -d postgres -c "DROP DATABASE IF EXISTS \\"${dbName}\\";"`;
      await execPromise(dropCmd, { env });
      await execPromise(dropCmd, { env });

      // Create new database
      const createCmd = `${psql} -U ${pgUser} -h ${pgHost} -p ${pgPort} -d postgres -c "CREATE DATABASE \\"${dbName}\\";"`;
      await execPromise(createCmd, { env });

      // Restore from backup file
      const restoreCmd = `${psql} -U ${pgUser} -h ${pgHost} -p ${pgPort} -d ${dbName} -f "${tempPath}"`;
      const { stdout, stderr } = await execPromise(restoreCmd, { env });

      if (stderr) {
        this.logger.warn('Restore command stderr:', stderr);
      }

      this.logger.log('Restore command stdout:', stdout);

      // Clean up the temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      return { message: 'Restoration completed successfully', details: stdout };
    } catch (error) {
      this.logger.error('Restoration failed:', error);
      // Clean up the temp file even on error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      const err = error as Error;
      const message =
        typeof err?.message === 'string' ? err.message : String(err);
      throw new InternalServerErrorException(`Restoration failed: ${message}`);
    }
  }
}

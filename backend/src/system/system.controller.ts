import {
  Controller,
  Post,
  UseGuards,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin)
export class SystemController {
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
      const backupFile = path.join(
        backupDir,
        `${process.env.DATABASE_NAME || 'db'}-${date}.sql`,
      );

      // Construct pg_dump command
      const pgPassword = process.env.DATABASE_PASSWORD || '';
      const pgUser = process.env.DATABASE_USERNAME || 'postgres';
      const pgHost = process.env.DATABASE_HOST || 'localhost';
      const pgPort = process.env.DATABASE_PORT || '5432';
      const dbName = process.env.DATABASE_NAME || 'elmostafa_db';

      // Use environment variable for password
      const env = { ...process.env, PGPASSWORD: pgPassword };

      const dumpCommand = `pg_dump -U ${pgUser} -h ${pgHost} -p ${pgPort} ${dbName} > "${backupFile}"`;

      const { stdout, stderr } = await execPromise(dumpCommand, {
        cwd: process.cwd() + '/..',
        maxBuffer: 10 * 1024 * 1024,
        env,
      });

      if (stderr) {
        console.warn('Backup command stderr:', stderr);
      }

      console.log('Backup command stdout:', stdout);
      return { message: 'Backup created successfully', details: stdout };
    } catch (error) {
      console.error('Backup failed:', error);
      const err = error as any;
      const message =
        typeof err?.message === 'string' ? err.message : String(err);
      throw new InternalServerErrorException(`Backup failed: ${message}`);
    }
  }

  @Post('reset')
  async resetSystem() {
    return this.systemService.resetSystem();
  }

  @Post('restore')
  @UseInterceptors(FileInterceptor('file'))
  async restoreBackup(@UploadedFile() file: any) {
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
      const dbName = process.env.DATABASE_NAME || 'elmostafa_db';
      const env = { ...process.env, PGPASSWORD: pgPassword };

      // Drop existing database
      const dropCmd = `psql -U ${pgUser} -h ${pgHost} -p ${pgPort} -d postgres -c "DROP DATABASE IF EXISTS \\"${dbName}\\";"`;
      await execPromise(dropCmd, { env });

      // Create new database
      const createCmd = `psql -U ${pgUser} -h ${pgHost} -p ${pgPort} -d postgres -c "CREATE DATABASE \\"${dbName}\\";"`;
      await execPromise(createCmd, { env });

      // Restore from backup file
      const restoreCmd = `psql -U ${pgUser} -h ${pgHost} -p ${pgPort} -d ${dbName} -f "${tempPath}"`;
      const { stdout, stderr } = await execPromise(restoreCmd, { env });

      if (stderr) {
        console.warn('Restore command stderr:', stderr);
      }

      console.log('Restore command stdout:', stdout);

      // Clean up the temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      return { message: 'Restoration completed successfully', details: stdout };
    } catch (error) {
      console.error('Restoration failed:', error);
      // Clean up the temp file even on error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      const err = error as any;
      const message =
        typeof err?.message === 'string' ? err.message : String(err);
      throw new InternalServerErrorException(`Restoration failed: ${message}`);
    }
  }
}

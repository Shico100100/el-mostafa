import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env before anything else
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { MailerService } from '../src/mailer/mailer.service';
import validationOptions from '../src/utils/validation-options';

async function seedTestBasics(dataSource: DataSource): Promise<void> {
  const qr = dataSource.createQueryRunner();
  await qr.connect();

  try {
    const tableExists: any[] = await qr.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'role' LIMIT 1`,
    );
    if (!tableExists?.length) return;

    const roleCount: any[] = await qr.query(
      `SELECT COUNT(*)::int AS cnt FROM "role"`,
    );
    if (roleCount[0].cnt === 0) {
      await qr.query(`INSERT INTO "role" (id, name) VALUES
        (1,'admin'),(2,'user'),(3,'manager'),(4,'accountant'),
        (5,'storekeeper'),(6,'worker'),(7,'viewer')
        ON CONFLICT (id) DO NOTHING`);
    }

    const statusCount: any[] = await qr.query(
      `SELECT COUNT(*)::int AS cnt FROM "status"`,
    );
    if (statusCount[0].cnt === 0) {
      await qr.query(`INSERT INTO "status" (id, name) VALUES
        (1,'active'),(2,'inactive')
        ON CONFLICT (id) DO NOTHING`);
    }

    const userCount: any[] = await qr.query(
      `SELECT COUNT(*)::int AS cnt FROM "user"`,
    );
    if (userCount[0].cnt === 0) {
      const bcrypt = await import('bcryptjs');
      const hash = await bcrypt.hash('admin123', 10);
      await qr.query(
        `INSERT INTO "user" (id, email, password, provider, "firstName", "lastName", "roleId", "statusId")
         VALUES (1, 'admin@admin.com', $1, 'email', 'Admin', 'User', 1, 1)
         ON CONFLICT DO NOTHING`,
        [hash],
      );
    }

    const maxUser: any[] = await qr.query(
      `SELECT COALESCE(MAX(id), 0) AS mx FROM "user"`,
    );
    const nextId = (maxUser[0]?.mx ?? 0) + 1;
    const seqRows: any[] = await qr.query(
      `SELECT pg_get_serial_sequence('user', 'id') AS seqname`,
    );
    if (seqRows[0]?.seqname) {
      await qr.query(`SELECT setval($1::regclass, $2)`, [
        seqRows[0].seqname,
        nextId,
      ]);
    }
  } finally {
    await qr.release();
  }
}

export async function createTestApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MailerService)
    .useValue({ sendMail: async () => {} })
    .compile();

  const app = module.createNestApplication();

  // Mirror main.ts setup
  app.setGlobalPrefix(process.env.API_PREFIX || 'api', {
    exclude: ['/'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.init();

  const ds = app.get(DataSource);
  await seedTestBasics(ds);

  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    try {
      const ds = app.get(DataSource);
      await app.close();
      if (ds?.isInitialized) {
        await ds.destroy();
      }
    } catch {
      try {
        await app.close();
      } catch {}
    }
  }
}

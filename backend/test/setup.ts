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
import { AppModule } from '../src/app.module';
import { MailerService } from '../src/mailer/mailer.service';
import validationOptions from '../src/utils/validation-options';

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
  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}

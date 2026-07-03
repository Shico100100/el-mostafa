import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { join } from 'path';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import { AllExceptionsFilter } from './utils/exception-filter';
import { RouteAliasesMiddleware } from './route-aliases.middleware';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const frontendDomain = process.env.FRONTEND_DOMAIN;
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: frontendDomain ? frontendDomain.split(',') : ['http://localhost:3000'],
      credentials: true,
    },
    logger: ['error', 'warn'],
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(new RouteAliasesMiddleware().use);

  setupSwagger(app);

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();

import { Module } from '@nestjs/common';
import { SentryInterceptor } from './sentry.interceptor';

@Module({
  providers: [SentryInterceptor],
  exports: [SentryInterceptor],
})
export class SentryModule {}

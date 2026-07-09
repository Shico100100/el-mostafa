import { Module, NestModule, MiddlewareConsumer, Global } from '@nestjs/common';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { TransactionHelper } from './transaction.helper';

@Global()
@Module({
  providers: [RateLimitGuard, TransactionHelper],
  exports: [RateLimitGuard, TransactionHelper],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}

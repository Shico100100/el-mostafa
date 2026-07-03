import { Module, Global } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsInterceptor],
  exports: [MetricsInterceptor],
})
export class MetricsModule {}

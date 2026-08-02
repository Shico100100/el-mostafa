import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodCloseService } from './period-close.service';
import { PeriodCloseController } from './period-close.controller';
import { PeriodClose } from './entities/period-close.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodClose])],
  controllers: [PeriodCloseController],
  providers: [PeriodCloseService],
  exports: [PeriodCloseService],
})
export class PeriodCloseModule {}

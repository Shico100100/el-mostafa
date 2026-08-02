import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerialNumberService } from './serial-number.service';
import { SerialNumberController } from './serial-number.controller';
import { SerialNumber } from '../entities/serial-number.entity';
import { Product } from '../entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SerialNumber, Product])],
  controllers: [SerialNumberController],
  providers: [SerialNumberService],
  exports: [SerialNumberService],
})
export class SerialNumberModule {}

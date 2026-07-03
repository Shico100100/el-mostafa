import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleStatus, Shift } from '../entities/production-schedule.entity';

export class CreateProductionScheduleDto {
  @ApiProperty({ example: '2026-06-21' })
  @Type(() => Date)
  @IsNotEmpty()
  planned_date: Date;

  @ApiProperty({ enum: Shift })
  @IsEnum(Shift)
  shift: Shift;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  machine_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  mold_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ example: 5000.0 })
  @IsNumber()
  @Min(0)
  target_quantity: number;

  @ApiPropertyOptional({
    enum: ScheduleStatus,
    default: ScheduleStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

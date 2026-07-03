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
import {
  MaintenanceType,
  MaintenanceStatus,
} from '../entities/machine-maintenance.entity';

export class CreateMaintenanceDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  machine_id: number;

  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: '2026-06-21' })
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ example: 'صيانة دورية' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 2000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    enum: MaintenanceStatus,
    default: MaintenanceStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

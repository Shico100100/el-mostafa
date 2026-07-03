import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRangeProductionDto {
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

  @ApiProperty({ example: '2026-06-01' })
  @IsString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsString()
  @IsNotEmpty()
  end_date: string;

  @ApiProperty({ example: 5000.0 })
  @IsNumber()
  @Min(0)
  total_production_kg: number;

  @ApiProperty({ example: 'sum' })
  @IsIn(['sum', 'distribute'])
  mode: 'sum' | 'distribute';

  @ApiPropertyOptional({ example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hours_worked?: number;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

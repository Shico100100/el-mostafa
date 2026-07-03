import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { FixedCostCategory } from '../entities/fixed-cost.entity';

export class CreateFixedCostDto {
  @ApiProperty({ example: '2026-06' })
  @IsString()
  @IsNotEmpty()
  month: string;

  @ApiPropertyOptional({
    enum: FixedCostCategory,
    default: FixedCostCategory.OTHER,
  })
  @IsOptional()
  @IsEnum(FixedCostCategory)
  category?: FixedCostCategory;

  @ApiProperty({ example: 15000.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

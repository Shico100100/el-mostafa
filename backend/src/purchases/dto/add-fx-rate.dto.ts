import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AddFxRateDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  currency_id: number;

  @ApiProperty({ example: 30.5 })
  @IsNumber()
  @Min(0)
  rate_to_egp: number;

  @ApiPropertyOptional({ example: 1000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_paid?: number;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '2026-06-21' })
  @IsDateString()
  @IsNotEmpty()
  rate_date: string;
}

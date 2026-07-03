import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  warehouse_id: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  new_quantity: number;

  @ApiPropertyOptional({ example: 'تعديل يدوي' })
  @IsOptional()
  @IsString()
  notes?: string;
}

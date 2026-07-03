import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseReturnItemDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiProperty({ example: 105.0 })
  @IsNumber()
  @Min(0)
  total: number;
}

export class CreatePurchaseReturnDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  supplier_id: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  order_id?: number;

  @ApiProperty({ example: 105.0 })
  @IsNumber()
  @Min(0)
  total_amount: number;

  @ApiPropertyOptional({ example: '2026-06-21' })
  @IsOptional()
  @IsDateString()
  return_date?: string;

  @ApiPropertyOptional({ example: 'تلف أو عيب' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ type: [CreatePurchaseReturnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseReturnItemDto)
  items: CreatePurchaseReturnItemDto[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class BulkUpdatePricesDto {
  @ApiPropertyOptional({ example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  productIds?: number[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ example: 'RAW' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: 'cost_price' })
  @IsIn(['cost_price', 'selling_price'])
  priceField: 'cost_price' | 'selling_price';

  @ApiProperty({ example: 'percentage' })
  @IsIn(['percentage', 'fixed'])
  updateType: 'percentage' | 'fixed';

  @ApiProperty({ example: 10.0 })
  @IsNumber()
  value: number;
}

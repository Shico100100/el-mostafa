import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateManufacturingStockMovementDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  rawMaterialId: number;

  @ApiProperty({ example: 'IN' })
  @IsIn(['IN', 'OUT'])
  type: 'IN' | 'OUT';

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: '2026-06-21' })
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @ApiPropertyOptional({ example: 'مرجع' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

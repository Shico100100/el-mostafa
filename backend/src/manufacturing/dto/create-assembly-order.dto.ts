import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssemblyOrderDto {
  @ApiProperty({ example: '2026-06-21' })
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  bom_id: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  worker_id?: number;

  @ApiPropertyOptional({ example: 5000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_cost?: number;

  @ApiPropertyOptional({ example: 'COMPLETED' })
  @IsOptional()
  @IsString()
  status?: string;
}

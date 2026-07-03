import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MoldStatus } from '../entities/mold.entity';

export class CreateMoldDto {
  @ApiProperty({ example: 'قالب زجاجة' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  product_id?: number;

  @ApiProperty({ example: 25.5 })
  @IsNumber()
  @Min(0)
  product_weight: number;

  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(1)
  cavities: number;

  @ApiPropertyOptional({ enum: MoldStatus, default: MoldStatus.GOOD })
  @IsOptional()
  @IsEnum(MoldStatus)
  status?: MoldStatus;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  current_shots?: number;

  @ApiPropertyOptional({ example: 100000.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_shots?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_production_cycles?: number;

  @ApiPropertyOptional({ example: 'new' })
  @IsOptional()
  @IsString()
  life_cycle_status?: string;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

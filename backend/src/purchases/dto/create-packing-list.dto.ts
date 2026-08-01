import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePackingListDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  container_id?: number;

  @ApiProperty({ example: 40.0 })
  @IsNumber()
  @Min(0)
  carton_length_cm: number;

  @ApiProperty({ example: 30.0 })
  @IsNumber()
  @Min(0)
  carton_width_cm: number;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  @Min(0)
  carton_height_cm: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  cartons_count: number;

  @ApiPropertyOptional({ example: 3.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_cbm?: number;

  @ApiPropertyOptional({ example: 1500.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actual_net_weight_kg?: number;

  @ApiPropertyOptional({ example: 1600.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actual_gross_weight_kg?: number;

  @ApiPropertyOptional({ example: 5.0, default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deviation_threshold_percent?: number;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

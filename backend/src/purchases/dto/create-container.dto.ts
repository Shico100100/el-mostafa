import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateContainerDto {
  @ApiProperty({ example: 'حاوية 20 قدم' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 589.0 })
  @IsNumber()
  @Min(0)
  length_cm: number;

  @ApiProperty({ example: 235.0 })
  @IsNumber()
  @Min(0)
  width_cm: number;

  @ApiProperty({ example: 239.0 })
  @IsNumber()
  @Min(0)
  height_cm: number;

  @ApiProperty({ example: 28000.0 })
  @IsNumber()
  @Min(0)
  max_weight_kg: number;

  @ApiPropertyOptional({ example: 33.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_cbm?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;
}

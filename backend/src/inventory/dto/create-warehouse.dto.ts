import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateWarehouseDto {
  @ApiPropertyOptional({ example: 'مستودع رئيسي' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'المنطقة الصناعية' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiPropertyOptional({ example: 'مواد خام' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'وصف التصنيف' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  parent_id?: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AssembleProductDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(1000000)
  quantity: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  warehouse_id?: number;
}

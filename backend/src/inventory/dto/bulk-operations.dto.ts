import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  IsInt,
  Min,
} from 'class-validator';

export class BulkDeleteDto {
  @ApiProperty({ example: [1, 2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];
}

export class BulkAssignCategoryDto {
  @ApiProperty({ example: [1, 2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  category_id: number;
}

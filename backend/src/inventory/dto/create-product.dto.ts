import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// NOTE: sku/barcode were removed from the API surface (unused by the
// business) but their columns stay in the products table: the Peachtree
// sync matches products by SKU, and the Excel import/export plus the search
// read them. Do not drop the columns without migrating the sync first.
export class CreateProductDto {
  @ApiProperty({ example: 'منتج أ' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 10.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost_price?: number;

  @ApiPropertyOptional({ example: 25.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  selling_price?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  category_id?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  warehouse_id?: number;

  @ApiPropertyOptional({ example: 'piece' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 'FINISHED' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'وصف المنتج' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_stock?: number;

  @ApiPropertyOptional({ example: 500.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight_grams?: number;

  @ApiPropertyOptional({ example: 'uploads/image.png' })
  @IsOptional()
  @IsString()
  image_path?: string;

  @ApiPropertyOptional({ example: 'PLASTIC' })
  @IsOptional()
  @IsString()
  raw_material_type?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initial_stock?: number;
}

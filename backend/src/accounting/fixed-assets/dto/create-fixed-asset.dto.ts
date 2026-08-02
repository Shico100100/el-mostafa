import { IsString, IsNumber, IsDateString, IsOptional, IsIn, IsEnum } from 'class-validator';
import { DepreciationMethod } from '../entities/fixed-asset.entity';

export class CreateFixedAssetDto {
  @IsString() name: string;
  @IsString() asset_code: string;
  @IsOptional() @IsString() category?: string;
  @IsDateString() purchase_date: string;
  @IsNumber() purchase_cost: number;
  @IsOptional() @IsNumber() salvage_value?: number;
  @IsNumber() useful_life_years: number;
  @IsOptional() @IsEnum(DepreciationMethod) depreciation_method?: DepreciationMethod;
  @IsOptional() @IsString() notes?: string;
}

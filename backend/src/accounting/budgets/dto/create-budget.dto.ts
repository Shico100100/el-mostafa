import { IsString, IsArray, ValidateNested, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class BudgetLineDto {
  @IsNumber()
  account_id: number;

  @IsNumber()
  budgeted_amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBudgetDto {
  @IsString()
  name: string;

  @IsString()
  period: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  lines: BudgetLineDto[];
}

import {
  IsNumber,
  IsDateString,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateTimeEntryDto {
  @IsNumber() user_id: number;
  @IsOptional() @IsNumber() job_id?: number;
  @IsOptional() @IsNumber() phase_id?: number;
  @IsDateString() date: string;
  @IsNumber() hours: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() is_billable?: boolean;
  @IsOptional() @IsNumber() billing_rate?: number;
}

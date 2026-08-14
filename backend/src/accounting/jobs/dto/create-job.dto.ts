import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatus } from '../entities/job.entity';

class JobPhaseDto {
  @IsString() name: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsNumber() estimated_cost?: number;
}

export class CreateJobDto {
  @IsString() name: string;
  @IsString() code: string;
  @IsOptional() @IsNumber() customer_id?: number;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsDateString() end_date?: string;
  @IsOptional() @IsNumber() estimated_cost?: number;
  @IsOptional() @IsNumber() estimated_revenue?: number;
  @IsOptional() @IsEnum(JobStatus) status?: JobStatus;
  @IsOptional() @IsString() description?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobPhaseDto)
  phases?: JobPhaseDto[];
}

export class CreateJobCostDto {
  @IsNumber() job_id: number;
  @IsOptional() @IsNumber() phase_id?: number;
  @IsString() type: string;
  @IsNumber() amount: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() reference?: string;
}

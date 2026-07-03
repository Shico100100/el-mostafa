import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IssueStatus } from '../entities/mold-issue.entity';

export class CreateMoldIssueDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  mold_id: number;

  @ApiProperty({ example: '2026-06-21' })
  @Type(() => Date)
  @IsNotEmpty()
  date: Date;

  @ApiProperty({ example: 'شرخ في القالب' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: IssueStatus, default: IssueStatus.OPEN })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({ example: 'تم الإصلاح' })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({ example: 'uploads/issue.jpg' })
  @IsOptional()
  @IsString()
  image_path?: string;
}

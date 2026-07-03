import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

class JournalEntryLineDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  account_id: number;

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ example: 0.0 })
  @IsNumber()
  @Min(0)
  credit: number;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: '2026-06-21' })
  @Type(() => Date)
  date: Date;

  @ApiProperty({ example: 'قيد اليومية' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'REF-001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ type: [JournalEntryLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  entries: JournalEntryLineDto[];
}

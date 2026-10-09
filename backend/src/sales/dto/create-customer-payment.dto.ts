import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCustomerPaymentDto {
  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: '2026-06-21' })
  @IsDateString()
  @IsNotEmpty()
  payment_date: string;

  @ApiPropertyOptional({ example: 'ملاحظات' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 12,
    description: 'Optional linked sales order id',
  })
  @IsOptional()
  @IsNumber()
  order_id?: number;

  @ApiPropertyOptional({ example: 'cash', enum: ['cash', 'check', 'transfer'] })
  @IsOptional()
  @IsString()
  method?: string;
}

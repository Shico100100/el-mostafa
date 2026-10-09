import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomerDto {
  @ApiPropertyOptional({ example: 'شركة النور' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '01234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'القاهرة' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Credit ceiling; null = unlimited',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_limit?: number;
}

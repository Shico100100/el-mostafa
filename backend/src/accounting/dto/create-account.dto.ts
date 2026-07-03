import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AccountType } from '../entities/account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: '1104' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'بنك' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({ example: 'الحساب البنكي للشركة' })
  @IsOptional()
  @IsString()
  description?: string;
}

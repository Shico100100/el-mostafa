import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ArrayNotEmpty } from 'class-validator';

export class ReverseJournalEntryDto {
  @ApiProperty({ type: [Number], example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  entryIds: number[];
}

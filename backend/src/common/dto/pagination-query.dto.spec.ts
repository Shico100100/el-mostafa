import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('should accept valid pagination params', async () => {
    const dto = plainToInstance(PaginationQueryDto, { page: 1, limit: 10 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject negative page', async () => {
    const dto = plainToInstance(PaginationQueryDto, { page: -1, limit: 10 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

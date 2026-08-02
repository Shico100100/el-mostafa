import { describe, it, expect } from 'vitest';
import type {
  CreateUserDto, UpdateUserDto,
  CreateSalesOrderDto, CreatePurchaseOrderDto,
  CreateDailyProductionDto,
  AddRawMaterialStockDto,
} from './dto';

describe('DTO types (compile-time checks)', () => {
  it('CreateUserDto accepts valid shape', () => {
    const dto: CreateUserDto = {
      email: 'test@test.com',
      password: 'secret123',
      firstName: 'Test',
      lastName: 'User',
    };
    expect(dto.email).toBe('test@test.com');
  });

  it('UpdateUserDto allows partial fields', () => {
    const dto: UpdateUserDto = { email: 'new@test.com' };
    expect(dto.email).toBe('new@test.com');
  });

  it('CreateSalesOrderDto accepts valid shape', () => {
    const dto: CreateSalesOrderDto = {
      customer_id: 1,
      total_amount: 500,
      order_date: new Date().toISOString(),
      items: [{ product_id: 10, quantity: 5, price: 100, total: 500 }],
    };
    expect(dto.customer_id).toBe(1);
    expect(dto.items).toHaveLength(1);
  });

  it('CreatePurchaseOrderDto accepts valid shape', () => {
    const dto: CreatePurchaseOrderDto = {
      supplier_id: 2,
      total_amount: 500,
      order_date: new Date().toISOString(),
      items: [{ product_id: 20, quantity: 10, price: 50, total: 500 }],
    };
    expect(dto.supplier_id).toBe(2);
    expect(dto.items).toHaveLength(1);
  });

  it('CreateDailyProductionDto accepts valid shape', () => {
    const dto: CreateDailyProductionDto = {
      date: '2026-07-28',
      machine_id: 1,
      product_id: 5,
      pieces_produced: 1000,
      mold_id: 3,
      shift: 'morning',
    };
    expect(dto.pieces_produced).toBe(1000);
    expect(dto.shift).toBe('morning');
  });

  it('AddRawMaterialStockDto accepts valid shape', () => {
    const dto: AddRawMaterialStockDto = {
      quantity: 500,
      price: 25,
      notes: 'restock',
    };
    expect(dto.quantity).toBe(500);
    expect(dto.notes).toBe('restock');
  });
});

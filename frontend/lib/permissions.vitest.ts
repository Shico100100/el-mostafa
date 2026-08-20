import { describe, it, expect } from 'vitest';
import { resolveRoles } from '@/lib/resolveRoles';
import { PAGE_PERMISSIONS } from '@/lib/permissions';

describe('resolveRoles', () => {
  it('returns roles for exact match /dashboard', () => {
    const roles = resolveRoles('/dashboard');
    expect(roles).toEqual([1, 3, 4, 5, 6, 7]);
  });

  it('returns longest prefix match for nested routes', () => {
    const roles = resolveRoles('/inventory/products/bulk-prices');
    expect(roles).toEqual([1, 3, 5]);
  });

  it('falls back to parent prefix when no exact match', () => {
    const roles = resolveRoles('/sales/customers/123');
    expect(roles).toEqual([1, 3]);
  });

  it('returns admin-only for /purchases', () => {
    const roles = resolveRoles('/purchases');
    expect(roles).toEqual([1, 3, 4]);
  });

  it('returns empty array for unknown paths', () => {
    const roles = resolveRoles('/unknown/path');
    expect(roles).toEqual([]);
  });

  it('returns correct roles for accounting paths', () => {
    const roles = resolveRoles('/accounting');
    expect(roles).toContain(1);
    expect(roles).toContain(4);
  });

  it('returns correct roles for reports paths', () => {
    const roles = resolveRoles('/reports');
    expect(roles).toContain(1);
    expect(roles).toContain(3);
    expect(roles).toContain(4);
  });

  it('does not grant access for empty role list', () => {
    const roles = resolveRoles('/some-nonexistent-module/xyz');
    expect(roles).toHaveLength(0);
  });
});

describe('PAGE_PERMISSIONS completeness', () => {
  it('has dashboard accessible by all roles', () => {
    expect(PAGE_PERMISSIONS['/dashboard']).toContain(7);
  });

  it('sales restricted to admin and manager', () => {
    const salesRoles = PAGE_PERMISSIONS['/sales'];
    expect(salesRoles).toEqual([1, 3]);
  });

  it('accounting page accessible by accountant role', () => {
    expect(PAGE_PERMISSIONS['/accounting']).toContain(4);
  });

  it('viewer cannot access sales', () => {
    expect(PAGE_PERMISSIONS['/sales']).not.toContain(7);
  });

  it('viewer cannot access purchases', () => {
    expect(PAGE_PERMISSIONS['/purchases']).not.toContain(7);
  });

  it('viewer cannot access inventory', () => {
    expect(PAGE_PERMISSIONS['/inventory']).not.toContain(7);
  });

  it('worker can access manufacturing', () => {
    expect(PAGE_PERMISSIONS['/manufacturing']).toContain(6);
  });

  it('worker cannot access sales', () => {
    expect(PAGE_PERMISSIONS['/sales']).not.toContain(6);
  });

  it('storekeeper can access inventory', () => {
    expect(PAGE_PERMISSIONS['/inventory']).toContain(5);
  });

  it('storekeeper cannot access sales', () => {
    expect(PAGE_PERMISSIONS['/sales']).not.toContain(5);
  });
});

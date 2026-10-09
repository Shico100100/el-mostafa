import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LucideProps } from 'lucide-react';
import { createElement } from 'react';

vi.mock('@/lib/api', () => ({
  api: { fetchWithAuth: vi.fn() },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  const SvgIcon = (p: LucideProps) => <svg data-testid="icon" {...p} />;
  return {
    ...actual,
    X: SvgIcon,
    PackagePlus: SvgIcon,
    AlertTriangle: SvgIcon,
  };
});

import { api } from '@/lib/api';
import AssembleDialog from './AssembleDialog';

const mockedFetch = vi.mocked(api.fetchWithAuth);

const preview = {
  product: { id: 1, name: 'FIN' },
  warehouse: { id: 2, name: 'W' },
  quantity: 10,
  unitCost: 31,
  totalCost: 310,
  canAssemble: true,
  items: [
    {
      product_id: 10,
      name: 'COMP',
      bomQty: 2,
      required: 20,
      available: 100,
      shortfall: 0,
      unitCost: 5,
    },
  ],
};

const props = {
  product: { id: 1, name: 'FIN' },
  warehouses: [{ id: 2, name: 'W' }],
  defaultWarehouseId: 2,
  onClose: vi.fn(),
  onSaved: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AssembleDialog', () => {
  it('loads the preview and enables confirm when stock covers it', async () => {
    mockedFetch.mockResolvedValueOnce(preview);
    render(createElement(AssembleDialog, props));
    await waitFor(() => {
      expect(screen.getByText('COMP')).toBeDefined();
    });
    expect(
      screen.getByText('تنفيذ التجميع').closest('button')?.disabled,
    ).toBe(false);
    expect(mockedFetch).toHaveBeenCalledWith(
      '/inventory/products/1/assembly-preview?quantity=1&warehouseId=2',
    );
  });

  it('blocks confirm and flags the shortfall', async () => {
    mockedFetch.mockResolvedValueOnce({
      ...preview,
      canAssemble: false,
      items: [{ ...preview.items[0], available: 5, shortfall: 15 }],
    });
    render(createElement(AssembleDialog, props));
    await waitFor(() => {
      expect(screen.getByText(/مخزون غير كاف/)).toBeDefined();
    });
    expect(
      screen.getByText('تنفيذ التجميع').closest('button')?.disabled,
    ).toBe(true);
  });

  it('shows a friendly message when the product has no recipe', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('404'));
    render(createElement(AssembleDialog, props));
    await waitFor(() => {
      expect(
        screen.getByText(/تأكد أن المنتج له مكونات مسجلة/),
      ).toBeDefined();
    });
  });

  it('executes the assembly and notifies on success', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onClose = vi.fn();
    mockedFetch
      .mockResolvedValueOnce(preview)
      .mockResolvedValueOnce({ produced: 1, unitCost: 31 });
    render(createElement(AssembleDialog, { ...props, onSaved, onClose }));
    await waitFor(() => {
      expect(screen.getByText('تنفيذ التجميع')).toBeDefined();
    });
    await user.click(screen.getByText('تنفيذ التجميع'));
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
    expect(onClose).toHaveBeenCalled();
    expect(mockedFetch).toHaveBeenLastCalledWith(
      '/inventory/products/1/assemble',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

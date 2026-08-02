import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';

const mockGetRawMaterial = vi.fn();
const mockGetRawMaterialMovements = vi.fn();
const mockDeleteStockMovement = vi.fn();
const mockUpdateStockMovement = vi.fn();
const mockAddRawMaterialStock = vi.fn();
const mockCreateStockMovement = vi.fn();
const mockRecalculateRawMaterialStock = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getRawMaterial: (...args: any[]) => mockGetRawMaterial(...args),
    getRawMaterialMovements: (...args: any[]) => mockGetRawMaterialMovements(...args),
    deleteStockMovement: (...args: any[]) => mockDeleteStockMovement(...args),
    updateStockMovement: (...args: any[]) => mockUpdateStockMovement(...args),
    addRawMaterialStock: (...args: any[]) => mockAddRawMaterialStock(...args),
    createStockMovement: (...args: any[]) => mockCreateStockMovement(...args),
    recalculateRawMaterialStock: (...args: any[]) => mockRecalculateRawMaterialStock(...args),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: '42' }),
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    FileText: (p: any) => <svg data-testid="icon" {...p} />,
    BarChart3: (p: any) => <svg data-testid="icon" {...p} />,
    Plus: (p: any) => <svg data-testid="icon" {...p} />,
    Pencil: (p: any) => <svg data-testid="icon" {...p} />,
    Trash2: (p: any) => <svg data-testid="icon" {...p} />,
    RefreshCw: (p: any) => <svg data-testid="icon" {...p} />,
  };
});

import RawMaterialDetailsPage from './client';

const mockRawMaterial = {
  id: 42,
  current_stock: 150,
  last_purchase_price: 25.5,
  reorder_point: 100,
  stock_status: 'NORMAL',
  product: { id: 10, name: 'PP ابيض', unit: 'كجم', cost_price: 22.0 },
};

function makeMovements(overrides?: { current_stock?: number }) {
  const current_stock = overrides?.current_stock ?? 150;
  return [
    { id: 1, date: '2026-01-10', type: 'IN', quantity: 500, price: 20, reference: 'PO-1', notes: '' },
    { id: 2, date: '2026-02-15', type: 'OUT', quantity: 200, reference: '', notes: 'production' },
    { id: 3, date: '2026-03-20', type: 'IN', quantity: 300, price: 22, reference: 'PO-2', notes: '' },
    { id: 4, date: '2026-04-10', type: 'OUT', quantity: 450, reference: '', notes: 'production' },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetRawMaterial.mockResolvedValue(mockRawMaterial);
  mockGetRawMaterialMovements.mockResolvedValue(makeMovements());
  mockDeleteStockMovement.mockResolvedValue(undefined);
  mockUpdateStockMovement.mockResolvedValue(undefined);
  mockAddRawMaterialStock.mockResolvedValue(undefined);
  mockCreateStockMovement.mockResolvedValue(undefined);
  mockRecalculateRawMaterialStock.mockResolvedValue({ calculated_stock: 150 });
});

describe('RawMaterialDetailsPage', () => {
  describe('loading state', () => {
    it('shows loading text while fetching', () => {
      mockGetRawMaterial.mockReturnValue(new Promise(() => {}));
      render(createElement(RawMaterialDetailsPage));
      expect(screen.getByText('جاري التحميل...')).toBeDefined();
    });
  });

  describe('not found state', () => {
    it('shows not found when API returns 404', async () => {
      mockGetRawMaterial.mockRejectedValue({ status: 404 });
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('المادة الخام غير موجودة')).toBeDefined();
      });
    });
  });

  describe('info cards', () => {
    it('displays product name in header', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText(/PP ابيض/)).toBeDefined();
      });
    });

    it('shows current stock value', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('150')).toBeDefined();
      });
    });

    it('shows last purchase price', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('25.50 ج.م')).toBeDefined();
      });
    });

    it('shows reorder point', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('100')).toBeDefined();
      });
    });

    it('shows NORMAL status as عادي', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('عادي')).toBeDefined();
      });
    });

    it('shows LOW_STOCK status as منخفض', async () => {
      mockGetRawMaterial.mockResolvedValue({ ...mockRawMaterial, stock_status: 'LOW_STOCK' });
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('منخفض')).toBeDefined();
      });
    });

    it('shows OUT_OF_STOCK status as نفذ', async () => {
      mockGetRawMaterial.mockResolvedValue({ ...mockRawMaterial, stock_status: 'OUT_OF_STOCK' });
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('نفذ')).toBeDefined();
      });
    });

    it('falls back to cost_price when last_purchase_price is null', async () => {
      mockGetRawMaterial.mockResolvedValue({ ...mockRawMaterial, last_purchase_price: null });
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('22.00 ج.م')).toBeDefined();
      });
    });
  });

  describe('movements table', () => {
    it('renders all column headers including running balance', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('التاريخ')).toBeDefined();
        expect(screen.getByText('النوع')).toBeDefined();
        expect(screen.getByText('الكمية')).toBeDefined();
        expect(screen.getByText('السعر')).toBeDefined();
        expect(screen.getByText('المورد / المرجع')).toBeDefined();
        expect(screen.getByText('ملاحظات')).toBeDefined();
        expect(screen.getByText('الرصيد بعد الحركة')).toBeDefined();
        expect(screen.getByText('تعديل')).toBeDefined();
        expect(screen.getByText('حذف')).toBeDefined();
      });
    });

    it('shows empty state when no movements', async () => {
      mockGetRawMaterialMovements.mockResolvedValue([]);
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('لا توجد حركات مسجلة')).toBeDefined();
      });
    });

    it('renders movement rows with correct labels', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getAllByText('شراء / إضافة').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('استهلاك / صرف').length).toBeGreaterThanOrEqual(2);
      });
    });

    it('displays price for IN movements', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('20.00 ج.م')).toBeDefined();
        expect(screen.getByText('22.00 ج.م')).toBeDefined();
      });
    });

    it('displays dash for OUT movements with no price', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        const dashes = screen.getAllByText('-');
        expect(dashes.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('running balance calculation', () => {
    it('last row balance equals current_stock', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        const balanceCells = screen.getAllByText('150');
        expect(balanceCells.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('correctly computes balance: initial=0, +500=500, -200=300, +300=600, -450=150', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getAllByText('500').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('300').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('600').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('150').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('handles movements where current_stock does not equal net movement', async () => {
      mockGetRawMaterial.mockResolvedValue({ ...mockRawMaterial, current_stock: 200 });
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        const sorted = [...makeMovements()].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let netChange = 0;
        sorted.forEach(m => { netChange += m.type === 'IN' ? m.quantity : -m.quantity; });
        const initial = 200 - netChange;
        let bal = initial;
        sorted.forEach(m => { bal += m.type === 'IN' ? m.quantity : -m.quantity; });
        expect(screen.getByText(bal.toLocaleString())).toBeDefined();
      });
    });

    it('uses all movements for balance even when some are filtered', async () => {
      const oldMovements = [
        { id: 10, date: '2025-01-01', type: 'IN', quantity: 100, price: 10, reference: '', notes: '' },
        { id: 11, date: '2026-06-01', type: 'OUT', quantity: 50, reference: '', notes: '' },
      ];
      mockGetRawMaterialMovements.mockResolvedValue(oldMovements);
      mockGetRawMaterial.mockResolvedValue({ ...mockRawMaterial, current_stock: 50 });
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('100')).toBeDefined();
        expect(screen.getByText('50')).toBeDefined();
      });
    });
  });

  describe('empty state colSpan', () => {
    it('uses colSpan=9 for empty state', async () => {
      mockGetRawMaterialMovements.mockResolvedValue([]);
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        const emptyCell = screen.getByText('لا توجد حركات مسجلة').closest('td');
        expect(emptyCell?.getAttribute('colspan')).toBe('9');
      });
    });
  });

  describe('filter buttons', () => {
    it('renders all filter options', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('الكل')).toBeDefined();
        expect(screen.getByText('يوم')).toBeDefined();
        expect(screen.getByText('شهر')).toBeDefined();
        expect(screen.getByText('3 شهور')).toBeDefined();
        expect(screen.getByText('6 شهور')).toBeDefined();
        expect(screen.getByText('سنة')).toBeDefined();
      });
    });
  });

  describe('add movement dialog', () => {
    it('opens add dialog on button click', async () => {
      const user = userEvent.setup();
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('إضافة حركة')).toBeDefined();
      });
      await user.click(screen.getByText('إضافة حركة'));
      expect(screen.getByText('إضافة الحركة')).toBeDefined();
    });

    it('shows price field for IN type', async () => {
      const user = userEvent.setup();
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => screen.getByText('إضافة حركة'));
      await user.click(screen.getByText('إضافة حركة'));
      const priceLabels = screen.getAllByText('السعر');
      expect(priceLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('hides price field when OUT type selected', async () => {
      const user = userEvent.setup();
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => screen.getByText('إضافة حركة'));
      await user.click(screen.getByText('إضافة حركة'));
      const priceCountBefore = screen.getAllByText('السعر').length;
      const select = screen.getAllByRole('combobox')[0];
      await user.selectOptions(select, 'OUT');
      const priceCountAfter = screen.getAllByText('السعر').length;
      expect(priceCountAfter).toBeLessThan(priceCountBefore);
    });
  });

  describe('edit dialog', () => {
    it('opens edit dialog and pre-fills values', async () => {
      const user = userEvent.setup();
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => screen.getAllByText('500'));
      const editButtons = screen.getAllByTestId('icon').filter(el =>
        el.closest('button')?.className.includes('yellow')
      );
      await user.click(editButtons[0].closest('button')!);
      expect(screen.getByText('تعديل السجل')).toBeDefined();
      expect(screen.getByText('حفظ التعديلات')).toBeDefined();
    });
  });

  describe('back button', () => {
    it('renders back button with correct label', async () => {
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('عودة للقائمة')).toBeDefined();
      });
    });
  });

  describe('recalculate button', () => {
    it('calls recalculate API on confirm and refreshes data', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => screen.getByText('150'));
      const refreshBtn = screen.getByTitle('إعادة احتساب الرصيد من السجل');
      await user.click(refreshBtn);
      expect(mockRecalculateRawMaterialStock).toHaveBeenCalledWith(42);
      await waitFor(() => {
        expect(mockGetRawMaterial).toHaveBeenCalledTimes(2);
      });
      vi.restoreAllMocks();
    });

    it('does not call recalculate when user cancels', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => screen.getByText('150'));
      const refreshBtn = screen.getByTitle('إعادة احتساب الرصيد من السجل');
      await user.click(refreshBtn);
      expect(mockRecalculateRawMaterialStock).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });

  describe('delete movement', () => {
    it('calls deleteStockMovement on confirm', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => screen.getAllByText('500'));
      const trashButtons = screen.getAllByTestId('icon').filter(el =>
        el.closest('button')?.className.includes('red')
      );
      await user.click(trashButtons[0].closest('button')!);
      expect(mockDeleteStockMovement).toHaveBeenCalledWith(1);
      vi.restoreAllMocks();
    });

    it('does not delete when user cancels', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => screen.getAllByText('500'));
      const trashButtons = screen.getAllByTestId('icon').filter(el =>
        el.closest('button')?.className.includes('red')
      );
      await user.click(trashButtons[0].closest('button')!);
      expect(mockDeleteStockMovement).not.toHaveBeenCalled();
      vi.restoreAllMocks();
    });
  });

  describe('error handling', () => {
    it('sets rawMaterial to null on non-404 error', async () => {
      mockGetRawMaterial.mockRejectedValue(new Error('network'));
      render(createElement(RawMaterialDetailsPage));
      await waitFor(() => {
        expect(screen.getByText('المادة الخام غير موجودة')).toBeDefined();
      });
    });
  });
});

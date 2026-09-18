import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Order, NewOrderItem, Product } from '@/components/purchases/types';

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

import { exportToExcel, handleExportItems, handleImportItems } from './usePurchaseOrderExcel';
import { toast } from 'sonner';

const mockOrders: Order[] = [
  {
    id: 1,
    invoice_number: 'INV-001',
    order_date: '2025-01-15',
    supplier: { id: 0, name: 'Supplier A' },
    total_amount: 5000,
    notes: 'test note',
  } as Order,
  {
    id: 2,
    invoice_number: null,
    order_date: null,
    created_at: '2025-02-10T00:00:00Z',
    supplier: null,
    total_amount: 3000,
    notes: null,
  } as unknown as Order,
];

const mockProducts: Product[] = [
  { id: 1, name: 'Product A', weight_grams: 100 } as Product,
  { id: 2, name: 'Product B', weight_grams: 0 } as Product,
  { id: 3, name: 'Product C', weight_grams: null } as unknown as Product,
];

const mockNewOrderItems: NewOrderItem[] = [
  { product_id: '1', quantity: 10, price: 50, weight_kg: '1' } as NewOrderItem,
  { product_id: '2', quantity: 20, price: 30, weight_kg: undefined } as NewOrderItem,
];

function setupDOM() {
  const mockClick = vi.fn();
  const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
  const mockRevokeObjectURL = vi.fn();

  vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  });

  const mockAnchor = {
    href: '',
    download: '',
    click: mockClick,
  };
  vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);

  return { mockClick, mockCreateObjectURL, mockRevokeObjectURL, mockAnchor };
}

describe('usePurchaseOrderExcel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('exportToExcel', () => {
    it('creates a blob and triggers download', async () => {
      const { mockClick, mockCreateObjectURL, mockRevokeObjectURL } = setupDOM();

      await exportToExcel(mockOrders);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('sets correct download filename', async () => {
      const { mockAnchor } = setupDOM();

      await exportToExcel(mockOrders);

      expect(mockAnchor.download).toMatch(/^Purchase_Orders_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
  });

  describe('handleExportItems', () => {
    it('creates a blob and triggers download', async () => {
      const { mockClick, mockCreateObjectURL, mockRevokeObjectURL } = setupDOM();

      await handleExportItems(null, mockNewOrderItems, mockProducts);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('uses editing order id in filename when editing', async () => {
      const { mockAnchor } = setupDOM();
      const editingOrder: Order = { id: 42 } as Order;

      await handleExportItems(editingOrder, mockNewOrderItems, mockProducts);

      expect(mockAnchor.download).toContain('42');
    });

    it('uses "new order" label in filename when not editing', async () => {
      const { mockAnchor } = setupDOM();

      await handleExportItems(null, mockNewOrderItems, mockProducts);

      expect(mockAnchor.download).toContain('أمر_شراء_جديد');
    });
  });

  describe('handleImportItems', () => {
    it('calls toast.error when no file selected', () => {
      const e = {
        target: { files: [] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      handleImportItems(e, mockProducts, vi.fn(), { current: null } as React.RefObject<HTMLInputElement | null>);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('clears file input after processing', () => {
      const mockRef = { current: { value: '' } } as React.RefObject<HTMLInputElement | null>;
      const e = {
        target: { files: [] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      handleImportItems(e, mockProducts, vi.fn(), mockRef);
      expect(mockRef.current?.value).toBe('');
    });
  });
});

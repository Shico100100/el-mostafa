import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  syncInvoices: vi.fn(),
  loadData: vi.fn(),
  useSetBackButton: vi.fn(),
}));

vi.mock('@/hooks/peachtree-sync/usePeachtreeSync', () => ({
  usePeachtreeSync: () => ({ syncInvoices: mocks.syncInvoices, syncing: false }),
}));

vi.mock('@/components/BackButton', () => ({
  useSetBackButton: (...args: Parameters<typeof mocks.useSetBackButton>) => mocks.useSetBackButton(...args),
}));

vi.mock('@/hooks/sales/useSalesOrders', () => ({
  useSalesOrders: () => ({
    orders: [], loading: false, customers: [], products: [],
    filters: {}, setFilters: vi.fn(), totalPages: 1, totalItems: 0,
    showModal: false, setShowModal: vi.fn(),
    showPaymentModal: false, setShowPaymentModal: vi.fn(),
    selectedOrder: null, selectedOrderForPayment: null, setSelectedOrderForPayment: vi.fn(),
    showQuickCustomerModal: false, setShowQuickCustomerModal: vi.fn(),
    quickCustomerData: null, setQuickCustomerData: vi.fn(),
    newOrder: null, setNewOrder: vi.fn(),
    paymentData: null, setPaymentData: vi.fn(),
    componentRef: { current: null }, orderToPrint: null, setOrderToPrint: vi.fn(),
    resetFilters: vi.fn(), loadData: mocks.loadData,
    handleAddItem: vi.fn(), handleRemoveItem: vi.fn(), handleItemChange: vi.fn(),
    calculateTotal: vi.fn(),
    handleQuickCustomerSubmit: vi.fn(),
    handlePaymentSubmit: vi.fn(),
    handleSubmit: vi.fn(),
    handleDuplicateOrder: vi.fn(),
    handleExport: vi.fn(),
    openPayment: vi.fn(), openDetails: vi.fn(), closeDetails: vi.fn(),
  }),
}));

vi.mock('@/components/sales/orders/SalesOrderFilters', () => ({
  SalesOrderFilters: () => <div>filters</div>,
}));
vi.mock('@/components/sales/orders/SalesOrdersTable', () => ({
  SalesOrdersTable: () => <div>table</div>,
}));
vi.mock('@/components/sales/orders/SalesOrderPrintTemplate', () => ({
  SalesOrderPrintTemplate: () => <div>print</div>,
}));
vi.mock('@/components/sales/orders/modals/CreateSalesOrderModal', () => ({
  CreateSalesOrderModal: () => <div>create-modal</div>,
}));
vi.mock('@/components/sales/orders/modals/OrderDetailsModal', () => ({
  OrderDetailsModal: () => <div>details-modal</div>,
}));
vi.mock('@/components/sales/orders/modals/PaymentModal', () => ({
  PaymentModal: () => <div>payment-modal</div>,
}));
vi.mock('@/components/sales/orders/modals/QuickCustomerModal', () => ({
  QuickCustomerModal: () => <div>quick-modal</div>,
}));

import SalesOrdersPage from './page';

describe('SalesOrdersPage Peachtree import button', () => {
  beforeEach(() => {
    mocks.syncInvoices.mockReset();
    mocks.syncInvoices.mockResolvedValue(undefined);
    mocks.loadData.mockReset();
    mocks.loadData.mockResolvedValue(undefined);
    mocks.useSetBackButton.mockReset();
  });

  it('renders the import button', () => {
    render(<SalesOrdersPage />);
    expect(screen.getByRole('button', { name: /استيراد من Peachtree/ })).toBeInTheDocument();
  });

  it('calls syncInvoices with sales_invoices + invoice_line_items and reloads data', async () => {
    const user = userEvent.setup();
    render(<SalesOrdersPage />);

    await user.click(screen.getByRole('button', { name: /استيراد من Peachtree/ }));

    expect(mocks.syncInvoices).toHaveBeenCalledWith(['sales_invoices', 'invoice_line_items']);
    await waitFor(() => expect(mocks.loadData).toHaveBeenCalled());
  });
});

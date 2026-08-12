import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/hooks/peachtree-sync/usePeachtreeSync', () => ({
  usePeachtreeSync: vi.fn(),
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Link2: (p: any) => <svg data-testid="icon" {...p} />,
    Play: (p: any) => <svg data-testid="icon" {...p} />,
    CheckCircle2: (p: any) => <svg data-testid="icon" {...p} />,
    XCircle: (p: any) => <svg data-testid="icon" {...p} />,
    RefreshCw: (p: any) => <svg data-testid="icon" {...p} />,
    Database: (p: any) => <svg data-testid="icon" {...p} />,
    Settings: (p: any) => <svg data-testid="icon" {...p} />,
    Users: (p: any) => <svg data-testid="icon" {...p} />,
    Truck: (p: any) => <svg data-testid="icon" {...p} />,
    Package: (p: any) => <svg data-testid="icon" {...p} />,
    BookOpen: (p: any) => <svg data-testid="icon" {...p} />,
    FileText: (p: any) => <svg data-testid="icon" {...p} />,
    Wallet: (p: any) => <svg data-testid="icon" {...p} />,
    UserCheck: (p: any) => <svg data-testid="icon" {...p} />,
    LayoutGrid: (p: any) => <svg data-testid="icon" {...p} />,
    Building2: (p: any) => <svg data-testid="icon" {...p} />,
    Briefcase: (p: any) => <svg data-testid="icon" {...p} />,
    Receipt: (p: any) => <svg data-testid="icon" {...p} />,
    ChevronDown: (p: any) => <svg data-testid="icon" {...p} />,
    ChevronUp: (p: any) => <svg data-testid="icon" {...p} />,
  };
});

import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';
import PeachtreeSyncPage from './page';
import { createElement } from 'react';

const mockedHook = vi.mocked(usePeachtreeSync);

function makeHookState(overrides: Partial<ReturnType<typeof usePeachtreeSync>> = {}) {
  return {
    loading: false,
    syncing: false,
    resyncing: false,
    testing: false,
    connected: null as boolean | null,
    connectionError: '',
    history: [] as any[],
    tables: [] as string[],
    dsn: '',
    setDsn: vi.fn(),
    testConnection: vi.fn().mockResolvedValue(undefined),
    runSync: vi.fn().mockResolvedValue(undefined),
    runIncrementalSync: vi.fn().mockResolvedValue(undefined),
    resyncItems: vi.fn().mockResolvedValue(undefined),
    syncInvoices: vi.fn().mockResolvedValue(undefined),
    saveConfig: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PeachtreeSyncPage', () => {
  describe('loading state', () => {
    it('shows loading screen when loading=true', () => {
      mockedHook.mockReturnValue(makeHookState({ loading: true }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('جاري التحميل...')).toBeDefined();
    });

    it('does not render page content when loading', () => {
      mockedHook.mockReturnValue(makeHookState({ loading: true }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.queryByText('ربط Peachtree')).toBeNull();
      expect(screen.queryByText('إعدادات الاتصال')).toBeNull();
      expect(screen.queryByText('سجل المزامنة')).toBeNull();
    });
  });

  describe('page header', () => {
    it('renders main title', () => {
      mockedHook.mockReturnValue(makeHookState());
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('ربط Peachtree')).toBeDefined();
    });

    it('shows entity count in description', () => {
      mockedHook.mockReturnValue(makeHookState());
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText(/مزامنة البيانات مع Peachtree Quantum/)).toBeDefined();
      expect(screen.getAllByText(/6 كيان/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('status cards', () => {
    it('shows "لم يتم الفحص" when connected=null', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: null }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('لم يتم الفحص')).toBeDefined();
    });

    it('shows "متصل" when connected=true', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: true }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('متصل')).toBeDefined();
    });

    it('shows "غير متصل" when connected=false', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: false }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('غير متصل')).toBeDefined();
    });

    it('shows sync operations count', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{ id: '1' }, { id: '2' }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('2')).toBeDefined();
    });

    it('shows table count', () => {
      mockedHook.mockReturnValue(makeHookState({
        tables: ['Chart', 'Customers', 'Vendors'],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('3')).toBeDefined();
    });

    it('shows last sync record count', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{ id: '1', records_synced: 500 }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('500 سجل')).toBeDefined();
    });

    it('shows dash when no sync history', () => {
      mockedHook.mockReturnValue(makeHookState({ history: [] }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('-')).toBeDefined();
    });
  });

  describe('connection config', () => {
    it('renders DSN input with current value', () => {
      mockedHook.mockReturnValue(makeHookState({ dsn: 'mos' }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByDisplayValue('mos')).toBeDefined();
    });

    it('renders empty input when dsn is empty', () => {
      mockedHook.mockReturnValue(makeHookState({ dsn: '' }));
      render(createElement(PeachtreeSyncPage));
      const input = screen.getByPlaceholderText('D:\\OneDrive\\Mostafaapp') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('calls setDsn on input change', async () => {
      const setDsn = vi.fn();
      mockedHook.mockReturnValue(makeHookState({ dsn: 'mos', setDsn }));
      render(createElement(PeachtreeSyncPage));
      const input = screen.getByDisplayValue('mos');
      await userEvent.clear(input);
      await userEvent.type(input, 'newdb');
      expect(setDsn).toHaveBeenCalled();
    });

    it('calls saveConfig when save button clicked', async () => {
      const saveConfig = vi.fn().mockResolvedValue(undefined);
      mockedHook.mockReturnValue(makeHookState({ saveConfig }));
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText('حفظ'));
      expect(saveConfig).toHaveBeenCalled();
    });

    it('calls testConnection when test button clicked', async () => {
      const testConnection = vi.fn().mockResolvedValue(undefined);
      mockedHook.mockReturnValue(makeHookState({ testConnection }));
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText('اختبار الاتصال'));
      expect(testConnection).toHaveBeenCalled();
    });

    it('shows spinner text when testing', () => {
      mockedHook.mockReturnValue(makeHookState({ testing: true }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('جاري الفحص...')).toBeDefined();
      expect(screen.queryByText('اختبار الاتصال')).toBeNull();
    });

    it('shows success message when connected', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: true, dsn: 'mos' }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText(/الاتصال ناجح/)).toBeDefined();
      expect(screen.getByText(/mos/)).toBeDefined();
    });

    it('shows error message when connection failed', () => {
      mockedHook.mockReturnValue(makeHookState({
        connected: false,
        connectionError: 'Btrieve Error 2301',
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText(/فشل الاتصال/)).toBeDefined();
      expect(screen.getByText(/Btrieve Error 2301/)).toBeDefined();
    });

    it('shows default error when no connectionError', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: false, connectionError: '' }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText(/تأكد من تثبيت Pervasive PSQL ODBC driver/)).toBeDefined();
    });

    it('hides success/error when connected is null', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: null }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.queryByText(/الاتصال ناجح/)).toBeNull();
      expect(screen.queryByText(/فشل الاتصال/)).toBeNull();
    });
  });

  describe('sync buttons', () => {
    it('sync button disabled when not connected', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: false }));
      render(createElement(PeachtreeSyncPage));
      const btn = screen.getByText(/مزامنة شاملة/).closest('button')!;
      expect(btn.disabled).toBe(true);
    });

    it('sync button disabled when connected is null', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: null }));
      render(createElement(PeachtreeSyncPage));
      const btn = screen.getByText(/مزامنة شاملة/).closest('button')!;
      expect(btn.disabled).toBe(true);
    });

    it('sync button disabled when syncing', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: true, syncing: true }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('جاري المزامنة...')).toBeDefined();
      const btn = screen.getByText('جاري المزامنة...').closest('button')!;
      expect(btn.disabled).toBe(true);
    });

    it('sync button enabled when connected and not syncing', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: true, syncing: false }));
      render(createElement(PeachtreeSyncPage));
      const btn = screen.getByText(/مزامنة شاملة/).closest('button')!;
      expect(btn.disabled).toBe(false);
    });

    it('calls runSync on sync button click', async () => {
      const runSync = vi.fn().mockResolvedValue(undefined);
      mockedHook.mockReturnValue(makeHookState({ connected: true, runSync }));
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText(/مزامنة شاملة/));
      expect(runSync).toHaveBeenCalled();
    });

    it('resync button disabled when not connected', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: false }));
      render(createElement(PeachtreeSyncPage));
      const btn = screen.getByText('إعادة مزامنة الأصناف').closest('button')!;
      expect(btn.disabled).toBe(true);
    });

    it('resync button disabled during sync', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: true, syncing: true }));
      render(createElement(PeachtreeSyncPage));
      const btn = screen.getByText('إعادة مزامنة الأصناف').closest('button')!;
      expect(btn.disabled).toBe(true);
    });

    it('resync button disabled during resyncing', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: true, resyncing: true }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('جاري إعادة المزامنة...')).toBeDefined();
      const btn = screen.getByText('جاري إعادة المزامنة...').closest('button')!;
      expect(btn.disabled).toBe(true);
    });

    it('resync button enabled when connected and idle', () => {
      mockedHook.mockReturnValue(makeHookState({ connected: true, resyncing: false, syncing: false }));
      render(createElement(PeachtreeSyncPage));
      const btn = screen.getByText('إعادة مزامنة الأصناف').closest('button')!;
      expect(btn.disabled).toBe(false);
    });

    it('calls resyncItems on resync button click', async () => {
      const resyncItems = vi.fn().mockResolvedValue(undefined);
      mockedHook.mockReturnValue(makeHookState({ connected: true, resyncItems }));
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText('إعادة مزامنة الأصناف'));
      expect(resyncItems).toHaveBeenCalled();
    });
  });

  describe('sync history table', () => {
    it('shows empty state when no history', () => {
      mockedHook.mockReturnValue(makeHookState({ history: [] }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('لم تتم أي مزامنة بعد')).toBeDefined();
    });

    it('renders completed entry', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 500,
          duration_ms: 30000,
          results: [{ entity: 'customers', recordsCreated: 10, recordsUpdated: 5, recordsSkipped: 2, status: 'completed' }],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('نجاح')).toBeDefined();
      expect(screen.getByText('500')).toBeDefined();
      expect(screen.getByText('30.0 ث')).toBeDefined();
    });

    it('renders failed status badge', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync2',
          startedAt: '2026-07-18T11:00:00Z',
          status: 'failed',
          records_synced: 0,
          duration_ms: 1000,
          results: [],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('فشل')).toBeDefined();
    });

    it('renders running status badge', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync3',
          startedAt: '2026-07-18T12:00:00Z',
          status: 'running',
          records_synced: 0,
          results: [],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('قيد التنفيذ')).toBeDefined();
    });

    it('shows dash when no duration_ms', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 10,
          results: [],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('-')).toBeDefined();
    });

    it('falls back to started_at (snake_case)', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          started_at: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 10,
          results: [],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('نجاح')).toBeDefined();
    });

    it('shows expand button when results exist', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 100,
          duration_ms: 5000,
          results: [
            { entity: 'customers', recordsCreated: 5, recordsUpdated: 3, recordsSkipped: 1, status: 'completed' },
            { entity: 'suppliers', recordsCreated: 2, recordsUpdated: 1, recordsSkipped: 0, status: 'completed' },
          ],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('2 كيان')).toBeDefined();
    });

    it('does not show expand button when results empty', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 100,
          duration_ms: 5000,
          results: [],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.queryByText('0 كيان')).toBeNull();
    });

    it('expands entity details on click', async () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 100,
          duration_ms: 5000,
          results: [
            { entity: 'customers', recordsCreated: 5, recordsUpdated: 3, recordsSkipped: 1, status: 'completed' },
          ],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText('1 كيان'));
      expect(screen.getByText('العملاء')).toBeDefined();
      expect(screen.getByText('+5 / ~3 / =1')).toBeDefined();
    });

    it('collapses on second click', async () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 100,
          duration_ms: 5000,
          results: [
            { entity: 'customers', recordsCreated: 5, recordsUpdated: 3, recordsSkipped: 1, status: 'completed' },
          ],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText('1 كيان'));
      expect(screen.getByText('العملاء')).toBeDefined();
      await userEvent.click(screen.getByText('1 كيان'));
      expect(screen.queryByText('العملاء')).toBeNull();
    });

    it('shows failed entity in expanded details', async () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'failed',
          records_synced: 0,
          duration_ms: 5000,
          results: [
            { entity: 'products', recordsCreated: 0, recordsUpdated: 0, recordsSkipped: 0, status: 'failed', errors: ['too many clients'] },
          ],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText('1 كيان'));
      expect(screen.getByText('المنتجات')).toBeDefined();
      expect(screen.getAllByText('فشل').length).toBeGreaterThanOrEqual(1);
    });

    it('shows records_synced from entry when results lack it', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 1234,
          duration_ms: 5000,
          results: [],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('1234 سجل')).toBeDefined();
    });

    it('computes records from results when records_synced is missing', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          duration_ms: 5000,
          results: [
            { entity: 'customers', recordsCreated: 10, recordsUpdated: 5, recordsSkipped: 0, status: 'completed' },
          ],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('15')).toBeDefined();
    });

    it('shows 0 when no records_synced and empty results', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          duration_ms: 5000,
          results: [],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      const tds = screen.getAllByText('0');
      expect(tds.length).toBeGreaterThanOrEqual(1);
    });

    it('renders multiple history entries', () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [
          { id: 'sync1', startedAt: '2026-07-18T10:00:00Z', status: 'completed', records_synced: 100, duration_ms: 5000, results: [] },
          { id: 'sync2', startedAt: '2026-07-18T11:00:00Z', status: 'failed', records_synced: 0, duration_ms: 1000, results: [] },
          { id: 'sync3', startedAt: '2026-07-18T12:00:00Z', status: 'running', records_synced: 0, results: [] },
        ],
      }));
      render(createElement(PeachtreeSyncPage));
      expect(screen.getByText('نجاح')).toBeDefined();
      expect(screen.getByText('فشل')).toBeDefined();
      expect(screen.getByText('قيد التنفيذ')).toBeDefined();
    });
  });

  describe('entity labels', () => {
    const ENTITY_KEYS = [
      'customers', 'suppliers', 'products',
      'sales_invoices', 'purchase_invoices', 'invoice_line_items',
    ];
    const EXPECTED_LABELS = [
      'العملاء', 'الموردين', 'المنتجات',
      'فواتير المبيعات', 'فواتير المشتريات', 'بنود الفواتير',
    ];

    it('maps entity keys to Arabic labels', async () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 0,
          duration_ms: 5000,
          results: ENTITY_KEYS.map(entity => ({
            entity,
            recordsCreated: 0, recordsUpdated: 0, recordsSkipped: 0, status: 'completed',
          })),
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText(`${ENTITY_KEYS.length} كيان`));
      for (const label of EXPECTED_LABELS) {
        expect(screen.getByText(label)).toBeDefined();
      }
    });

    it('falls back to raw entity name for unknown keys', async () => {
      mockedHook.mockReturnValue(makeHookState({
        history: [{
          id: 'sync1',
          startedAt: '2026-07-18T10:00:00Z',
          status: 'completed',
          records_synced: 0,
          duration_ms: 5000,
          results: [
            { entity: 'unknown_entity', recordsCreated: 0, recordsUpdated: 0, recordsSkipped: 0, status: 'completed' },
          ],
        }],
      }));
      render(createElement(PeachtreeSyncPage));
      await userEvent.click(screen.getByText('1 كيان'));
      expect(screen.getByText('unknown_entity')).toBeDefined();
    });
  });
});

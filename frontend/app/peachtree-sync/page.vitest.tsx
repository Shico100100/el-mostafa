import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LucideProps } from 'lucide-react';
import { createElement } from 'react';

vi.mock('@/hooks/peachtree-sync/usePeachtreeSync', () => ({
  usePeachtreeSync: vi.fn(),
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  const SvgIcon = (p: LucideProps) => <svg data-testid="icon" {...p} />;
  return {
    ...actual,
    Link2: SvgIcon,
    ListChecks: SvgIcon,
    Play: SvgIcon,
    ClipboardList: SvgIcon,
    Settings: SvgIcon,
    EyeOff: SvgIcon,
    Check: SvgIcon,
    X: SvgIcon,
    AlertTriangle: SvgIcon,
    RefreshCw: SvgIcon,
    Users: SvgIcon,
    Truck: SvgIcon,
    Package: SvgIcon,
    FileText: SvgIcon,
    ChevronDown: SvgIcon,
    ChevronUp: SvgIcon,
    Database: SvgIcon,
    CheckCircle2: SvgIcon,
    XCircle: SvgIcon,
  };
});

import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';
import type {
  ReviewEntry,
  ReviewSummary,
} from '@/hooks/peachtree-sync/usePeachtreeSync';
import PeachtreeSyncPage from './page';

const mockedHook = vi.mocked(usePeachtreeSync);

function makeHookState(
  overrides: Partial<ReturnType<typeof usePeachtreeSync>> = {},
) {
  return {
    loading: false,
    syncing: false,
    resyncing: false,
    testing: false,
    applying: false,
    previewing: false,
    connected: null as boolean | null,
    connectionError: '',
    history: [],
    tables: [],
    dsn: '',
    review: [] as ReviewEntry[],
    logs: [],
    syncPercent: 0,
    syncEntity: '',
    pendingSummary: null as ReviewSummary | null,
    reviewJob: null,
    reviewJobRunning: false,
    setDsn: vi.fn(),
    testConnection: vi.fn().mockResolvedValue(undefined),
    runSync: vi.fn().mockResolvedValue(undefined),
    runIncrementalSync: vi.fn().mockResolvedValue(undefined),
    resyncItems: vi.fn().mockResolvedValue(undefined),
    syncInvoices: vi.fn().mockResolvedValue(undefined),
    saveConfig: vi.fn().mockResolvedValue(undefined),
    previewSync: vi.fn().mockResolvedValue(undefined),
    applyReview: vi.fn().mockResolvedValue(undefined),
    skipReview: vi.fn().mockResolvedValue(undefined),
    loadReview: vi.fn().mockResolvedValue(undefined),
    loadLogs: vi.fn().mockResolvedValue(undefined),
    loadPendingSummary: vi.fn().mockResolvedValue(undefined),
    startReviewJob: vi.fn().mockResolvedValue(undefined),
    pollReviewJob: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

function reviewRow(i: number, entity: string, key: string): ReviewEntry {
  return {
    id: 'r-' + i,
    entity,
    record_key: key,
    change_type: 'update',
    old_values: { phone: 'a' },
    new_values: { phone: 'b' },
    status: 'pending',
  };
}

const summary: ReviewSummary = {
  total: 225,
  byEntity: [
    { entity: 'customers', count: 200 },
    { entity: 'products', count: 25 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PeachtreeSyncPage', () => {
  it('renders the status strip and defaults to the review tab', () => {
    mockedHook.mockReturnValue(makeHookState());
    render(createElement(PeachtreeSyncPage));
    expect(screen.getByText('ربط Peachtree')).toBeDefined();
    expect(screen.getByText('فروقات معلقة')).toBeDefined();
    expect(screen.getByText('تقرير الفروقات')).toBeDefined();
    expect(screen.queryByText('مزامنة شاملة')).toBeNull();
  });

  it('shows the pending count badge on the review tab', () => {
    mockedHook.mockReturnValue(makeHookState({ pendingSummary: summary }));
    render(createElement(PeachtreeSyncPage));
    const expected = (225).toLocaleString('ar-EG');
    expect(document.body.textContent?.includes(expected)).toBe(true);
  });

  it('switches to the sync tab with honest action cards', async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(makeHookState({ connected: true }));
    render(createElement(PeachtreeSyncPage));
    await user.click(screen.getByText('المزامنة'));
    expect(screen.getByText('مزامنة شاملة')).toBeDefined();
    expect(screen.getByText('مزامنة ذكية')).toBeDefined();
    expect(
      screen.getByText(/تتخطى الكيانات التي لم يتغير عدد سجلاتها/),
    ).toBeDefined();
    expect(screen.queryByText('تقرير الفروقات')).toBeNull();
  });

  it('switches to history and settings tabs', async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(makeHookState());
    render(createElement(PeachtreeSyncPage));
    await user.click(screen.getByText('السجل'));
    expect(screen.getByText('سجل العمليات')).toBeDefined();
    await user.click(screen.getByText('الإعدادات'));
    expect(screen.getByText('إعدادات الاتصال')).toBeDefined();
    expect(screen.getByText('اختبار الاتصال')).toBeDefined();
  });

  it('filters and searches the review table', async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(
      makeHookState({
        pendingSummary: summary,
        review: [
          reviewRow(1, 'customers', 'C-1'),
          reviewRow(2, 'products', 'P-1'),
        ],
      }),
    );
    render(createElement(PeachtreeSyncPage));
    await user.selectOptions(
      screen.getByLabelText('تصفية حسب الكيان'),
      'products',
    );
    expect(screen.queryByText('C-1')).toBeNull();
    expect(screen.getByText('P-1')).toBeDefined();
    await user.selectOptions(screen.getByLabelText('تصفية حسب الكيان'), 'all');
    await user.type(screen.getByLabelText('بحث برقم السجل'), 'c-1');
    expect(screen.getByText('C-1')).toBeDefined();
    expect(screen.queryByText('P-1')).toBeNull();
  });

  it('blocks bulk actions while the pending count is unknown', () => {
    mockedHook.mockReturnValue(makeHookState({ pendingSummary: null }));
    render(createElement(PeachtreeSyncPage));
    expect(screen.getByText('قبول الكل').closest('button')?.disabled).toBe(
      true,
    );
  });

  it('opens the confirmation dialog with the breakdown', async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(makeHookState({ pendingSummary: summary }));
    render(createElement(PeachtreeSyncPage));
    await user.click(screen.getByText('قبول الكل'));
    expect(screen.getByText('التوزيع حسب النوع:')).toBeDefined();
    expect(screen.getByText('تأكيد القبول')).toBeDefined();
  });
});

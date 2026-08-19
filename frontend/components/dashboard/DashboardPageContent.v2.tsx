'use client';

import { useRouter } from 'next/navigation';
import { usePermission } from '@/lib/usePermission';
import { useDashboard } from '@/lib/dashboard/dashboard-context';
import { useDate } from '@/lib/dashboard/date-context';
import { api } from '@/lib/api';
import {
  TrendingUp,
  Package,
  DollarSign,
  Factory,
  Star,
  ArrowDownRight,
  Cog,
  ArrowUpRight,
  Wrench,
  RefreshCw,
  Bell,
  Bot,
  Radar,
  Trophy,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/dashboard/useDashboardStats';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { AttendanceWidget } from '@/components/dashboard/AttendanceWidget';
import { TopList } from '@/components/dashboard/TopList';
import { TransactionsTimeline } from '@/components/dashboard/TransactionsTimeline';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LowStockPanel } from '@/components/dashboard/LowStockPanel';
import { AccountBalancesPanel } from '@/components/dashboard/AccountBalancesPanel';
import { ARAgingPanel } from '@/components/dashboard/ARAgingPanel';
import { APAgingPanel } from '@/components/dashboard/APAgingPanel';
import { RevenueExpensesPanel } from '@/components/dashboard/RevenueExpensesPanel';
import { CashFlowPanel } from '@/components/dashboard/CashFlowPanel';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';

const SIDEBAR = [
  { icon: '📊', label: 'لوحة التحكم', href: '/dashboard', act: true },
  { icon: '🛒', label: 'المبيعات', href: '/sales' },
  { icon: '📦', label: 'المشتريات', href: '/purchases' },
  { icon: '🏭', label: 'التصنيع', href: '/manufacturing' },
  { icon: '📋', label: 'المحاسبة', href: '/accounting' },
  { icon: '📈', label: 'التقارير', href: '/reports' },
  { icon: '🔔', label: 'الإشعارات', href: '/notifications' },
  { icon: '👤', label: 'المستخدمين', href: '/users' },
  { icon: '⚙️', label: 'الإعدادات', href: '/settings' },
];

export function DashboardPageContentV2() {
  const router = useRouter();
  const { isAdmin } = usePermission();
  const { visiblePanels } = useDashboard();
  const { debouncedDate } = useDate();
  const { stats, refresh } = useDashboardStats();

  const handleLogout = () => {
    api.clearAuth();
    router.push('/login');
  };

  const panelComponents: Record<string, React.ReactNode> = {
    'account-balances': <AccountBalancesPanel key="account-balances" />,
    'ar-aging': <ARAgingPanel key="ar-aging" />,
    'ap-aging': <APAgingPanel key="ap-aging" />,
    'revenue-expenses': <RevenueExpensesPanel key="revenue-expenses" />,
    'cash-flow': <CashFlowPanel key="cash-flow" />,
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    return 'مساء الخير';
  })();

  const summaryCards = stats
    ? [
        { label: 'المبيعات (شهري)', value: Number(stats.totalSales), icon: <TrendingUp />, color: 'from-emerald-600 to-teal-600' },
        { label: 'المشتريات (شهري)', value: Number(stats.totalPurchases), icon: <Package />, color: 'from-teal-600 to-cyan-600' },
        { label: 'رصيد الخزينة', value: Number(stats.treasuryBalance), icon: <DollarSign />, color: 'from-amber-600 to-yellow-600' },
        { label: 'قيمة المخزون', value: Number(stats.totalStockValue), icon: <Factory />, color: 'from-lime-600 to-emerald-600' },
        { label: 'صافي الربح', value: Number(stats.grossMargin || 0), icon: <Star />, color: 'from-emerald-600 to-green-600' },
        { label: 'أوامر الإنتاج', value: Number(stats.productionCount), icon: <Cog />, color: 'from-rose-600 to-pink-600' },
        { label: 'مستحقات العملاء', value: Number(stats.totalOutstandingAR || 0), icon: <ArrowDownRight />, color: 'from-cyan-600 to-blue-600' },
        { label: 'صيانة متأخرة', value: Number(stats.maintenanceOverdueCount), icon: <Wrench />, color: 'from-red-600 to-rose-600' },
      ]
    : [];

  const col1 = visiblePanels.filter((p) => p.column === 1);
  const col2 = visiblePanels.filter((p) => p.column === 2);
  const col3 = visiblePanels.filter((p) => p.column === 3);

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-[#ecfdf5]" dir="rtl">
      {/* MAIN */}
      <main className="flex-1 overflow-auto px-7 py-6">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">{greeting}، Mostafa</h2>
            <p className="text-xs text-[#6b8378]">
              {new Date(debouncedDate).toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              — لوحة القيادة الصناعية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LiveClock />
            <button
              onClick={refresh}
              title="تحديث"
              className="rounded-lg border border-[#1f2d26] bg-[#121a16] p-2 text-emerald-400 transition hover:bg-emerald-500/10"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="mx-1 h-5 w-px bg-[#1f2d26]" />
            <NotificationBell />
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-chatbot'))}
              className="rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 px-2.5 py-2 text-xs text-emerald-300 hover:from-emerald-500/30"
            >
              <Bot className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push('/dashboard/control-tower')}
              className="rounded-lg border border-teal-500/20 bg-gradient-to-r from-teal-600/20 to-teal-500/10 px-2.5 py-2 text-xs text-teal-300 hover:from-teal-500/30"
            >
              <Radar className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="rounded-lg border border-[#1f2d26] bg-[#121a16] p-2 text-emerald-500 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {summaryCards.map((c) => (
            <StatsCard key={c.label} label={c.label} value={c.value} icon={c.icon} color={c.color} />
          ))}
        </div>

        {/* CHART + ATTENDANCE */}
        <div className="mb-5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          <div className="rounded-xl border border-[#1f2d26] bg-[#121a16] p-5 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-4 w-1 rounded bg-emerald-500" />
              <h3 className="text-sm font-bold text-white">اتجاه المبيعات</h3>
              {stats && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                  إجمالي: {Number(stats.totalSales).toLocaleString('ar-EG')} ج.م
                </span>
              )}
            </div>
            <SalesTrendChart data={stats?.salesTrend || []} />
          </div>
          <div className="rounded-xl border border-[#1f2d26] bg-[#121a16] p-5">
            <AttendanceWidget summary={stats?.attendanceSummary} />
          </div>
        </div>

        {/* TOP LISTS */}
        <div className="mb-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#1f2d26] bg-[#121a16] p-5">
            <TopList items={stats?.topCustomers || []} labelKey="name" valueKey="total" title="أفضل العملاء" icon={<Trophy className="h-4 w-4" />} color="from-amber-500 to-orange-500" />
          </div>
          <div className="rounded-xl border border-[#1f2d26] bg-[#121a16] p-5">
            <TopList items={stats?.topProducts || []} labelKey="name" valueKey="total" title="أفضل المنتجات" icon={<ShoppingCart className="h-4 w-4" />} color="from-emerald-500 to-teal-500" />
          </div>
          <div className="rounded-xl border border-[#1f2d26] bg-[#121a16] p-5">
            <TransactionsTimeline sales={stats?.latestSales} purchases={stats?.latestPurchases} />
          </div>
          <div className="rounded-xl border border-[#1f2d26] bg-[#121a16] p-5">
            <LowStockPanel />
          </div>
        </div>

        {/* CUSTOMIZABLE PANELS */}
        <div className="mb-4">
          <DashboardToolbar />
        </div>
        <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-5">
            {col1.map((p) => (
              <div key={p.id} className="rounded-xl border border-[#1f2d26] bg-[#121a16] p-5">
                {panelComponents[p.id]}
              </div>
            ))}
          </div>
          <div className="space-y-5">
            {col2.map((p) => (
              <div key={p.id} className="rounded-xl border border-[#1f2d26] bg-[#121a16] p-5">
                {panelComponents[p.id]}
              </div>
            ))}
          </div>
          <div className="space-y-5">
            {col3.map((p) => (
              <div key={p.id} className="rounded-xl border border-[#1f2d26] bg-[#121a16] p-5">
                {panelComponents[p.id]}
              </div>
            ))}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-1 rounded bg-emerald-500" />
            <h3 className="text-base font-bold text-white">الوصول السريع</h3>
          </div>
          <QuickActions router={router} isAdmin={isAdmin} />
        </div>
      </main>
    </div>
  );
}

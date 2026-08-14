'use client';

import { useRouter } from 'next/navigation';
import { usePermission } from '@/lib/usePermission';
import { useDashboard } from '@/lib/dashboard/dashboard-context';
import { useDate } from '@/lib/dashboard/date-context';
import { api } from '@/lib/api';
import { TrendingUp, Package, DollarSign, Factory, Cog, Wrench, Bot, Radar, Trophy, Star, BarChart3, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useDashboardStats } from '@/hooks/dashboard/useDashboardStats';
import { DashboardToolbar } from '@/components/dashboard/DashboardToolbar';
import { RefreshCw } from 'lucide-react';
import { AccountBalancesPanel } from '@/components/dashboard/AccountBalancesPanel';
import { ARAgingPanel } from '@/components/dashboard/ARAgingPanel';
import { APAgingPanel } from '@/components/dashboard/APAgingPanel';
import { RevenueExpensesPanel } from '@/components/dashboard/RevenueExpensesPanel';
import { CashFlowPanel } from '@/components/dashboard/CashFlowPanel';
import { CustomizeDialog } from '@/components/dashboard/CustomizeDialog';
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber';
import { LiveClock } from '@/components/dashboard/LiveClock';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { FloatingOrbs } from '@/components/dashboard/FloatingOrbs';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { AttendanceWidget } from '@/components/dashboard/AttendanceWidget';
import { TopList } from '@/components/dashboard/TopList';
import { TransactionsTimeline } from '@/components/dashboard/TransactionsTimeline';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LowStockPanel } from '@/components/dashboard/LowStockPanel';

export function DashboardPageContent() {
  const router = useRouter();
  const { isAdmin } = usePermission();
  const { visiblePanels, isCustomizing } = useDashboard();
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

  const col1 = visiblePanels.filter((p) => p.column === 1);
  const col2 = visiblePanels.filter((p) => p.column === 2);
  const col3 = visiblePanels.filter((p) => p.column === 3);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    return 'مساء الخير';
  })();

  const summaryCards = stats ? [
    { label: 'المبيعات (هذا الشهر)', value: Number(stats.totalSales), icon: <TrendingUp />, color: 'from-emerald-600 to-teal-600', badge: 'شهري' },
    { label: 'المشتريات (هذا الشهر)', value: Number(stats.totalPurchases), icon: <Package />, color: 'from-blue-600 to-cyan-600', badge: 'شهري' },
    { label: 'صافي الربح', value: Number(stats.grossMargin || 0), icon: <BarChart3 />, color: 'from-teal-600 to-emerald-600', badge: 'شهري' },
    { label: 'رصيد الخزينة', value: Number(stats.treasuryBalance), icon: <DollarSign />, color: 'from-violet-600 to-purple-600', badge: 'حالي' },
    { label: 'قيمة المخزون', value: Number(stats.totalStockValue), icon: <Factory />, color: 'from-amber-600 to-orange-600', badge: 'تقديري' },
    { label: 'المبالغ المستحقة', value: Number(stats.totalOutstandingAR || 0), icon: <ArrowDownRight />, color: 'from-cyan-600 to-blue-600', badge: 'عملاء' },
    { label: 'أوامر الإنتاج', value: Number(stats.productionCount), icon: <Cog />, color: 'from-rose-600 to-pink-600', badge: 'هذا الشهر' },
    { label: 'أموال للموردين', value: Number(stats.totalOutstandingAP || 0), icon: <ArrowUpRight />, color: 'from-orange-600 to-red-600', badge: 'موردين' },
    { label: 'صيانة متأخرة', value: Number(stats.maintenanceOverdueCount), icon: <Wrench />, color: 'from-red-600 to-rose-600', badge: 'متأخر' },
  ] : [];

  return (
    <div className="min-h-screen text-slate-100" dir="rtl">
      <FloatingOrbs />

      <header className="relative z-50 bg-slate-900/70 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/20">
                <span className="text-base font-black text-white">م</span>
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-100 to-purple-200">
                نظام المصطفى
              </h1>
              <p className="text-[9px] text-slate-600 -mt-0.5">نظام إدارة متكامل</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <LiveClock />
            <button onClick={refresh} title="تحديث البيانات" className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-5 bg-white/5 mx-1" />
            <NotificationBell />
              <button onClick={() => { const e = new CustomEvent('toggle-chatbot'); window.dispatchEvent(e); }}
                className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 hover:from-emerald-500/30 hover:to-emerald-400/20 text-emerald-300 rounded-xl text-[11px] transition border border-emerald-500/20 flex items-center gap-1.5">
                <Bot />
              </button>
              <button onClick={() => router.push('/dashboard/control-tower')}
                className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 hover:from-indigo-500/30 hover:to-indigo-400/20 text-indigo-300 rounded-xl text-[11px] transition border border-indigo-500/20 flex items-center gap-1.5">
                <Radar />
              </button>
            <div className="w-px h-5 bg-white/5 mx-1" />
            <button onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="تسجيل الخروج">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-6 pt-5 pb-12">
        <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 border border-white/5 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-7 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              <h2 className="text-xl md:text-2xl font-black text-white">{greeting}، Mostafa</h2>
            </div>
            <p className="text-sm text-slate-500 mr-4 mb-5">
              {new Date(debouncedDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            {summaryCards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {summaryCards.map((card) => (
                  <div key={card.label}
                    className="relative group/card bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/5 p-3 overflow-hidden hover:border-white/15 transition-all duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover/card:opacity-[0.08] transition-opacity duration-500`} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base">{card.icon}</span>
                        <span className="text-[8px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded-full">{card.badge}</span>
                      </div>
                      <p className="text-sm md:text-base font-black text-white tabular-nums">
                        <AnimatedNumber value={card.value} suffix=" ج.م" />
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{card.label}</p>
                    </div>
                    <div className={`absolute bottom-0 left-2 right-2 h-[1.5px] bg-gradient-to-r ${card.color} scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500 origin-right rounded-full`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />
              <h3 className="text-sm font-bold text-white">اتجاه المبيعات</h3>
              {stats && (
                <span className="text-[10px] text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
                  إجمالي: {Number(stats.totalSales).toLocaleString()} ج.م
                </span>
              )}
            </div>
            <SalesTrendChart data={stats?.salesTrend || []} />
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
            <AttendanceWidget summary={stats?.attendanceSummary} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
            <TopList
              items={stats?.topCustomers || []}
              labelKey="name"
              valueKey="total"
              title="أفضل العملاء"
              icon={<Trophy />}
              color="from-amber-500 to-orange-500"
            />
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
            <TopList
              items={stats?.topProducts || []}
              labelKey="name"
              valueKey="total"
              title="أفضل المنتجات"
              icon={<Star />}
              color="from-violet-500 to-purple-500"
            />
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
            <TransactionsTimeline sales={stats?.latestSales} purchases={stats?.latestPurchases} />
          </div>

          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
            <LowStockPanel />
          </div>
        </div>

        <div className="mb-6">
          <DashboardToolbar />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {col1.map((p) => (
              <div key={p.id} className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
                {panelComponents[p.id]}
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {col2.map((p) => (
              <div key={p.id} className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
                {panelComponents[p.id]}
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {col3.map((p) => (
              <div key={p.id} className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
                {panelComponents[p.id]}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full" />
            <h3 className="text-base font-bold text-white">الوصول السريع</h3>
          </div>
          <QuickActions router={router} isAdmin={isAdmin} />
        </div>
      </main>

      {isCustomizing && <CustomizeDialog />}
    </div>
  );
}

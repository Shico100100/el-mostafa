'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { usePermission } from '@/lib/usePermission';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

interface DashboardStats {
    totalSales: number;
    totalPurchases: number;
    treasuryBalance: number;
    productionCount: number;
    maintenanceOverdueCount: number;
    totalStockValue?: number;
    attendanceSummary?: {
        present: number;
        late: number;
        absent: number;
        total: number;
    };
    topCustomers?: { name: string; total: number }[];
    topProducts?: { name: string; total: number }[];
    latestSales: { id: number; created_at: string; total_amount: number; customer?: { name: string } }[];
    latestPurchases: { id: number; created_at: string; total_amount: number; supplier?: { name: string } }[];
}

interface Trend {
    month: string;
    sales: number;
    purchases: number;
    production: number;
}

interface InventoryValue {
    name: string;
    value: number;
}

interface StockAlert {
    id: number;
    current_stock: number;
    reorder_point: number;
    product: {
        name: string;
        unit: string;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const { isAdmin } = usePermission();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalSales: 0,
        totalPurchases: 0,
        treasuryBalance: 0,
        productionCount: 0,
        maintenanceOverdueCount: 0,
        latestSales: [],
        latestPurchases: [],
    });
    const [trends, setTrends] = useState<Trend[]>([]);
    const [inventoryValue, setInventoryValue] = useState<InventoryValue[]>([]);
    const [alerts, setAlerts] = useState<StockAlert[]>([]);

    const loadStats = useCallback(async () => {
        try {
            const [statsData, trendsData, invData] = await Promise.allSettled([
                api.getDashboardStats(),
                api.getTrends(),
                api.getInventoryValueReport()
            ]);

            if (statsData.status === 'fulfilled') setStats(statsData.value);
            else console.error('Error loading dashboard stats:', statsData.reason);

            if (trendsData.status === 'fulfilled') setTrends(trendsData.value);
            else console.error('Error loading trends:', trendsData.reason);

            if (invData.status === 'fulfilled') setInventoryValue(invData.value);
            else console.error('Error loading inventory value:', invData.reason);

            try {
                const alertsData = await api.fetchWithAuth('/v1/manufacturing/accessories/alerts');
                setAlerts(alertsData);
            } catch (err) {
                console.error('Failed to load alerts', err);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            loadStats();
        }
    }, [router, loadStats]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div className="min-h-screen text-slate-100" dir="rtl">
            {/* Header */}
            <header className="fixed w-full z-50 glass border-b-0">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-xl">🏭</span>
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
                            نظام إدارة المصنع
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded-lg transition border border-red-500/20 hover:border-red-500/40"
                        >
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 pt-28 pb-12">
                {/* Welcome Section */}
                <div className="mb-10">
                    <h2 className="text-3xl font-bold text-white mb-2">مرحباً بك 👋</h2>
                    <p className="text-slate-400">نظرة عامة على أداء المصنع اليوم</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                    <StatCard
                        title="المبيعات (هذا الشهر)"
                        value={`${(stats.totalSales || 0).toLocaleString()} ج.م`}
                        icon="💰"
                        trend="+12%"
                        color="blue"
                    />
                    <StatCard
                        title="المشتريات (هذا الشهر)"
                        value={`${(stats.totalPurchases || 0).toLocaleString()} ج.م`}
                        icon="🛒"
                        trend="-5%"
                        color="purple"
                    />
                    <StatCard
                        title="قيمة المخزون"
                        value={`${(stats.totalStockValue || 0).toLocaleString()} ج.م`}
                        icon="📦"
                        color="orange"
                    />
                    <StatCard
                        title="رصيد الخزينة"
                        value={`${(stats.treasuryBalance || 0).toLocaleString()} ج.م`}
                        icon="🏦"
                        color="emerald"
                    />
                    <StatCard
                        title="الحضور اليوم"
                        value={`${stats.attendanceSummary?.present || 0} / ${stats.attendanceSummary?.total || 0}`}
                        icon="👥"
                        color="indigo"
                    />
                </div>

                {/* Trends & Top Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                    {/* Main Sales Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Charts Row 1 */}
                        {/* Sales vs Purchases Trend */}
                        <div className="glass p-6 rounded-2xl border border-white/5 h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></span>
                                    المبيعات مقابل المشتريات
                                </h3>
                                <div className="flex gap-4 text-xs font-bold">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> مبيعات</div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> مشتريات</div>
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="5 5" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="month" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                            itemStyle={{ fontSize: '12px' }}
                                        />
                                        <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        <Area type="monotone" dataKey="purchases" name="المشتريات" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Production Chart */}
                        <div className="glass p-6 rounded-2xl border border-white/5 h-[300px]">
                            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                                نشاط الإنتاج (عدد القطع)
                            </h3>
                            <div className="h-60 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#ffffff05' }}
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                                        />
                                        <Bar dataKey="production" name="الإنتاج" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Performers Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Top Customers */}
                            <div className="glass p-6 rounded-2xl border border-white/5">
                                <h3 className="text-white font-bold mb-6 text-sm flex items-center gap-2">
                                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                                    أفضل العملاء (هذا الشهر)
                                </h3>
                                <div className="space-y-4">
                                    {stats.topCustomers?.map((c: { name: string; total: number }, i: number) => (
                                        <div key={i} className="group">
                                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                                                <span className="text-slate-200">{c.name}</span>
                                                <span className="text-emerald-400 font-bold">{Number(c.total).toLocaleString()} ج.م</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 group-hover:brightness-125"
                                                    style={{ width: `${(c.total / (stats.topCustomers?.[0]?.total || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Top Products */}
                            <div className="glass p-6 rounded-2xl border border-white/5">
                                <h3 className="text-white font-bold mb-6 text-sm flex items-center gap-2">
                                    <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                                    الأكثر مبيعاً (كمية)
                                </h3>
                                <div className="space-y-4">
                                    {stats.topProducts?.map((p: { name: string; total: number }, i: number) => (
                                        <div key={i} className="group">
                                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                                                <span className="text-slate-200">{p.name}</span>
                                                <span className="text-orange-400 font-bold">{Number(p.total).toLocaleString()} وحدة</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 group-hover:brightness-125"
                                                    style={{ width: `${(p.total / (stats.topProducts?.[0]?.total || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Recent Activity & Attendance */}
                    <div className="space-y-6">
                        {/* Inventory Value Distribution */}
                        <div className="glass p-6 rounded-2xl border border-white/5 h-[350px]">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                                توزيع قيمة المخزون
                            </h3>
                            <div className="h-64 w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={inventoryValue as never}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        >
                                            {inventoryValue.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Attendance Pulse */}
                        <div className="glass p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
                            <h3 className="text-white font-bold mb-6 flex justify-between items-center text-sm">
                                <span>حالة الحضور والغياب</span>
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full ring-1 ring-emerald-500/30">محدث الآن</span>
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 mb-1 font-bold">حاضر</p>
                                    <p className="text-lg font-black text-emerald-400">{stats.attendanceSummary?.present || 0}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 mb-1 font-bold">متأخر</p>
                                    <p className="text-lg font-black text-amber-400">{stats.attendanceSummary?.late || 0}</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-slate-500 mb-1 font-bold">غائب</p>
                                    <p className="text-lg font-black text-rose-400">{stats.attendanceSummary?.absent || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions List */}
                        <div className="glass p-6 rounded-2xl border border-white/5 h-[400px] flex flex-col shadow-inner">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                                    آخر العمليات
                                </h3>
                                <button className="text-[10px] text-blue-400 hover:underline">عرض الكل</button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-1">
                                {([...stats.latestSales, ...stats.latestPurchases] as any[]) // eslint-disable-line @typescript-eslint/no-explicit-any
                                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // eslint-disable-line @typescript-eslint/no-explicit-any
                                    .slice(0, 10)
                                    .map((op: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                        <div key={`${op.id}-${op.created_at}`} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition border border-white/[0.02] hover:border-white/10 group shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-lg ${op.customer ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-purple-500/20 text-purple-400 border border-purple-500/20'}`}>
                                                    {op.customer ? '💰' : '🚚'}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-slate-200 font-bold text-[11px] truncate w-24 group-hover:text-white transition-colors">{op.customer?.name || op.supplier?.name}</p>
                                                    <p className="text-slate-500 text-[9px] font-mono">{new Date(op.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-black text-[11px] ${op.customer ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {op.customer ? '+' : '-'}{Number(op.total_amount).toLocaleString()}
                                                </p>
                                                <p className="text-[8px] text-slate-600 text-left font-bold uppercase tracking-tighter">ج.م</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts Section */}
                {alerts.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-8 bg-red-500 rounded-full"></span>
                            تنبيهات نواقص الأكسسوارات
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {alerts.map((item: StockAlert) => (
                                <div key={item.id} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-bold">{item.product.name}</h4>
                                        <p className="text-sm text-red-300">
                                            الرصيد الحالي: {item.current_stock} {item.product.unit}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">حد الطلب</p>
                                        <p className="font-bold text-white">{item.reorder_point}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Maintenance Alerts */}
                {stats.maintenanceOverdueCount > 0 && (
                    <div className="mb-10 animate-pulse">
                        <div
                            onClick={() => router.push('/manufacturing/maintenance')}
                            className="bg-red-500/20 border border-red-500/30 p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-red-500/30 transition"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">⚠️</span>
                                <div>
                                    <h3 className="text-white font-bold text-lg">تنبيه صيانة الماكينات</h3>
                                    <p className="text-red-200">يوجد عدد ({stats.maintenanceOverdueCount}) ماكينات تخطت موعد الصيانة المحدد.</p>
                                </div>
                            </div>
                            <span className="text-white font-bold px-4 py-2 bg-red-500 rounded-lg">إدارة الصيانة</span>
                        </div>
                    </div>
                )}

                {/* Quick Actions Grid */}
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
                    الوصول السريع
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <QuickAction
                        icon="📦"
                        label="المنتجات والمخزن"
                        desc="إدارة المنتجات والمواد"
                        onClick={() => router.push('/inventory/products')}
                        color="blue"
                    />
                    <QuickAction
                        icon="🪣"
                        label="مخزن البلاستيك"
                        desc="مخزون المنتجات البلاستيكية"
                        onClick={() => router.push('/inventory/semi-finished')}
                        color="cyan"
                    />
                    <QuickAction
                        icon="👥"
                        label="العملاء"
                        desc="قائمة العملاء والديون"
                        onClick={() => router.push('/sales/customers')}
                        color="indigo"
                    />
                    <QuickAction
                        icon="🛰️"
                        label="برج المراقبة"
                        desc="تحليلات المؤشرات العامة"
                        onClick={() => router.push('/dashboard/control-tower')}
                        color="indigo"
                    />
                    <QuickAction
                        icon="🧾"
                        label="أوامر البيع"
                        desc="تسجيل فواتير البيع"
                        onClick={() => router.push('/sales/orders')}
                        color="orange"
                    />
                    <QuickAction
                        icon="↩️"
                        label="مرتجعات مبيعات"
                        desc="إرجاع أصناف لعميل"
                        onClick={() => router.push('/sales/returns')}
                        color="rose"
                    />
                    <QuickAction
                        icon="🏭"
                        label="الموردين"
                        desc="الموردين والمشتريات"
                        onClick={() => router.push('/purchases/suppliers')}
                        color="violet"
                    />
                    <QuickAction
                        icon="🛒"
                        label="أوامر الشراء"
                        desc="تسجيل فواتير الشراء"
                        onClick={() => router.push('/purchases/orders')}
                        color="teal"
                    />
                    <QuickAction
                        icon="↪️"
                        label="مرتجعات مشتريات"
                        desc="إرجاع أصناف لمورد"
                        onClick={() => router.push('/purchases/returns')}
                        color="amber"
                    />
                    <QuickAction
                        icon="🏗️"
                        label="الإنتاج"
                        desc="أوامر التصنيع"
                        onClick={() => router.push('/manufacturing')}
                        color="fuchsia"
                    />
                    <QuickAction
                        icon="🛠️"
                        label="الصيانة"
                        desc="صيانة الماكينات"
                        onClick={() => router.push('/manufacturing/maintenance')}
                        color="orange"
                    />
                    <QuickAction
                        icon="⚙️"
                        label="التجميع"
                        desc="أقسام التجميع"
                        onClick={() => router.push('/assembly')}
                        color="pink"
                    />
                    <QuickAction
                        icon="💰"
                        label="الحسابات"
                        desc="القيود والتقارير"
                        onClick={() => router.push('/accounting')}
                        color="emerald"
                    />
                    <QuickAction
                        icon="📈"
                        label="التقارير"
                        desc="تحليلات الأداء"
                        onClick={() => router.push('/reports')}
                        color="cyan"
                    />
                    <QuickAction
                        icon="💵"
                        label="الرواتب"
                        desc="مسير الرواتب والموظفين"
                        onClick={() => router.push('/hr/payroll')}
                        color="emerald"
                    />
                    <QuickAction
                        icon="🚧"
                        label="تحت التطوير"
                        desc="الصفحات قيد الإنشاء"
                        onClick={() => router.push('/dashboard/underupgrade')}
                        color="slate"
                    />

                    {isAdmin && (
                        <>
                            <QuickAction
                                icon="👤"
                                label="المستخدمين"
                                desc="إدارة الصلاحيات"
                                onClick={() => router.push('/users')}
                                color="rose"
                            />
                            <QuickAction
                                icon="📜"
                                label="سجل العمليات"
                                desc="متابعة التحركات"
                                onClick={() => router.push('/audit')}
                                color="orange"
                            />
                            <QuickAction
                                icon="⚙️"
                                label="الإعدادات"
                                desc="ضبط النظام"
                                onClick={() => router.push('/settings')}
                                color="slate"
                            />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function StatCard({ title, value, icon, trend, color }: { title: string; value: string; icon: string; trend?: string; color: string }) {
    const gradients: Record<string, string> = {
        blue: "from-blue-500/10 to-blue-600/10 border-blue-500/20",
        purple: "from-purple-500/10 to-purple-600/10 border-purple-500/20",
        emerald: "from-emerald-500/10 to-emerald-600/10 border-emerald-500/20",
        orange: "from-orange-500/10 to-orange-600/10 border-orange-500/20",
    };

    return (
        <div className={`glass glass-hover p-6 rounded-2xl border ${gradients[color] || gradients.blue} bg-gradient-to-br`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-xl text-2xl">{icon}</div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

function QuickAction({ icon, label, desc, onClick, color }: { icon: string; label: string; desc: string; onClick: () => void; color: string }) {
    const borders: Record<string, string> = {
        blue: "hover:border-blue-500/50 hover:shadow-blue-500/20",
        indigo: "hover:border-indigo-500/50 hover:shadow-indigo-500/20",
        violet: "hover:border-violet-500/50 hover:shadow-violet-500/20",
        fuchsia: "hover:border-fuchsia-500/50 hover:shadow-fuchsia-500/20",
        emerald: "hover:border-emerald-500/50 hover:shadow-emerald-500/20",
        cyan: "hover:border-cyan-500/50 hover:shadow-cyan-500/20",
        rose: "hover:border-rose-500/50 hover:shadow-rose-500/20",
        slate: "hover:border-slate-500/50 hover:shadow-slate-500/20",
        orange: "hover:border-orange-500/50 hover:shadow-orange-500/20",
        teal: "hover:border-teal-500/50 hover:shadow-teal-500/20",
    };

    return (
        <button
            onClick={onClick}
            className={`glass glass-hover p-4 rounded-xl text-right group border border-white/5 transition-all duration-300 ${borders[color]}`}
        >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{icon}</div>
            <h4 className="text-white font-bold mb-1 group-hover:text-blue-300 transition-colors">{label}</h4>
            <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{desc}</p>
        </button>
    );
}

interface Notification {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    actionType?: string;
    actionData?: { movementId?: number; orderId?: number };
}

function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastNotificationId = useRef<number | null>(null);

    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    };

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await api.getNotifications();
            const notificationsArray: Notification[] = Array.isArray(data) ? data : [];
            setNotifications(notificationsArray);
            const newUnreadCount = notificationsArray.filter((n) => !n.isRead).length;
            setUnreadCount(newUnreadCount);

            // Show browser notification for the latest one if it's new
            if (notificationsArray.length > 0) {
                const latest = notificationsArray[0];
                if (lastNotificationId.current !== null && latest.id > lastNotificationId.current && !latest.isRead) {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new window.Notification(latest.title, {
                            body: latest.message,
                            icon: '/favicon.ico'
                        });
                    }
                }
                lastNotificationId.current = latest.id;
            } else {
                lastNotificationId.current = 0;
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        }
    }, []);

    useEffect(() => {
        requestNotificationPermission();
        const initialFetch = setTimeout(fetchNotifications, 0);
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        return () => {
            clearTimeout(initialFetch);
            clearInterval(interval);
        };
    }, [fetchNotifications]);

    const handleApprove = useCallback(async (notification: Notification) => {
        try {
            // Execute the action based on actionType
            if (notification.actionType === 'delete_movement') {
                const movementId = notification.actionData?.movementId;
                await api.deleteStockMovement(movementId!);
                alert(`تم حذف حركة المخزون بنجاح`);
            } else if (notification.actionType === 'delete_order') {
                const orderId = notification.actionData?.orderId;
                await api.fetchWithAuth(`/v1/purchases/orders/${orderId}`, {
                    method: 'DELETE'
                });
                alert(`تم حذف أمر الشراء بنجاح`);
            } else {
                alert(`تمت الموافقة على: ${notification.title}`);
            }

            // Mark as read
            await api.markNotificationAsRead(notification.id);

            // Reload notifications
            fetchNotifications();
        } catch (error) {
            console.error('Error approving:', error);
            alert('حدث خطأ أثناء الموافقة');
        }
    }, [fetchNotifications]);

    const handleReject = useCallback(async (notification: Notification) => {
        try {
            // Mark as read
            await api.markNotificationAsRead(notification.id);

            alert(`تم رفض: ${notification.title}`);
            // Reload notifications
            fetchNotifications();
        } catch (error) {
            console.error('Error rejecting:', error);
            alert('حدث خطأ أثناء الرفض');
        }
    }, [fetchNotifications]);

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 border border-slate-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute left-0 mt-4 w-96 glass rounded-2xl shadow-2xl overflow-hidden z-50 border border-white/10">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="text-white font-bold">الإشعارات</h3>
                        <button onClick={() => setShowDropdown(false)} className="text-slate-400 hover:text-white transition">✕</button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <span className="text-4xl block mb-2">🔕</span>
                                لا توجد إشعارات جديدة
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-white/5 ${!notification.isRead ? 'bg-blue-500/5 relative' : ''}`}
                                >
                                    {!notification.isRead && (
                                        <div className="absolute top-4 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                                    )}
                                    <h4 className={`text-sm font-bold mb-1 ${!notification.isRead ? 'text-blue-300' : 'text-slate-300'}`}>
                                        {notification.title}
                                    </h4>
                                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">{notification.message}</p>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-3">
                                        🕒 {new Date(notification.createdAt).toLocaleString('ar-EG')}
                                    </span>

                                    {!notification.isRead && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleApprove(notification)}
                                                className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded text-xs font-medium transition"
                                            >
                                                ✓ موافقة
                                            </button>
                                            <button
                                                onClick={() => handleReject(notification)}
                                                className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded text-xs font-medium transition"
                                            >
                                                ✗ رفض
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-2 border-t border-white/10 bg-white/5 text-center">
                        {/* <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">عرض كل الإشعارات</button> */}
                        <span className="text-xs text-gray-400">لا توجد إشعارات أخرى</span>
                    </div>
                </div>
            )}
        </div>
    );
}

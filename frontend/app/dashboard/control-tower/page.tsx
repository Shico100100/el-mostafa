'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Trend {
    month: string;
    sales: number;
    purchases: number;
    production: number;
}

interface InventoryValue {
    [key: string]: unknown;
    name: string;
    value: number;
}

interface Stats {
    totalValue: number;
    productCount: number;
    lowStockItems: unknown[];
}

export default function ControlTower() {
    const [trends, setTrends] = useState<Trend[]>([]);
    const [inventoryValue, setInventoryValue] = useState<InventoryValue[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [trendsData, invValueData, stockData] = await Promise.all([
                api.getTrends(),
                api.getInventoryValueReport(),
                api.getStockReport()
            ]);
            setTrends(trendsData);
            setInventoryValue(invValueData);
            setStats(stockData);
        } catch (err) {
            console.error('Failed to load control tower data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-slate-200 p-8 pt-24" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                            برج المراقبة (Control Tower)
                        </h1>
                        <p className="text-slate-400 mt-2 font-medium">نظرة شاملة ومؤشرات الأداء الرئيسية للمصنع</p>
                    </div>
                </div>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <MetricCard title="قيمة المخزون" value={stats?.totalValue || 0} unit="ج.م" icon="💰" color="blue" />
                    <MetricCard title="إجمالي الأصناف" value={stats?.productCount || 0} unit="صنف" icon="📦" color="indigo" />
                    <MetricCard title="عجز في خطة الإنتاج" value={stats?.lowStockItems?.length || 0} unit="صنف" icon="⚠️" color="rose" />
                    <MetricCard title="معدل النمو الشهري" value="+12%" unit="مبيعات" icon="📈" color="emerald" />
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sales vs Purchases Trend */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">المبيعات مقابل المشتريات 💹</h2>
                            <div className="flex gap-4 text-xs font-bold">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> مبيعات</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> مشتريات</div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', textAlign: 'right' }}
                                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                    <Area type="monotone" dataKey="purchases" name="المشتريات" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Production Output Trend */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl group">
                        <h2 className="text-xl font-bold mb-6">نشاط الإنتاج (عدد القطع) 🏭</h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', textAlign: 'right' }}
                                    />
                                    <Bar dataKey="production" name="الإنتاج" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Inventory Value Distribution */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">توزيع قيمة المخزون 💎</h2>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={inventoryValue}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                        label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {inventoryValue.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Alerts & Stats Summary */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-center">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                <span className="text-slate-400">قيمة المبيعات هذا الشهر</span>
                                <span className="text-xl font-bold text-indigo-400">{trends[trends.length - 1]?.sales?.toLocaleString()} ج.م</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                <span className="text-slate-400">قيمة المشتريات هذا الشهر</span>
                                <span className="text-xl font-bold text-rose-400">{trends[trends.length - 1]?.purchases?.toLocaleString()} ج.م</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-rose-500/20">
                                <span className="text-slate-400">أصناف تحتاج إعادة طلب</span>
                                <span className="text-xl font-bold text-rose-500">{stats?.lowStockItems?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: string | number;
    unit: string;
    icon: string;
    color: 'blue' | 'indigo' | 'rose' | 'emerald';
}

function MetricCard({ title, value, unit, icon, color }: MetricCardProps) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };

    return (
        <div className={`bg-white/5 border rounded-3xl p-6 backdrop-blur-xl transition hover:bg-white/10 group ${colors[color] || colors.blue}`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{icon}</span>
                <span className="opacity-0 group-hover:opacity-100 transition">↗️</span>
            </div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
                <span className="text-xs font-bold opacity-60 uppercase">{unit}</span>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import * as XLSX from 'xlsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface Sale {
    id: number;
    order_date?: string;
    created_at: string;
    customer?: { name: string };
    total_amount: number;
    status: string;
    items: { quantity: number; product: { cost_price: number } }[];
}

interface Purchase {
    id: number;
    order_date?: string;
    created_at: string;
    supplier?: { name: string };
    total_amount: number;
    status: string;
}

interface ProductReportItem {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    type: string;
    selling_price: number;
    cost_price: number;
    min_stock: number;
}

interface ReportData {
    sales?: Sale[];
    purchases?: Purchase[];
    allProducts?: ProductReportItem[];
    totalSales?: number;
    salesCount?: number;
    totalPurchases?: number;
    purchasesCount?: number;
    totalValue?: number;
    productCount?: number;
    lowStockItems?: ProductReportItem[];
    totalCOGS?: number;
    grossProfit?: number;
    totalFixedCosts?: number;
    netProfit?: number;
}

interface AnalyticsData {
    inventory: { name: string; value: number }[];
    sales: { name: string; value: number }[];
}

interface ShipmentProfit {
    purchase_order_id: number;
    supplier_name: string;
    order_date: string;
    total_amount: number;
    total_landed_cost: number;
    exchange_rate: number;
    total_weight_kg: number;
    total_items_purchased: number;
    total_items_sold: number;
    scrap_qty: number;
    sales_revenue: number;
    total_cogs: number;
    gross_profit: number;
    net_profit: number;
    margin_percent: number;
    items: Array<{
        product_id: number;
        product_name: string;
        quantity_purchased: number;
        quantity_sold: number;
        unit_cost: number;
        total_cogs: number;
        landed_cost_allocated: number;
        revenue: number;
        profit: number;
        margin_percent: number;
    }>;
}

export default function ReportsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('SALES');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ReportData | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData>({ inventory: [], sales: [] });
    const [shipmentProfit, setShipmentProfit] = useState<{ shipments: ShipmentProfit[]; summary: Record<string, unknown> } | null>(null);

    // Filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const loadReport = useCallback(async () => {
        setLoading(true);
        try {
            let result: ReportData | null = null;
            switch (activeTab) {
                case 'SALES':
                    result = await api.getSalesReport({ startDate, endDate });
                    break;
                case 'PURCHASES':
                    result = await api.getPurchaseOrders();
                    break;
                case 'STOCK':
                    result = await api.getStockReport();
                    break;
                case 'PROFIT_LOSS':
                    result = await api.getProfitLossReport({ startDate, endDate });
                    break;
                case 'ANALYTICS':
                    const [inventory, sales] = await Promise.all([
                        api.getInventoryValueReport(),
                        api.getSalesByCategoryReport({ startDate, endDate })
                    ]);
                    setAnalytics({ inventory, sales });
                    break;
                case 'SHIPMENT_PROFIT':
                    const sp = await api.getShipmentProfitability(startDate, endDate);
                    setShipmentProfit(sp);
                    break;
            }
            setData(result);
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, startDate, endDate]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadReport();
    }, [router, loadReport]);

    const exportToExcel = () => {
        if (!data && activeTab !== 'ANALYTICS' && activeTab !== 'SHIPMENT_PROFIT') return;

        let exportData: Array<Record<string, string | number | undefined>> = [];
        let fileName = `Report_${activeTab}_${startDate}_to_${endDate}.xlsx`;

        switch (activeTab) {
            case 'SALES':
                exportData = (data?.sales || []).map((s: Sale) => ({
                    'التاريخ': new Date(s.order_date || s.created_at).toLocaleDateString('ar-EG'),
                    'العميل': s.customer?.name,
                    'المبلغ': Number(s.total_amount),
                    'الحالة': s.status
                }));
                break;
            case 'PURCHASES':
                exportData = (data?.purchases || []).map((p: Purchase) => ({
                    'التاريخ': new Date(p.order_date || p.created_at).toLocaleDateString('ar-EG'),
                    'المورد': p.supplier?.name,
                    'المبلغ': Number(p.total_amount),
                    'الحالة': p.status
                }));
                break;
            case 'STOCK':
                exportData = (data?.allProducts || []).map((p: ProductReportItem) => ({
                    'المنتج': p.name,
                    'الكمية الحالية': p.quantity,
                    'الوحدة': p.unit,
                    'التصنيف': p.type,
                    'سعر البيع': p.selling_price,
                    'تكلفة الوحدة': p.cost_price,
                    'إجمالي القيمة': Number(p.quantity) * Number(p.selling_price)
                }));
                fileName = `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;
            case 'PROFIT_LOSS':
                if (data) {
                    exportData = [
                        { 'البند': 'إجمالي الإيرادات', 'القيمة': data.totalSales },
                        { 'البند': 'تكلفة البضاعة المباعة (COGS)', 'القيمة': data.totalCOGS },
                        { 'البند': 'إجمالي الربح', 'القيمة': data.grossProfit },
                        { 'البند': 'المصاريف التشغيلية', 'القيمة': data.totalFixedCosts },
                        { 'البند': 'صافي الربح', 'القيمة': data.netProfit },
                    ];
                }
                break;
            case 'ANALYTICS':
                exportData = analytics.sales.map((s) => ({ 'القسم': s.name, 'المبيعات': s.value }));
                break;
            case 'SHIPMENT_PROFIT':
                if (shipmentProfit) {
                    exportData = shipmentProfit.shipments.map((s) => ({
                        'الشحنة #': s.purchase_order_id,
                        'المورد': s.supplier_name,
                        'التاريخ': s.order_date ? new Date(s.order_date).toLocaleDateString('ar-EG') : '',
                        'إيرادات': s.sales_revenue,
                        'تكلفة البضاعة': s.total_cogs,
                        'التكلفة الإجمالية': s.total_landed_cost,
                        'الربح الإجمالي': s.gross_profit,
                        'صافي الربح': s.net_profit,
                        'هامش الربح %': s.margin_percent,
                    }));
                }
                break;
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, activeTab);
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">📊 التقارير وتحليلات المبيعات</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('SALES')}
                        className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'SALES' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        المبيعات
                    </button>
                    <button
                        onClick={() => setActiveTab('PURCHASES')}
                        className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'PURCHASES' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        المشتريات
                    </button>
                    <button
                        onClick={() => setActiveTab('STOCK')}
                        className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'STOCK' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        المخزون
                    </button>
                    <button
                        onClick={() => setActiveTab('PROFIT_LOSS')}
                        className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'PROFIT_LOSS' ? 'bg-yellow-600 font-bold text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        الأرباح والخسائر
                    </button>
                    <button
                        onClick={() => setActiveTab('ANALYTICS')}
                        className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'ANALYTICS' ? 'bg-emerald-600 font-bold text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        الرسوم البيانية
                    </button>
                    <button
                        onClick={() => setActiveTab('SHIPMENT_PROFIT')}
                        className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'SHIPMENT_PROFIT' ? 'bg-cyan-600 font-bold text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        ربحية الشحنات 📦
                    </button>
                </div>

                {/* Filters */}
                {activeTab !== 'STOCK' && (
                    <div className="bg-white/5 p-4 rounded-xl mb-8 flex gap-4 items-end">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">من تاريخ</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">إلى تاريخ</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <button
                            onClick={loadReport}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                        >
                            تحديث
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition flex items-center gap-2"
                        >
                            📊 تصدير Excel
                        </button>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="text-center text-white py-12">جاري التحميل...</div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Sales Report */}
                        {activeTab === 'SALES' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                                        <h3 className="text-blue-200 mb-2">إجمالي المبيعات</h3>
                                        <p className="text-3xl font-bold text-white">{Number(data.totalSales).toFixed(2)} ج.م</p>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                                        <h3 className="text-blue-200 mb-2">عدد الطلبات</h3>
                                        <p className="text-3xl font-bold text-white">{data.salesCount}</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl overflow-hidden">
                                    <table className="w-full text-right">
                                        <thead className="bg-white/5 text-gray-300">
                                            <tr>
                                                <th className="p-4">التاريخ</th>
                                                <th className="p-4">العميل</th>
                                                <th className="p-4">المبلغ</th>
                                                <th className="p-4">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-200">
                                            {data.sales?.map((order: Sale) => (
                                                <tr key={order.id} className="border-t border-white/5 hover:bg-white/5">
                                                    <td className="p-4">{new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                                                    <td className="p-4">{order.customer?.name}</td>
                                                    <td className="p-4">{Number(order.total_amount).toFixed(2)}</td>
                                                    <td className="p-4">{order.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Purchases Report */}
                        {activeTab === 'PURCHASES' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
                                        <h3 className="text-purple-200 mb-2">إجمالي المشتريات</h3>
                                        <p className="text-3xl font-bold text-white">{Number(data.totalPurchases).toFixed(2)} ج.م</p>
                                    </div>
                                    <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
                                        <h3 className="text-purple-200 mb-2">عدد الطلبات</h3>
                                        <p className="text-3xl font-bold text-white">{data.purchasesCount}</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl overflow-hidden">
                                    <table className="w-full text-right">
                                        <thead className="bg-white/5 text-gray-300">
                                            <tr>
                                                <th className="p-4">التاريخ</th>
                                                <th className="p-4">المورد</th>
                                                <th className="p-4">المبلغ</th>
                                                <th className="p-4">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-200">
                                            {data.purchases?.map((order: Purchase) => (
                                                <tr key={order.id} className="border-t border-white/5 hover:bg-white/5">
                                                    <td className="p-4">{new Date(order.created_at).toLocaleDateString('ar-EG')}</td>
                                                    <td className="p-4">{order.supplier?.name}</td>
                                                    <td className="p-4">{Number(order.total_amount).toFixed(2)}</td>
                                                    <td className="p-4">{order.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Stock Report */}
                        {activeTab === 'STOCK' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                                        <h3 className="text-green-200 mb-2">قيمة المخزون</h3>
                                        <p className="text-3xl font-bold text-white">{Number(data.totalValue).toFixed(2)} ج.م</p>
                                    </div>
                                    <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                                        <h3 className="text-green-200 mb-2">عدد الأصناف</h3>
                                        <p className="text-3xl font-bold text-white">{data.productCount}</p>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
                                        <h3 className="text-red-200 mb-2">نواقص المخزون</h3>
                                        <p className="text-3xl font-bold text-white">{data.lowStockItems?.length || 0}</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl overflow-hidden">
                                    <div className="flex justify-between items-center p-4 border-b border-white/10">
                                        <h3 className="text-xl font-bold text-white">حركة المخزون الكاملة</h3>
                                        <button onClick={exportToExcel} className="text-sm text-blue-400 hover:underline">تصدير الجدول</button>
                                    </div>
                                    <table className="w-full text-right">
                                        <thead className="bg-white/5 text-gray-300">
                                            <tr>
                                                <th className="p-4">المنتج</th>
                                                <th className="p-4">الكمية الحالية</th>
                                                <th className="p-4">الوحدة</th>
                                                <th className="p-4">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-200">
                                            {data.allProducts?.map((item: ProductReportItem) => (
                                                <tr key={item.id} className="border-t border-white/5 hover:bg-white/5">
                                                    <td className="p-4">{item.name}</td>
                                                    <td className={`p-4 font-bold ${Number(item.quantity) <= Number(item.min_stock) ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {item.quantity}
                                                    </td>
                                                    <td className="p-4">{item.unit}</td>
                                                    <td className="p-4 text-sm">
                                                        {Number(item.quantity) <= Number(item.min_stock) ? '⚠️ ناقص' : '✅ متوفر'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* Profit/Loss Report */}
                        {activeTab === 'PROFIT_LOSS' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                                        <h3 className="text-blue-200 mb-2">إجمالي الإيرادات</h3>
                                        <p className="text-2xl font-bold text-white">{Number(data.totalSales).toLocaleString()} ج.م</p>
                                    </div>
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                                        <h3 className="text-amber-200 mb-2">تكلفة البضاعة المباعة (COGS)</h3>
                                        <p className="text-2xl font-bold text-white">{Number(data.totalCOGS).toLocaleString()} ج.م</p>
                                    </div>
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
                                        <h3 className="text-emerald-200 mb-2">إجمالي الربح (Gross Profit)</h3>
                                        <p className="text-2xl font-bold text-white">{Number(data.grossProfit).toLocaleString()} ج.م</p>
                                    </div>
                                    <div className={`${(data.netProfit || 0) >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border p-6 rounded-2xl shadow-xl shadow-black/20`}>
                                        <h3 className={`${(data.netProfit || 0) >= 0 ? 'text-green-200' : 'text-red-200'} mb-2`}>صافي الربح</h3>
                                        <p className="text-2xl font-bold text-white">{Number(data.netProfit).toLocaleString()} ج.م</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                    <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                                        <h3 className="text-xl font-bold text-white mb-6">تحليل الأداء المالي</h3>
                                        <div className="space-y-6">
                                            {/* Revenue Bar */}
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-blue-300">الإيرادات</span>
                                                    <span className="text-white">{Number(data.totalSales).toLocaleString()}</span>
                                                </div>
                                                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
                                                </div>
                                            </div>

                                            {/* COGS Bar */}
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-amber-300">تكلفة البضاعة (COGS)</span>
                                                    <span className="text-white">{Number(data.totalCOGS).toLocaleString()}</span>
                                                </div>
                                                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500 rounded-full"
                                                        style={{ width: `${Math.min(((data.totalCOGS || 0) / (data.totalSales || 1)) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Fixed Costs Bar */}
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-red-300">المصاريف التشغيلية (Fixed Costs)</span>
                                                    <span className="text-white">{Number(data.totalFixedCosts).toLocaleString()}</span>
                                                </div>
                                                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-red-500 rounded-full"
                                                        style={{ width: `${Math.min(((data.totalFixedCosts || 0) / (data.totalSales || 1)) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-white/10 flex flex-wrap gap-6">
                                                <p className="text-gray-300">
                                                    هامش الربح الإجمالي: <span className="text-emerald-400 font-bold">
                                                        {data.totalSales && data.totalSales > 0 ? (((data.grossProfit || 0) / data.totalSales) * 100).toFixed(1) : '0'}%
                                                    </span>
                                                </p>
                                                <p className="text-gray-300">
                                                    هامش الربح الصافي: <span className="text-blue-400 font-bold">
                                                        {data.totalSales && data.totalSales > 0 ? (((data.netProfit || 0) / data.totalSales) * 100).toFixed(1) : '0'}%
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                                        <h3 className="text-xl font-bold text-white mb-6">تفاصيل المبيعات والأرباح</h3>
                                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-right text-sm">
                                                <thead className="sticky top-0 bg-slate-800 text-gray-400">
                                                    <tr>
                                                        <th className="p-3">الأمر</th>
                                                        <th className="p-3">الإيراد</th>
                                                        <th className="p-3">التكلفة</th>
                                                        <th className="p-3">الربح</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.sales?.map((sale: Sale) => {
                                                        const saleCOGS = sale.items.reduce((sum: number, item) => sum + (Number(item.quantity) * Number(item.product.cost_price || 0)), 0);
                                                        const saleProfit = Number(sale.total_amount) - saleCOGS;
                                                        return (
                                                            <tr key={sale.id} className="border-t border-white/5 hover:bg-white/5">
                                                                <td className="p-3">#{sale.id}</td>
                                                                <td className="p-3">{Number(sale.total_amount).toLocaleString()}</td>
                                                                <td className="p-3 text-amber-400">{saleCOGS.toLocaleString()}</td>
                                                                <td className={`p-3 font-bold ${saleProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                    {saleProfit.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Analytics Report */}
                        {activeTab === 'ANALYTICS' && (
                            <div className="space-y-12 pb-20">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
                                    {/* Inventory Value Chart */}
                                    <div className="bg-white/5 p-8 rounded-2xl border border-white/10 flex flex-col min-h-[400px]">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                            <span>📦</span> قيمة المخزون حسب التصنيف (ج.م)
                                        </h3>
                                        <div className="flex-1 min-h-0">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={analytics.inventory} layout="vertical" margin={{ left: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                                    <XAxis type="number" stroke="#94a3b8" />
                                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20', borderRadius: '8px', color: '#fff' }}
                                                        itemStyle={{ color: '#fff' }}
                                                        formatter={(value: number | string | undefined) => [`${Number(value ?? 0).toLocaleString()} ج.م`, 'القيمة']}
                                                    />
                                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                        {analytics.inventory.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4 text-center">يعتمد هذا الرسم على سعر التكلفة لتقييم المخزون</p>
                                    </div>
                                    {/* Sales Pie Chart */}
                                    <div className="bg-white/5 p-8 rounded-2xl border border-white/10 flex flex-col min-h-[400px]">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                            <span>💰</span> توزيع المبيعات حسب القسم
                                        </h3>
                                        <div className="flex-1 min-h-0">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={analytics.sales}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                    >
                                                        {analytics.sales.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20', borderRadius: '8px', color: '#fff' }}
                                                        itemStyle={{ color: '#fff' }}
                                                        formatter={(value: number | string | undefined) => [`${Number(value ?? 0).toLocaleString()} ج.م`, 'المبيعات']}
                                                    />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4 text-center">تحليل المبيعات بناءً على الأصناف خلال الفترة المختارة</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Shipment Profitability Report */}
                {activeTab === 'SHIPMENT_PROFIT' && shipmentProfit && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="text-gray-400 text-sm mb-1">عدد الشحنات</div>
                                <div className="text-3xl font-bold text-white">{shipmentProfit.summary.total_shipments as number}</div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="text-gray-400 text-sm mb-1">إجمالي الإيرادات</div>
                                <div className="text-3xl font-bold text-blue-400">{(shipmentProfit.summary.total_revenue as number).toLocaleString()}</div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="text-gray-400 text-sm mb-1">تكلفة البضاعة</div>
                                <div className="text-3xl font-bold text-orange-400">{(shipmentProfit.summary.total_cogs as number).toLocaleString()}</div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="text-gray-400 text-sm mb-1">صافي الربح</div>
                                <div className={`text-3xl font-bold ${(shipmentProfit.summary.total_profit as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {(shipmentProfit.summary.total_profit as number).toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <div className="text-gray-400 text-sm mb-1">هامش الربح الإجمالي</div>
                                <div className={`text-3xl font-bold ${(shipmentProfit.summary.overall_margin_percent as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {(shipmentProfit.summary.overall_margin_percent as number).toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        {/* Highest Margin Items */}
                        {(shipmentProfit.summary.highest_margin_items as Array<Record<string, unknown>>)?.length > 0 && (
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4">🏆 أعلى 5 منتجات هامش ربح</h3>
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400 text-sm">
                                            <th className="text-right px-4 py-3">المنتج</th>
                                            <th className="text-center px-4 py-3">الإيرادات</th>
                                            <th className="text-center px-4 py-3">التكلفة</th>
                                            <th className="text-center px-4 py-3">التكلفة الإضافية</th>
                                            <th className="text-center px-4 py-3">الربح</th>
                                            <th className="text-center px-4 py-3">هامش الربح</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(shipmentProfit.summary.highest_margin_items as Array<Record<string, unknown>>).map((item: Record<string, unknown>, idx: number) => (
                                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                                                <td className="px-4 py-3 text-white font-medium">{item.product_name as string}</td>
                                                <td className="px-4 py-3 text-center text-blue-400">{(item.revenue as number).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center text-orange-400">{(item.total_cogs as number).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center text-amber-400">{(item.landed_cost_allocated as number).toLocaleString()}</td>
                                                <td className={`px-4 py-3 text-center font-bold ${(item.profit as number) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {(item.profit as number).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-sm font-bold ${(item.margin_percent as number) >= 20 ? 'bg-green-500/20 text-green-300' : (item.margin_percent as number) >= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                                                        {(item.margin_percent as number).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Shipments Table */}
                        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-auto">
                            <div className="p-6 border-b border-white/10">
                                <h3 className="text-lg font-bold text-white">جميع الشحنات</h3>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400">
                                        <th className="text-right px-4 py-3">الشحنة</th>
                                        <th className="text-right px-4 py-3">المورد</th>
                                        <th className="text-center px-4 py-3">التاريخ</th>
                                        <th className="text-center px-4 py-3">الإيرادات</th>
                                        <th className="text-center px-4 py-3">COGS</th>
                                        <th className="text-center px-4 py-3">التكلفة النهائية</th>
                                        <th className="text-center px-4 py-3">الربح الصافي</th>
                                        <th className="text-center px-4 py-3">الهامش</th>
                                        <th className="text-center px-4 py-3">مباع/مشترى</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shipmentProfit.shipments.map((s) => (
                                        <tr key={s.purchase_order_id} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="px-4 py-3 text-white font-medium">#{s.purchase_order_id}</td>
                                            <td className="px-4 py-3 text-gray-300">{s.supplier_name}</td>
                                            <td className="px-4 py-3 text-center text-gray-400">
                                                {s.order_date ? new Date(s.order_date).toLocaleDateString('ar-EG') : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center text-blue-400">{s.sales_revenue.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center text-orange-400">{s.total_cogs.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center text-amber-400">{s.total_landed_cost.toLocaleString()}</td>
                                            <td className={`px-4 py-3 text-center font-bold ${s.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {s.net_profit.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${s.margin_percent >= 20 ? 'bg-green-500/20 text-green-300' : s.margin_percent >= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                                                    {s.margin_percent.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-400">
                                                {s.total_items_sold}/{s.total_items_purchased}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Items per Shipment */}
                        {shipmentProfit.shipments.map((s) => s.items.length > 0 && (
                            <div key={s.purchase_order_id} className="bg-white/5 rounded-2xl border border-white/10 overflow-auto">
                                <div className="p-4 border-b border-white/10">
                                    <h3 className="font-bold text-white">تفاصيل أصناف الشحنة #{s.purchase_order_id} — {s.supplier_name}</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400">
                                            <th className="text-right px-4 py-2">المنتج</th>
                                            <th className="text-center px-4 py-2">تم شراؤه</th>
                                            <th className="text-center px-4 py-2">تم بيعه</th>
                                            <th className="text-center px-4 py-2">تكلفة الوحدة</th>
                                            <th className="text-center px-4 py-2">إجمالي COGS</th>
                                            <th className="text-center px-4 py-2">تكلفة إضافية</th>
                                            <th className="text-center px-4 py-2">الإيرادات</th>
                                            <th className="text-center px-4 py-2">الربح</th>
                                            <th className="text-center px-4 py-2">الهامش</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {s.items.map((item) => (
                                            <tr key={item.product_id} className="border-b border-white/5 hover:bg-white/5 transition">
                                                <td className="px-4 py-2 text-white">{item.product_name}</td>
                                                <td className="px-4 py-2 text-center text-gray-400">{item.quantity_purchased}</td>
                                                <td className="px-4 py-2 text-center text-gray-400">{item.quantity_sold}</td>
                                                <td className="px-4 py-2 text-center text-gray-400">{item.unit_cost.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-center text-orange-400">{item.total_cogs.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-center text-amber-400">{item.landed_cost_allocated.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-center text-blue-400">{item.revenue.toLocaleString()}</td>
                                                <td className={`px-4 py-2 text-center font-bold ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {item.profit.toLocaleString()}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.margin_percent >= 20 ? 'bg-green-500/20 text-green-300' : item.margin_percent >= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                                                        {item.margin_percent.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

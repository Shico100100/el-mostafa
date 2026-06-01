'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
    RotateCcw,
    FileText,
    Save,
    X
} from 'lucide-react';

interface Customer {
    id: number;
    name: string;
}

interface Order {
    id: number;
    order_date: string;
}

interface ReturnItem {
    product_id: number;
    name: string;
    original_qty: number;
    quantity: number;
    unit_price: number;
    total: number;
}

interface SalesReturn {
    id: number;
    customer_id: number;
    customer?: Customer;
    order_id?: number;
    return_date: string;
    total_amount: number;
    reason?: string;
    items: ReturnItem[];
}

export default function SalesReturnsPage() {
    const [returns, setReturns] = useState<SalesReturn[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);

    // New Return State
    const [newReturn, setNewReturn] = useState({
        customer_id: '',
        order_id: '',
        reason: '',
        return_date: new Date().toISOString().split('T')[0],
        items: [] as ReturnItem[]
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [returnsData, customersData] = await Promise.all([
                api.fetchWithAuth('/sales/returns'),
                api.fetchWithAuth('/sales/customers')
            ]);
            setReturns(returnsData || []);
            setCustomers(customersData || []);
        } catch (error) {
            console.error('Error loading returns data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCustomerChange = async (customerId: string) => {
        setNewReturn({ ...newReturn, customer_id: customerId, order_id: '', items: [] });
        if (customerId) {
            try {
                const ordersData = await api.fetchWithAuth(`/sales/orders?customer_id=${customerId}`);
                setOrders(ordersData.items || []);
            } catch (error) {
                console.error('Error loading customer orders:', error);
            }
        } else {
            setOrders([]);
        }
    };

    const handleOrderChange = async (orderId: string) => {
        setNewReturn({ ...newReturn, order_id: orderId, items: [] });
        if (orderId) {
            try {
                const items = await api.fetchWithAuth(`/sales/orders/${orderId}/items`);
                setNewReturn(prev => ({
                    ...prev,
                    items: items.map((it: { product_id: number; product: { name: string }; quantity: number; price: number }) => ({
                        product_id: it.product_id,
                        name: it.product?.name,
                        original_qty: it.quantity,
                        quantity: 0,
                        unit_price: it.price,
                        total: 0
                    }))
                }));
            } catch (error) {
                console.error('Error loading order items:', error);
            }
        }
    };

    const updateItemQty = (index: number, qty: number) => {
        const items = [...newReturn.items];
        items[index].quantity = Math.min(qty, items[index].original_qty);
        items[index].total = items[index].quantity * items[index].unit_price;
        setNewReturn({ ...newReturn, items });
    };

    const calculateTotal = () => {
        return newReturn.items.reduce((sum, it) => sum + it.total, 0);
    };

    const handleSubmit = async () => {
        if (!newReturn.customer_id || newReturn.items.filter(it => it.quantity > 0).length === 0) {
            alert('يرجى اختيار العميل وتحديد المنتجات المرتجعة');
            return;
        }

        try {
            const returnData = {
                ...newReturn,
                customer_id: +newReturn.customer_id,
                order_id: newReturn.order_id ? +newReturn.order_id : undefined,
                total_amount: calculateTotal(),
                items: newReturn.items.filter(it => it.quantity > 0)
            };
            await api.fetchWithAuth('/sales/returns', {
                method: 'POST',
                body: JSON.stringify(returnData)
            });
            setShowNewModal(false);
            loadData();
        } catch (error) {
            console.error('Error creating return:', error);
            alert('حدث خطأ أثناء حفظ المرتجع');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 p-8 pt-24" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                            مرتجعات المبيعات
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium text-sm">إدارة عمليات الإرجاع واسترداد المخزون</p>
                    </div>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold transition shadow-lg shadow-rose-900/40"
                    >
                        <RotateCcw className="w-5 h-5" />
                        تسجيل مرتجع جديد
                    </button>
                </header>

                {/* Returns Table */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">المرتجع #</th>
                                <th className="px-6 py-4">العميل</th>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">المبلغ</th>
                                <th className="px-6 py-4">السبب</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">جاري تحميل البيانات...</td></tr>
                            ) : returns.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">لا توجد مرتجهات مسجلة</td></tr>
                            ) : (
                                returns.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-white/5 transition group">
                                        <td className="px-6 py-4 font-mono text-rose-400 font-bold">#{ret.id}</td>
                                        <td className="px-6 py-4 font-bold">{ret.customer?.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(ret.return_date).toLocaleDateString('ar-EG')}</td>
                                        <td className="px-6 py-4 font-bold text-emerald-400">{Number(ret.total_amount).toLocaleString()} ج.م</td>
                                        <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{ret.reason || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* New Return Modal */}
                {showNewModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h2 className="text-xl font-black text-rose-400 flex items-center gap-2">
                                    <RotateCcw className="w-6 h-6" />
                                    تسجيل مرتجع جديد
                                </h2>
                                <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-white/5 rounded-full transition text-slate-500 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 mr-1 italic">العميل</label>
                                        <select
                                            value={newReturn.customer_id}
                                            onChange={(e) => handleCustomerChange(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 text-white transition appearance-none"
                                        >
                                            <option value="" className="bg-slate-900">اختر العميل...</option>
                                            {customers.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 mr-1 italic">الفاتورة الأصلية (اختياري)</label>
                                        <select
                                            disabled={!newReturn.customer_id}
                                            value={newReturn.order_id}
                                            onChange={(e) => handleOrderChange(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 text-white transition disabled:opacity-30 appearance-none"
                                        >
                                            <option value="" className="bg-slate-900">اختر الفاتورة...</option>
                                            {orders.map(o => <option key={o.id} value={o.id} className="bg-slate-900">فاتورة #{o.id} - {new Date(o.order_date).toLocaleDateString()}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 mr-1 italic">تاريخ المرتجع</label>
                                        <input
                                            type="date"
                                            value={newReturn.return_date}
                                            onChange={(e) => setNewReturn({ ...newReturn, return_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-rose-500 text-white transition"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 mr-1 italic">سبب الإرجاع</label>
                                    <textarea
                                        value={newReturn.reason}
                                        onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500 text-white transition h-20 resize-none"
                                        placeholder="اكتب سبب الإرجاع هنا..."
                                    />
                                </div>

                                {newReturn.items.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                                            <FileText className="w-4 h-4" />
                                            الأصناف المرتجعة
                                        </h3>
                                        <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                                            <table className="w-full text-right text-sm">
                                                <thead>
                                                    <tr className="bg-white/5 text-slate-500">
                                                        <th className="px-4 py-3">الصنف</th>
                                                        <th className="px-4 py-3 text-center">الكمية المباعة</th>
                                                        <th className="px-4 py-3 text-center w-32">الكمية المرتجعة</th>
                                                        <th className="px-4 py-3 text-center">السعر</th>
                                                        <th className="px-4 py-3 text-left">الإجمالي</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {newReturn.items.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-white/5 transition">
                                                            <td className="px-4 py-3 font-bold">{item.name}</td>
                                                            <td className="px-4 py-3 text-center text-slate-400">{item.original_qty}</td>
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.original_qty}
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItemQty(idx, +e.target.value)}
                                                                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-center text-white focus:outline-none focus:border-rose-500"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-center">{item.unit_price} ج.م</td>
                                                            <td className="px-4 py-3 text-left font-bold text-rose-400">{item.total.toLocaleString()} ج.م</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-rose-600/10">
                                                        <td colSpan={4} className="px-4 py-4 text-left font-black text-rose-400">إجمالي المرتجع:</td>
                                                        <td className="px-4 py-4 text-left font-black text-white text-lg">
                                                            {calculateTotal().toLocaleString()} ج.م
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end gap-4">
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="px-6 py-3 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-8 py-3 rounded-2xl font-black bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-2 shadow-lg shadow-rose-900/40"
                                >
                                    <Save className="w-5 h-5" />
                                    حفظ المرتجع
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
    RotateCcw,
    Truck,
    FileText,
    Save,
    X
} from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
}

interface PurchaseOrder {
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

interface PurchaseReturn {
    id: number;
    supplier_id: number;
    supplier?: Supplier;
    order_id?: number;
    return_date: string;
    total_amount: number;
    reason?: string;
    items: ReturnItem[];
}

export default function PurchaseReturnsPage() {
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);

    // New Return State
    const [newReturn, setNewReturn] = useState({
        supplier_id: '',
        order_id: '',
        reason: '',
        return_date: new Date().toISOString().split('T')[0],
        items: [] as ReturnItem[]
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [returnsData, suppliersData] = await Promise.all([
                api.fetchWithAuth('/purchases/returns'),
                api.fetchWithAuth('/purchases/suppliers')
            ]);
            setReturns(returnsData || []);
            setSuppliers(suppliersData || []);
        } catch (error) {
            console.error('Error loading returns data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSupplierChange = async (supplierId: string) => {
        setNewReturn({ ...newReturn, supplier_id: supplierId, order_id: '', items: [] });
        if (supplierId) {
            try {
                // Adjusting to match the backend query if needed
                const ordersData = await api.fetchWithAuth(`/purchases/orders?supplier_id=${supplierId}`);
                setOrders(ordersData.items || []);
            } catch (error) {
                console.error('Error loading supplier orders:', error);
            }
        } else {
            setOrders([]);
        }
    };

    const handleOrderChange = async (orderId: string) => {
        setNewReturn({ ...newReturn, order_id: orderId, items: [] });
        if (orderId) {
            try {
                const items = await api.fetchWithAuth(`/purchases/orders/${orderId}/items`);
                setNewReturn(prev => ({
                    ...prev,
                    items: items.map((it: { product_id: number; product?: { name: string }; price: number; quantity: number }) => ({
                        product_id: it.product_id,
                        name: it.product?.name || 'صنف غير معروف',
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
        if (!newReturn.supplier_id || newReturn.items.filter(it => it.quantity > 0).length === 0) {
            alert('يرجى اختيار المورد وتحديد المنتجات المرتجعة');
            return;
        }

        try {
            const returnData = {
                ...newReturn,
                supplier_id: +newReturn.supplier_id,
                order_id: newReturn.order_id ? +newReturn.order_id : undefined,
                total_amount: calculateTotal(),
                items: newReturn.items.filter(it => it.quantity > 0)
            };
            await api.fetchWithAuth('/purchases/returns', {
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
                        <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent underline decoration-amber-500/20 underline-offset-8">
                            مرتجعات المشتريات
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium text-sm flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            إدارة عمليات إعادة البضائع للموردين
                        </p>
                    </div>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-slate-950 px-6 py-3 rounded-2xl font-black transition shadow-lg shadow-amber-900/20 group"
                    >
                        <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition duration-500" />
                        تسجيل مرتجع مشتريات
                    </button>
                </header>

                {/* Returns Table */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -z-10 rounded-full" />
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-slate-400 text-xs font-black uppercase tracking-[0.2em] border-b border-white/10">
                                <th className="px-6 py-5">رقم المرتجع</th>
                                <th className="px-6 py-5">المورد</th>
                                <th className="px-6 py-5">التاريخ</th>
                                <th className="px-6 py-5">المبلغ الإجمالي</th>
                                <th className="px-6 py-5">ملاحظات/سبب</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500 italic animate-pulse">جاري تحميل البيانات...</td></tr>
                            ) : returns.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500 italic">لا توجد سجلات مرتجعات حالياً</td></tr>
                            ) : (
                                returns.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-amber-500/5 transition group">
                                        <td className="px-6 py-4 font-mono text-amber-500 font-black">RET-P-{ret.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-bold">
                                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                {ret.supplier?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 font-medium">{new Date(ret.return_date).toLocaleDateString('ar-EG')}</td>
                                        <td className="px-6 py-4 font-black text-white">{Number(ret.total_amount).toLocaleString()} ج.م</td>
                                        <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate italic">{ret.reason || 'لا يوجد'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* New Return Modal */}
                {showNewModal && (
                    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(245,158,11,0.1)] relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h2 className="text-2xl font-black text-amber-500 flex items-center gap-3">
                                    <RotateCcw className="w-7 h-7" />
                                    تسجيل مرتجع مشتريات جديد
                                </h2>
                                <button onClick={() => setShowNewModal(false)} className="p-3 hover:bg-white/5 rounded-2xl transition text-slate-500 hover:text-white group">
                                    <X className="w-6 h-6 group-hover:scale-110 transition" />
                                </button>
                            </div>

                            <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mr-1">المورد</label>
                                        <select
                                            value={newReturn.supplier_id}
                                            onChange={(e) => handleSupplierChange(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-4 focus:outline-none focus:border-amber-500 text-white transition appearance-none font-bold"
                                        >
                                            <option value="" className="bg-slate-900 text-slate-500 italic">اختر المورد...</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mr-1">رقم الفاتورة الأصلية</label>
                                        <select
                                            disabled={!newReturn.supplier_id}
                                            value={newReturn.order_id}
                                            onChange={(e) => handleOrderChange(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-4 focus:outline-none focus:border-amber-500 text-white transition disabled:opacity-20 appearance-none font-bold"
                                        >
                                            <option value="" className="bg-slate-900 text-slate-500 italic">بحث في الفواتير...</option>
                                            {orders.map(o => <option key={o.id} value={o.id} className="bg-slate-900">فاتورة #{o.id} - بتاريخ {new Date(o.order_date).toLocaleDateString()}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mr-1">تاريخ الارتجاع</label>
                                        <input
                                            type="date"
                                            value={newReturn.return_date}
                                            onChange={(e) => setNewReturn({ ...newReturn, return_date: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-3.5 focus:outline-none focus:border-amber-500 text-white transition font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mr-1">سبب الإرجاع / ملاحظات</label>
                                    <textarea
                                        value={newReturn.reason}
                                        onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-[1.25rem] px-5 py-4 focus:outline-none focus:border-amber-500 text-white transition h-28 resize-none font-medium leading-relaxed"
                                        placeholder="ما هو سبب إرجاع هذه البضاعة للمورد؟"
                                    />
                                </div>

                                {newReturn.items.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px bg-white/10 flex-grow" />
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-amber-500" />
                                                تفاصيل الأصناف
                                            </h3>
                                            <div className="h-px bg-white/10 flex-grow" />
                                        </div>

                                        <div className="border border-white/10 rounded-[2rem] overflow-hidden bg-white/[0.01] shadow-inner">
                                            <table className="w-full text-right text-sm border-collapse">
                                                <thead>
                                                    <tr className="bg-white/5 text-slate-500 border-b border-white/10">
                                                        <th className="px-6 py-4 font-black">الصنف</th>
                                                        <th className="px-6 py-4 text-center font-black">كمية الشراء</th>
                                                        <th className="px-6 py-4 text-center w-40 font-black">الكمية المرتجعة</th>
                                                        <th className="px-6 py-4 text-center font-black">سعر الوحدة</th>
                                                        <th className="px-6 py-4 text-left font-black">الإجمالي</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {newReturn.items.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-white/[0.04] transition duration-300">
                                                            <td className="px-6 py-4 font-black text-slate-200">{item.name}</td>
                                                            <td className="px-6 py-4 text-center text-slate-500">{item.original_qty}</td>
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.original_qty}
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItemQty(idx, +e.target.value)}
                                                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2 text-center text-amber-500 font-black focus:outline-none focus:border-amber-500 transition shadow-inner"
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-medium">{item.unit_price} ج.م</td>
                                                            <td className="px-6 py-4 text-left font-black text-amber-500">{item.total.toLocaleString()} ج.م</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-amber-500/10 transition">
                                                        <td colSpan={4} className="px-6 py-6 text-left font-black text-amber-500 uppercase tracking-widest">إجمالي قيمة المرتجع</td>
                                                        <td className="px-6 py-6 text-left font-black text-white text-2xl">
                                                            {calculateTotal().toLocaleString()} <span className="text-xs text-amber-500">ج.م</span>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-white/5 bg-slate-900/40 flex justify-end gap-5">
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="px-8 py-4 rounded-[1.5rem] font-bold bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition group flex items-center gap-2"
                                >
                                    إلغاء التغييرات
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-10 py-4 rounded-[1.5rem] font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-3 shadow-[0_10px_40px_rgba(245,158,11,0.2)] hover:scale-105 active:scale-95 duration-300 group"
                                >
                                    <Save className="w-5 h-5 group-hover:animate-bounce" />
                                    حفظ المرتجع النهائي
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

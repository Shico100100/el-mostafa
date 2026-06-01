'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { H1, H2 } from '@/components/ui/Typography';
import { Package, AlertTriangle, CheckCircle, XCircle, ChevronRight, History } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: number;
    name: string;
    unit: string;
    type: string;
}

interface RecipeItem {
    productId: number;
    name: string;
    unit: string;
    required: number;
    available: number;
    status: 'OK' | 'MISSING';
}

interface Recipe {
    product: string;
    quantity: number;
    hasBom: boolean;
    items: RecipeItem[];
}

interface AssemblyOrder {
    id: number;
    date: string;
    quantity_produced: number;
    total_cost: number;
    status: string;
    bom: { id: number; name: string; product?: { name: string; unit: string } };
    worker?: { id: number; firstName: string; lastName: string };
    created_at: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bom_product_name?: any;
}

export default function ProductionPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loadingRecipe, setLoadingRecipe] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState<AssemblyOrder[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Fetch products on mount
    useEffect(() => {
        api.fetchWithAuth('/inventory/products?type=FINISHED')
            .then(data => setProducts(sortAlphabetically(data, 'name')))
            .catch(err => console.error('Failed to load products', err));
    }, []);

    const loadHistory = useCallback(async () => {
        try {
            const data = await api.getAssemblyOrders();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load history', err);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => { loadHistory(); }, [loadHistory]);

    // Fetch recipe when product or quantity changes
    useEffect(() => {
        if (!selectedProduct || quantity <= 0) {
            setRecipe(null);
            return;
        }

        const fetchRecipe = async () => {
            setLoadingRecipe(true);
            try {
                // Determine API endpoint. Assuming logic is in backend.
                // Using relative path for proxy
                const res = await api.fetchWithAuth(`/assembly/recipe/${selectedProduct}?quantity=${quantity}`);
                setRecipe(res);
            } catch (error) {
                console.error('Failed to load recipe', error);
                setRecipe(null);
            } finally {
                setLoadingRecipe(false);
            }
        };

        // Debounce slightly
        const timer = setTimeout(fetchRecipe, 500);
        return () => clearTimeout(timer);
    }, [selectedProduct, quantity]);

    const handleSubmit = async () => {
        if (!selectedProduct || !recipe) return;

        // Validation
        const missing = recipe.items.some(i => i.status === 'MISSING');
        if (missing) {
            if (!confirm('هناك مكونات ناقصة! هل أنت متأكد من المتابعة؟ (قد يفشل الخادم)')) {
                return;
            }
        }

        setSubmitting(true);
        try {
            await api.fetchWithAuth('/assembly/record', {
                method: 'POST',
                body: JSON.stringify({
                    productId: selectedProduct,
                    quantity: Number(quantity),
                    date,
                    notes
                })
            });

            alert('تم تسجيل الإنتاج بنجاح ✅');

            // Reset form
            setQuantity(1);
            setNotes('');
            // Optional: refresh recipe to see updated stock
            const res = await api.fetchWithAuth(`/assembly/recipe/${selectedProduct}?quantity=1`);
            setRecipe(res);

        } catch (error) {
            console.error(error);
            alert('فشل التسجيل. راجع الخطأ.');
        } finally {
            setSubmitting(false);
        }
    };

    const isReady = recipe && recipe.hasBom && !recipe.items.some(i => i.status === 'MISSING');

    return (
        <div className="space-y-6 direction-rtl" dir="rtl">
            <div className="flex items-center gap-2 text-gray-400 mb-4">
                <Link href="/assembly" className="hover:text-white transition">التجميع</Link>
                <ChevronRight size={16} />
                <span className="text-white">تسجيل الإنتاج</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1 space-y-6">
                    <GlassPanel className="p-6 border-blue-500/30">
                        <H1 className="flex items-center gap-3 text-2xl mb-6">
                            <Package className="text-blue-400" />
                            تسجيل إنتاج جديد
                        </H1>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 mb-1">المنتج النهائي</label>
                                <select
                                    value={selectedProduct || ''}
                                    onChange={e => setSelectedProduct(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
                                >
                                    <option value="">-- اختر المنتج --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">الكمية المنتجة</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition text-xl font-bold text-center"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">تاريخ الإنتاج</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-1">ملاحظات</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition h-24"
                                    placeholder="أي ملاحظات إضافية..."
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !selectedProduct}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg
                                    ${isReady
                                        ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-green-900/20'
                                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                            >
                                {submitting ? 'جاري التسجيل...' : (
                                    <>
                                        <Package /> تأكيد الإنتاج
                                    </>
                                )}
                            </button>
                        </div>
                    </GlassPanel>
                </div>

                {/* Recipe/BOM Preview Section */}
                <div className="lg:col-span-2">
                    <GlassPanel className="p-6 h-full">
                        <H2 className="flex items-center gap-2 mb-6 text-xl">
                            <CheckCircle className="text-green-400" />
                            مراجعة مكونات الخلطة (BOM)
                        </H2>

                        {!selectedProduct ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Package size={48} className="mb-4 opacity-50" />
                                <p>الرجاء اختيار منتج لعرض مكوناته</p>
                            </div>
                        ) : loadingRecipe ? (
                            <div className="text-center py-12 text-gray-400">جاري حساب الكميات وفحص المخزن...</div>
                        ) : recipe ? (
                            <div className="space-y-4">
                                {!recipe.hasBom && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-lg flex items-center gap-3">
                                        <AlertTriangle />
                                        <span>تنبيه: هذا المنتج لا يحتوي على خلطة (BOM) معرفة. سيتم تسجيل الإنتاج دون خصم مكونات.</span>
                                    </div>
                                )}

                                {recipe.items.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-right">
                                            <thead>
                                                <tr className="border-b border-white/10 text-gray-400 text-sm">
                                                    <th className="pb-3 pr-2">المكون / الخامة</th>
                                                    <th className="pb-3 text-center">الكمية لكل وحدة</th>
                                                    <th className="pb-3 text-center">المطلوب للإجمالي</th>
                                                    <th className="pb-3 text-center">المتوفر بالمخزن</th>
                                                    <th className="pb-3 text-center">الحالة</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {recipe.items.map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-white/5 transition">
                                                        <td className="py-4 pr-2 font-medium">{item.name}</td>
                                                        <td className="py-4 text-center text-gray-400">
                                                            {(item.required / quantity).toFixed(3)} {item.unit}
                                                        </td>
                                                        <td className="py-4 text-center font-bold text-white">
                                                            {item.required.toFixed(2)} {item.unit}
                                                        </td>
                                                        <td className={`py-4 text-center ${item.available < item.required ? 'text-red-400' : 'text-green-400'}`}>
                                                            {item.available.toFixed(2)}
                                                        </td>
                                                        <td className="py-4 flex justify-center">
                                                            {item.status === 'OK' ? (
                                                                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                                    <CheckCircle size={12} /> متوفر
                                                                </span>
                                                            ) : (
                                                                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                                                                    <XCircle size={12} /> ناقص
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-red-500">فشل في تحميل بيانات الخلطة</div>
                        )}
                    </GlassPanel>
                </div>
            </div>

            {/* Recent History Section */}
            <div className="mt-8">
                <GlassPanel className="p-6">
                    <H2 className="flex items-center gap-2 mb-4 text-lg text-gray-300">
                        <History size={20} /> آخر عمليات الإنتاج
                    </H2>
                    {loadingHistory ? (
                        <div className="text-center py-8 text-gray-500 animate-pulse">جاري التحميل...</div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 italic">لا توجد عمليات إنتاج مسجلة بعد</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                                        <th className="pb-3 pr-2">#</th>
                                        <th className="pb-3">المنتج</th>
                                        <th className="pb-3 text-center">الكمية</th>
                                        <th className="pb-3 text-center">التاريخ</th>
                                        <th className="pb-3 text-center">التكلفة</th>
                                        <th className="pb-3 text-center">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.slice(0, 20).map((o) => (
                                        <tr key={o.id} className="hover:bg-white/5 transition">
                                            <td className="py-3 pr-2 text-gray-400 font-mono text-sm">#{o.id}</td>
                                            <td className="py-3 font-medium">{o.bom?.product?.name || o.bom?.name || '—'}</td>
                                            <td className="py-3 text-center font-bold">{Number(o.quantity_produced).toLocaleString()}</td>
                                            <td className="py-3 text-center text-gray-400">{new Date(o.date).toLocaleDateString('ar-EG')}</td>
                                            <td className="py-3 text-center text-emerald-400">{Number(o.total_cost).toLocaleString()} ج.م</td>
                                            <td className="py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                    o.status === 'COMPLETED'
                                                        ? 'bg-green-500/20 text-green-300'
                                                        : 'bg-yellow-500/20 text-yellow-300'
                                                }`}>
                                                    {o.status === 'COMPLETED' ? 'مكتمل' : o.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassPanel>
            </div>
        </div>
    );
}

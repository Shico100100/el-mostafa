'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Product {
    id: number;
    name: string;
    unit: string;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    type: string;
}

export default function SemiFinishedInventoryPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await api.fetchWithAuth('/inventory/products?type=SEMI_FINISHED');
            setProducts(Array.isArray(data) ? data : data?.data ?? []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalValue = () => {
        return products.reduce((acc, p) => acc + (Number(p.cost_price) * Number(p.stock_quantity)), 0);
    };

    if (loading) return <div className="text-white text-center p-10">جاري تحميل المخزون...</div>;

    return (
        <>
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        🏭 مخزن البلاستيك
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={async () => {
                                if (!confirm('هل تريد إعادة حساب تكاليف جميع المنتجات البلاستيكية بالمعادلة الجديدة؟')) return;
                                try {
                                    const res = await api.fetchWithAuth('/v1/manufacturing/recalculate-semi-finished-costs', { method: 'POST' });
                                    alert(`✅ تم إعادة الحساب: ${res.processed_products} منتج`);
                                    window.location.reload();
                                } catch (err) {
                                    console.error(err);
                                    alert('❌ فشل');
                                }
                            }}
                            className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-lg border border-amber-500/30 transition text-sm"
                            title="إعادة حساب التكاليف"
                        >
                            🔄 إعادة حساب التكاليف
                        </button>
                        <div className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                            <span className="text-gray-400 text-xs block">إجمالي قيمة المخزون</span>
                            <span className="text-xl font-bold text-blue-300">
                                {calculateTotalValue().toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                            </span>
                        </div>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
                        >
                            الرئيسية
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
                    <table className="w-full text-right text-white">
                        <thead className="bg-black/20 text-gray-400">
                            <tr>
                                <th className="p-4 font-medium">اسم المنتج</th>
                                <th className="p-4 font-medium">الكمية (قطعة)</th>
                                <th className="p-4 font-medium">متوسط التكلفة</th>
                                <th className="p-4 font-medium">إجمالي القيمة</th>
                                <th className="p-4 font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        لا يوجد منتجات مسجلة بعد. قم بتسجيل إنتاج لإضافة منتجات هنا.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-white/5 transition">
                                        <td className="p-4">
                                            <button
                                                onClick={() => router.push(`/inventory/semi-finished/${product.id}`)}
                                                className="font-bold text-lg text-blue-300 hover:text-blue-200 transition text-right"
                                            >
                                                {product.name}
                                            </button>
                                        </td>
                                        <td className="p-4 font-mono text-xl">
                                            {product.stock_quantity.toLocaleString()} <span className="text-xs text-gray-500">قطعة</span>
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {Number(product.cost_price).toFixed(2)} جنية
                                        </td>
                                        <td className="p-4 text-green-400 font-bold">
                                            {(Number(product.cost_price) * Number(product.stock_quantity)).toFixed(2)} جنية
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('هل تريد إعادة حساب المخزون لهذا المنتج؟ 🔄')) return;
                                                    try {
                                                        const data = await api.fetchWithAuth(`/v1/inventory/products/${product.id}/recalculate`, {
                                                            method: 'POST',
                                                        });
                                                        alert(`تم التحديث: ${data.calculated_stock}`);
                                                        fetchProducts();
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('فشل');
                                                    }
                                                }}
                                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition"
                                                title="تصحيح الرصيد"
                                            >
                                                🔄
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </>
    );
}

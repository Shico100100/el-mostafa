'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Product {
    id: number;
    name: string;
    sku: string;
    unit: string;
    stock_quantity: number;
    category?: { name: string };
}

export default function PackagingPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProducts()
            .then((data: unknown) => {
                const items = (data as { products?: Product[] } | Product[]);
                const list = Array.isArray(items) ? items : items.products || [];
                setProducts(list);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    const packagingKeywords = ['تغليف', 'كرتون', 'كيس', 'بلاستيك', 'صينية', 'غطاء', 'ليبل', 'ملصق', 'شنطة', 'بوكس', 'صندوق', 'شريط'];

    const packagingProducts = products.filter(p =>
        packagingKeywords.some(kw => p.name.includes(kw)) ||
        p.category?.name.includes('تغليف') ||
        p.category?.name.includes('تعبئة')
    );

    const displayProducts = packagingProducts.length > 0 ? packagingProducts : products;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/assembly')} className="p-2 hover:bg-white/10 rounded-full text-white transition text-xl">⬅️</button>
                        <h1 className="text-2xl font-bold text-white">📦 التعبئة والتغليف</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center text-white py-8">جاري التحميل...</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 p-6 rounded-2xl backdrop-blur-sm">
                                <p className="text-gray-400 text-sm mb-1">إجمالي أصناف التغليف</p>
                                <h3 className="text-3xl font-bold text-white">{displayProducts.length}</h3>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                            <div className="overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="text-right px-4 py-3">المنتج</th>
                                            <th className="text-right px-4 py-3">SKU</th>
                                            <th className="text-center px-4 py-3">الوحدة</th>
                                            <th className="text-center px-4 py-3">المخزون</th>
                                            <th className="text-center px-4 py-3">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {displayProducts.map((p) => (
                                            <tr key={p.id} className="hover:bg-white/5 transition">
                                                <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                                                <td className="px-4 py-3 text-gray-400">{p.sku || '—'}</td>
                                                <td className="px-4 py-3 text-center text-gray-400">{p.unit}</td>
                                                <td className={`px-4 py-3 text-center font-bold ${(p.stock_quantity ?? 0) === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                                                    {p.stock_quantity ?? 0}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => router.push(`/inventory/products/${p.id}`)}
                                                        className="px-3 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
                                                    >
                                                        عرض
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {displayProducts.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-gray-400">لا توجد منتجات</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => router.push('/inventory/products')}
                                className="px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition mx-2"
                            >
                                إدارة المخزون الكامل
                            </button>
                            <button
                                onClick={() => router.push('/inventory/categories')}
                                className="px-6 py-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition mx-2"
                            >
                                تصنيفات المخزون
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

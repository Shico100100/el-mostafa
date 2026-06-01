'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';

export default function PlasticPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Array<{ id: number; name: string; sku: string; unit: string; stock_quantity: number }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProducts('FINISHED')
            .then((data: unknown) => {
                const items = (data as { products?: Array<{ id: number; name: string; sku: string; unit: string; stock_quantity: number }> } | Array<{ id: number; name: string; sku: string; unit: string; stock_quantity: number }>);
                setProducts(Array.isArray(items) ? items : items.products || []);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/assembly')} className="p-2 hover:bg-white/10 rounded-full text-white transition text-xl">⬅️</button>
                        <h1 className="text-2xl font-bold text-white">🪣 بلاستيك</h1>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-6 py-8">
                <GlassPanel title="المنتجات البلاستيكية">
                    {loading ? (
                        <div className="text-center text-white py-8">جاري التحميل...</div>
                    ) : products.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                            <p>لا توجد منتجات بلاستيكية مضافة</p>
                            <button onClick={() => router.push('/inventory/products')} className="mt-4 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30">
                                إدارة المنتجات
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400">
                                        <th className="text-right px-4 py-3">المنتج</th>
                                        <th className="text-right px-4 py-3">SKU</th>
                                        <th className="text-center px-4 py-3">الوحدة</th>
                                        <th className="text-center px-4 py-3">المخزون</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p) => (
                                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                            <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                                            <td className="px-4 py-3 text-gray-400">{p.sku || '—'}</td>
                                            <td className="px-4 py-3 text-center text-gray-400">{p.unit}</td>
                                            <td className="px-4 py-3 text-center text-amber-400">{p.stock_quantity ?? 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassPanel>
            </main>
        </div>
    );
}

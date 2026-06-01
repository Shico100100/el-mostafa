'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';

interface BOMItem {
    id: number;
    product_id: number;
    product?: { id: number; name: string; unit: string };
    quantity: number;
}

interface BOM {
    id: number;
    name: string;
    product?: { id: number; name: string };
    items: BOMItem[];
    description: string;
    created_at: string;
}

export default function AssemblyBomPage() {
    const router = useRouter();
    const [boms, setBoms] = useState<BOM[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getBOMs()
            .then(setBoms)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/assembly')} className="p-2 hover:bg-white/10 rounded-full text-white transition text-xl">⬅️</button>
                        <h1 className="text-2xl font-bold text-white">📋 BOM التجميع</h1>
                    </div>
                    <button
                        onClick={() => router.push('/manufacturing/bom')}
                        className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 transition"
                    >
                        إدارة BOM الكاملة
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center text-white py-12">جاري التحميل...</div>
                ) : boms.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-xl">لا توجد قوائم مكونات</p>
                        <button onClick={() => router.push('/manufacturing/bom')} className="mt-4 px-6 py-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 transition">
                            إنشاء BOM جديد
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {boms.map((bom) => (
                            <GlassPanel key={bom.id} title={bom.name}>
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <span className="text-gray-400 text-sm">المنتج النهائي: </span>
                                            <span className="text-white font-bold">{bom.product?.name || '—'}</span>
                                        </div>
                                        <span className="text-gray-400 text-sm">{bom.items?.length || 0} مكون</span>
                                    </div>
                                    {bom.items && bom.items.length > 0 && (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10 text-gray-400">
                                                    <th className="text-right px-4 py-2">المكون</th>
                                                    <th className="text-center px-4 py-2">الوحدة</th>
                                                    <th className="text-center px-4 py-2">الكمية</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bom.items.map((item) => (
                                                    <tr key={item.id} className="border-b border-white/5">
                                                        <td className="px-4 py-2 text-white">{item.product?.name || '—'}</td>
                                                        <td className="px-4 py-2 text-center text-gray-400">{item.product?.unit || '—'}</td>
                                                        <td className="px-4 py-2 text-center text-amber-400">{item.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </GlassPanel>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

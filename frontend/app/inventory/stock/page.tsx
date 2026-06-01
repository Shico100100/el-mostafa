'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface StockItem {
    product?: {
        name: string;
    };
    warehouse?: {
        name: string;
    };
    quantity: string | number;
}

export default function StockPage() {
    const router = useRouter();
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadStock = useCallback(async () => {
        try {
            const data = await api.fetchWithAuth('/inventory/stock');
            setStock(data);
        } catch (error) {
            console.error('Error loading stock:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadStock();
    }, [router, loadStock]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">تقرير المخزون</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/inventory/products')}
                        className="px-6 py-3 bg-blue-500/20 text-blue-200 rounded-lg font-semibold hover:bg-blue-500/30 transition border border-white/10"
                    >
                        ⚙️ إدارة المنتجات
                    </button>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-right text-white font-semibold">المنتج</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">المخزن</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">الكمية</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stock.map((item, index) => (
                                <tr key={index} className="border-t border-white/10 hover:bg-white/5">
                                    <td className="px-6 py-4 text-gray-200">{item.product?.name || '-'}</td>
                                    <td className="px-6 py-4 text-gray-300">{item.warehouse?.name || '-'}</td>
                                    <td className="px-6 py-4 text-gray-300">{item.quantity}</td>
                                    <td className="px-6 py-4">
                                        {Number(item.quantity) > 0 ? (
                                            <span className="px-3 py-1 bg-green-500/20 text-green-200 rounded-full text-sm">
                                                متوفر
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-red-500/20 text-red-200 rounded-full text-sm">
                                                غير متوفر
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {stock.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        لا توجد بيانات مخزون حالياً
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

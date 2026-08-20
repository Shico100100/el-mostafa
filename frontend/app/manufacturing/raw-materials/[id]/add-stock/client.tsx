'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

interface RawMaterialDetail {
    id: number;
    product: { name: string; unit: string };
}

interface Supplier {
    id: number;
    name: string;
}

export default function AddRawMaterialStockPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [rawMaterial, setRawMaterial] = useState<RawMaterialDetail | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [dataDate, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const rmData = await api.fetchWithAuth(`/manufacturing/raw-materials/${id}`);
            const supData = await api.fetchWithAuth(`/purchases/suppliers`);

            if (rmData && supData) {
                setRawMaterial(rmData);
                setSuppliers(sortAlphabetically(Array.isArray(supData) ? supData : [], 'name'));
            } else {
                toast.error('فشل في تحميل البيانات');
                router.back();
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('فشل في تحميل البيانات');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.fetchWithAuth(`/manufacturing/raw-materials/${id}/purchase`, {
                method: 'POST',
                body: JSON.stringify({
                    quantity: parseFloat(quantity),
                    price: parseFloat(price),
                    date: dataDate,
                    supplier_id: supplierId ? parseInt(supplierId) : null,
                    notes: notes
                }),
            });

            toast.success('تم إضافة الرصيد بنجاح!');
            router.push('/manufacturing/raw-materials');

        } catch (error: unknown) {
            console.error('Error adding stock:', error);
            const message = error instanceof Error ? error.message : 'فشل عملية الإضافة';
            toast.error(`خطأ: ${message}`);
        }
    };

    if (loading) return <div className="text-white text-center p-10">جاري التحميل...</div>;
    if (!rawMaterial) return <div className="text-white text-center p-10">المادة الخام غير موجودة</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-3xl"><Plus /></span>
                        إضافة رصيد: {rawMaterial.product.name}
                    </h1>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-[#ecfdf5]0/20 hover:bg-[#ecfdf5]0/30 text-gray-200 rounded-lg transition"
                    >
                        عودة
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    الكمية ({rawMaterial.product.unit}) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    dir="ltr"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    سعر الوحدة ({price ? (parseFloat(price) / parseFloat(quantity || '1')).toFixed(2) : '0.00'}) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    dir="ltr"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500 text-right"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-gray-400 mt-1">أدخل سعر الشراء للوحدة الواحدة</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    التاريخ *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={dataDate}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm font-semibold mb-2">
                                    المورد (اختياري)
                                </label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">اختر مورد...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-300 text-sm font-semibold mb-2">
                                ملاحظات
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-[1.02]"
                        >
                            <Save /> حفظ وإضافة للرصيد
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { TestTube, Cog, Check, Factory, FileText } from 'lucide-react';

interface BatchComponent {
    id: number;
    raw_material?: { id: number; product?: { name: string; unit: string } };
    accessory?: { id: number; product?: { name: string; unit: string } };
    supplier_batch_number?: string;
    quantity_used: number;
    unit: string;
    cost_per_unit: number;
    total_cost: number;
}

interface Batch {
    id: number;
    batch_number: string;
    product: { id: number; name: string; unit: string };
    production_date: string;
    expiry_date?: string;
    quantity: number;
    unit: string;
    status: string;
    notes?: string;
    production_id?: number;
    created_at: string;
    components: BatchComponent[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'معلق', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    RELEASED: { label: 'منشور', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    ON_HOLD: { label: 'معلق مؤقتاً', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
    RECALLED: { label: 'مسحوب', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
    EXPIRED: { label: 'منتهي الصلاحية', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

export default function BatchDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [batch, setBatch] = useState<Batch | null>(null);
    const [loading, setLoading] = useState(true);
    const [backwardResult, setBackwardResult] = useState<BatchComponent[] | null>(null);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const data = await api.getBatch(Number(id));
                setBatch(data);
                const trace = await api.backwardTrace(Number(id));
                setBackwardResult(trace.components || []);
            } catch (e) {
                console.error('Error:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleStatusChange = async (status: string) => {
        try {
            const updated = await api.updateBatchStatus(batch!.id, status);
            setBatch(updated);
        } catch (e) {
            console.error('Status update error:', e);
        }
    };

    const handleRecall = async () => {
        const reason = prompt('سبب السحب:');
        try {
            const updated = await api.recallBatch(batch!.id, reason || undefined);
            setBatch(updated);
        } catch (e) {
            console.error('Recall error:', e);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!batch) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
            الدفعة غير موجودة
        </div>
    );

    const statusInfo = STATUS_MAP[batch.status] || { label: batch.status, color: 'bg-white/5 text-slate-300' };

    return (
        <div className="min-h-screen bg-slate-900 text-white" dir="rtl">
            <header className="glass border-b border-white/5 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/manufacturing/traceability')} className="text-slate-400 hover:text-white transition text-xl">→</button>
                        <h1 className="text-2xl font-bold font-mono">{batch.batch_number}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <div className="flex gap-3">
                        {batch.status === 'PENDING' && (
                            <button onClick={() => handleStatusChange('RELEASED')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition text-sm font-bold">
                                نشر الدفعة
                            </button>
                        )}
                        {(batch.status === 'RELEASED' || batch.status === 'ON_HOLD') && (
                            <button onClick={handleRecall} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl transition text-sm font-bold">
                                سحب الدفعة
                            </button>
                        )}
                        {batch.status === 'PENDING' && (
                            <button onClick={() => handleStatusChange('ON_HOLD')} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-xl transition text-sm font-bold">
                                تعليق
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass p-6 rounded-2xl border border-white/5">
                            <h2 className="text-lg font-bold mb-4">معلومات الدفعة</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-400">المنتج:</span>
                                    <p className="font-bold">{batch.product?.name || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">الكمية:</span>
                                    <p className="font-bold">{Number(batch.quantity).toLocaleString()} {batch.unit}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">تاريخ الإنتاج:</span>
                                    <p>{new Date(batch.production_date).toLocaleDateString('ar-EG')}</p>
                                </div>
                                <div>
                                    <span className="text-slate-400">تاريخ الانتهاء:</span>
                                    <p className={batch.expiry_date && new Date(batch.expiry_date) < new Date() ? 'text-red-400' : ''}>
                                        {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString('ar-EG') : 'غير محدد'}
                                    </p>
                                </div>
                                {batch.notes && (
                                    <div className="col-span-2">
                                        <span className="text-slate-400">ملاحظات:</span>
                                        <p className="mt-1 text-slate-300">{batch.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="glass p-6 rounded-2xl border border-white/5">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                                المكونات المستخدمة (تتبع عكسي)
                            </h2>
                            {!backwardResult || backwardResult.length === 0 ? (
                                <p className="text-slate-500 text-sm">لا توجد مكونات مسجلة لهذه الدفعة</p>
                            ) : (
                                <div className="space-y-3">
                                    {backwardResult.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{c.raw_material ? <TestTube /> : <Cog />}</span>
                                                <div>
                                                    <p className="font-bold text-sm">
                                                        {c.raw_material?.product?.name || c.accessory?.product?.name || 'مكون'}
                                                    </p>
                                                    {c.supplier_batch_number && (
                                                        <p className="text-xs text-purple-300 font-mono">
                                                            Batch المورد: {c.supplier_batch_number}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold">{Number(c.quantity_used).toLocaleString()} {c.unit}</p>
                                                <p className="text-xs text-slate-500">{Number(c.total_cost).toLocaleString()} ج.م</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass p-6 rounded-2xl border border-white/5">
                            <h3 className="font-bold mb-4">سجل الحالة</h3>
                            <div className="space-y-4">
                                {['PENDING', 'RELEASED', 'ON_HOLD', 'RECALLED', 'EXPIRED'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        disabled={batch.status === s}
                                        className={`w-full text-right px-4 py-3 rounded-xl text-sm transition border ${
                                            batch.status === s
                                                ? `${STATUS_MAP[s]?.color || 'bg-white/10'} border-current`
                                                : 'bg-white/5 border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <span className="font-bold">{STATUS_MAP[s]?.label || s}</span>
                                        {batch.status === s && <span className="mr-2 text-xs"><Check /></span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="glass p-6 rounded-2xl border border-white/5">
                            <h3 className="font-bold mb-4">إجراءات</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push(`/manufacturing/daily-production/${batch.production_id || ''}`)}
                                    className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition text-right"
                                >
                                    <Factory /> عرض الإنتاج المرتبط
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(batch.batch_number);
                                        alert('تم نسخ رقم الدفعة');
                                    }}
                                    className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition text-right"
                                >
                                    <FileText /> نسخ رقم الدفعة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

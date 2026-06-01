'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

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
    created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'معلق', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    RELEASED: { label: 'منشور', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    ON_HOLD: { label: 'معلق مؤقتاً', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
    RECALLED: { label: 'مسحوب', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
    EXPIRED: { label: 'منتهي الصلاحية', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

export default function TraceabilityPage() {
    const router = useRouter();
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchBatch, setSearchBatch] = useState('');
    const [traceResults, setTraceResults] = useState<Batch[] | null>(null);

    const loadBatches = useCallback(async () => {
        try {
            const data = await api.getBatches(statusFilter || undefined);
            setBatches(data);
        } catch (e) {
            console.error('Error loading batches:', e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { loadBatches(); }, [loadBatches]);

    const handleForwardTrace = async () => {
        if (!searchBatch.trim()) return;
        try {
            const result = await api.forwardTrace(searchBatch.trim());
            setTraceResults(result.batches || []);
        } catch (e) {
            console.error('Trace error:', e);
        }
    };

    const filtered = traceResults !== null
        ? traceResults
        : batches.filter(b =>
            !filter || b.batch_number.includes(filter) || b.product?.name?.includes(filter)
        );

    const statusBadge = (s: string) => {
        const m = STATUS_MAP[s] || { label: s, color: 'bg-white/5 text-slate-300' };
        return <span className={`px-2 py-0.5 rounded text-xs font-bold border ${m.color}`}>{m.label}</span>;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white" dir="rtl">
            <header className="glass border-b border-white/5 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <span className="text-3xl">🔗</span>
                        تتبع الإنتاج (Traceability)
                    </h1>
                    <div className="flex gap-3">
                        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition text-sm font-bold">
                            + إنشاء دفعة
                        </button>
                        <button onClick={() => router.push('/manufacturing')} className="text-slate-400 hover:text-white transition">
                            العودة
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Search & Filter */}
                <div className="flex gap-4 mb-8 flex-wrap">
                    <div className="flex-1 min-w-[250px] relative">
                        <input
                            type="text"
                            placeholder="بحث برقم الدفعة أو اسم المنتج..."
                            value={filter}
                            onChange={(e) => { setFilter(e.target.value); setTraceResults(null); }}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                    >
                        <option value="">كل الحالات</option>
                        {Object.entries(STATUS_MAP).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                    {/* Forward Trace */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="تتبع بـ batch المورد..."
                            value={searchBatch}
                            onChange={(e) => setSearchBatch(e.target.value)}
                            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 transition w-56"
                            onKeyDown={(e) => e.key === 'Enter' && handleForwardTrace()}
                        />
                        <button onClick={handleForwardTrace} className="px-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl transition text-sm font-bold">
                            🔍 تتبع
                        </button>
                        {traceResults !== null && (
                            <button onClick={() => { setTraceResults(null); setSearchBatch(''); }} className="px-3 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition text-sm">
                                ✕ مسح
                            </button>
                        )}
                    </div>
                </div>

                {/* Batch List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500 animate-pulse">جاري التحميل...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            {traceResults !== null ? 'لا توجد نتائج تتبع' : 'لا توجد دفعات'}
                        </div>
                    ) : (
                        filtered.map((b) => (
                            <div
                                key={b.id}
                                onClick={() => router.push(`/manufacturing/traceability/${b.id}`)}
                                className="glass p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">📦</div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-mono font-bold text-blue-300">{b.batch_number}</span>
                                            {statusBadge(b.status)}
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            {b.product?.name || '—'} — {Number(b.quantity).toLocaleString()} {b.unit}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left text-sm text-slate-500">
                                    <div>{new Date(b.production_date).toLocaleDateString('ar-EG')}</div>
                                    {b.expiry_date && (
                                        <div className={`text-xs ${new Date(b.expiry_date) < new Date() ? 'text-red-400' : 'text-slate-500'}`}>
                                            ينتهي: {new Date(b.expiry_date).toLocaleDateString('ar-EG')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateBatchModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => { setShowCreateModal(false); loadBatches(); }}
                />
            )}
        </div>
    );
}

function CreateBatchModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [form, setForm] = useState({
        product_id: '',
        production_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        quantity: '',
        unit: 'piece',
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.product_id || !form.quantity) return;
        setSaving(true);
        try {
            await api.createBatch({
                product_id: Number(form.product_id),
                production_date: form.production_date,
                expiry_date: form.expiry_date || undefined,
                quantity: Number(form.quantity),
                unit: form.unit,
                notes: form.notes || undefined,
            });
            onCreated();
        } catch (e) {
            console.error('Create error:', e);
            alert('فشل إنشاء الدفعة');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-lg border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-6">إنشاء دفعة جديدة</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">رقم المنتج</label>
                        <input
                            type="number"
                            value={form.product_id}
                            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">تاريخ الإنتاج</label>
                            <input
                                type="date"
                                value={form.production_date}
                                onChange={(e) => setForm({ ...form, production_date: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">تاريخ انتهاء الصلاحية</label>
                            <input
                                type="date"
                                value={form.expiry_date}
                                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">الكمية</label>
                            <input
                                type="number"
                                step="any"
                                value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">الوحدة</label>
                            <select
                                value={form.unit}
                                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                            >
                                <option value="piece">قطعة</option>
                                <option value="kg">كجم</option>
                                <option value="box">كرتونة</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">ملاحظات</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition"
                            rows={2}
                        />
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition">إلغاء</button>
                        <button type="submit" disabled={saving} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition font-bold disabled:opacity-50">
                            {saving ? 'جاري الحفظ...' : 'إنشاء'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

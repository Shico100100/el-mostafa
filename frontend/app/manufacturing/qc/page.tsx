'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';

interface QCStats {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
}

interface QCInspection {
    id: number;
    production_id: number;
    status: string;
    defects_count: number;
    notes?: string;
    created_at: string;
    inspector?: { id: number; email?: string };
    product?: { id: number; name: string };
    production?: {
        id: number;
        machine?: { name: string };
        mold?: { name: string };
        pieces_produced: number;
    };
}

interface PendingProduction {
    id: number;
    date: string;
    machine?: { id: number; name: string };
    mold?: { id: number; name: string };
    pieces_produced: number;
    status: string;
}

export default function QcPage() {
    const router = useRouter();
    const [stats, setStats] = useState<QCStats | null>(null);
    const [pending, setPending] = useState<PendingProduction[]>([]);
    const [recent, setRecent] = useState<QCInspection[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [selectedProductionId, setSelectedProductionId] = useState<number | ''>('');
    const [inspectionStatus, setInspectionStatus] = useState<'PASS' | 'FAIL'>('PASS');
    const [defectsCount, setDefectsCount] = useState(0);
    const [notes, setNotes] = useState('');

    const loadData = () => {
        setLoading(true);
        Promise.all([
            api.getQCStats().catch(() => null),
            api.getQCPending().catch(() => []),
            api.getQCRecent(50).catch(() => []),
        ])
            .then(([statsData, pendingData, recentData]) => {
                if (statsData) setStats(statsData);
                if (pendingData) setPending(pendingData);
                if (recentData) setRecent(recentData);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setSelectedProductionId('');
        setInspectionStatus('PASS');
        setDefectsCount(0);
        setNotes('');
    };

    const filteredRecent = recent.filter((r) => {
        const matchesSearch = !searchQuery || (r.product?.name || r.production?.mold?.name || r.production?.machine?.name || '')
            .toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateInspection = async () => {
        if (!selectedProductionId) return;
        setSaving(true);
        try {
            await api.createQCInspection({
                production_id: selectedProductionId,
                status: inspectionStatus,
                defects_count: defectsCount,
                notes,
            });
            setShowCreateModal(false);
            resetForm();
            loadData();
        } catch {
            alert('فشل إنشاء فحص الجودة');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/manufacturing')} className="p-2 hover:bg-white/10 rounded-full text-white transition text-xl">⬅️</button>
                        <h1 className="text-2xl font-bold text-white">✅ مراقبة الجودة</h1>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition text-sm"
                    >
                        + فحص جديد
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {loading ? (
                    <div className="text-center text-white py-12">جاري التحميل...</div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                                <div className="text-blue-300 text-sm">إجمالي الفحوصات</div>
                                <div className="text-3xl font-bold text-white">{stats?.total ?? 0}</div>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                                <div className="text-green-300 text-sm">ناجح</div>
                                <div className="text-3xl font-bold text-white">{stats?.passed ?? 0}</div>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
                                <div className="text-red-300 text-sm">راسب</div>
                                <div className="text-3xl font-bold text-white">{stats?.failed ?? 0}</div>
                            </div>
                            <div className={`p-6 rounded-2xl border ${(stats?.passRate ?? 0) < 80 ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                <div className={`${(stats?.passRate ?? 0) < 80 ? 'text-red-300' : 'text-emerald-300'} text-sm`}>نسبة النجاح</div>
                                <div className={`text-3xl font-bold ${(stats?.passRate ?? 0) < 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {stats?.passRate ? `${stats.passRate.toFixed(1)}%` : '—'}
                                </div>
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="بحث في الفحوصات..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PASS' | 'FAIL')}
                                className="px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm"
                            >
                                <option value="ALL">كل النتائج</option>
                                <option value="PASS">ناجح</option>
                                <option value="FAIL">راسب</option>
                            </select>
                        </div>

                        {/* Pending Inspections */}
                        {pending.length > 0 && (
                            <GlassPanel title="⚠️ فحوصات معلقة">
                                <div className="space-y-2">
                                    {pending.map((p) => (
                                        <div key={p.id} className="flex justify-between items-center bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                                            <div>
                                                <span className="text-white font-medium">{p.machine?.name || `إنتاج #${p.id}`}</span>
                                                <span className="text-gray-400 mr-4">{p.mold?.name || ''}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-400 text-sm">{p.pieces_produced} قطعة</span>
                                                <span className="text-amber-300 text-sm bg-amber-500/20 px-3 py-1 rounded-full">معلق</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassPanel>
                        )}

                        {/* Recent Inspections */}
                        <GlassPanel title="سجل الفحوصات">
                            <div className="overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400">
                                            <th className="text-right px-4 py-3">المنتج</th>
                                            <th className="text-right px-4 py-3">الماكينة</th>
                                            <th className="text-center px-4 py-3">النتيجة</th>
                                            <th className="text-center px-4 py-3">التاريخ</th>
                                            <th className="text-center px-4 py-3">الملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecent.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-12 text-gray-400">{recent.length === 0 ? 'لا توجد فحوصات بعد' : 'لا توجد نتائج للبحث'}</td></tr>
                                        ) : (
                                            filteredRecent.map((r) => (
                                                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                                    <td className="px-4 py-3 text-white font-medium">{r.product?.name || r.production?.mold?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-300">{r.production?.machine?.name || '—'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'PASS' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                            {r.status === 'PASS' ? 'ناجح' : 'راسب'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-400">
                                                        {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-400">{r.notes || '—'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </GlassPanel>
                    </>
                )}
            </main>

            {/* Create Inspection Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-full max-w-lg mx-4 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-6">فحص جودة جديد</h2>

                        <div className="space-y-4">
                            {/* Production Record Select */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">سجل الإنتاج</label>
                                <select
                                    value={selectedProductionId}
                                    onChange={(e) => setSelectedProductionId(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-white/10 text-white text-sm"
                                >
                                    <option value="">اختر سجل إنتاج...</option>
                                    {pending.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.machine?.name || `#${p.id}`} — {p.mold?.name || ''} ({p.pieces_produced} قطعة)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">النتيجة</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setInspectionStatus('PASS')}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${inspectionStatus === 'PASS' ? 'bg-green-600 text-white' : 'bg-slate-700 text-gray-300'}`}
                                    >
                                        ناجح
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInspectionStatus('FAIL')}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition ${inspectionStatus === 'FAIL' ? 'bg-red-600 text-white' : 'bg-slate-700 text-gray-300'}`}
                                    >
                                        راسب
                                    </button>
                                </div>
                            </div>

                            {/* Defects Count */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">عدد القطع التالفة</label>
                                <input
                                    type="number"
                                    value={defectsCount}
                                    onChange={(e) => setDefectsCount(Math.max(0, Number(e.target.value)))}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-white/10 text-white text-sm"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">ملاحظات</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-white/10 text-white text-sm resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition text-sm"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleCreateInspection}
                                disabled={saving || !selectedProductionId}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg transition text-sm"
                            >
                                {saving ? 'جاري الحفظ...' : 'حفظ الفحص'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

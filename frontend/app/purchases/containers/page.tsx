'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';

interface Container {
    id: number;
    name: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    max_weight_kg: number;
    max_cbm: number;
    is_active: boolean;
    notes: string;
}

interface ContainerSuggestion {
    id: number;
    name: string;
    max_cbm: number;
    utilization_pct: number;
    remaining_cbm: number;
    fits: boolean;
}

interface CbmResult {
    total_cbm: number;
    cartons_count: number;
    carton_volume_cm3: number;
    carton_dimensions: { length_cm: number; width_cm: number; height_cm: number };
    container_suggestions: ContainerSuggestion[];
}

export default function ContainersPage() {
    const router = useRouter();
    const [containers, setContainers] = useState<Container[]>([]);
    const [loading, setLoading] = useState(true);

    // CBM Calculator
    const [cbmLength, setCbmLength] = useState('');
    const [cbmWidth, setCbmWidth] = useState('');
    const [cbmHeight, setCbmHeight] = useState('');
    const [cbmCartons, setCbmCartons] = useState('1');
    const [cbmResult, setCbmResult] = useState<CbmResult | null>(null);
    const [cbmCalculating, setCbmCalculating] = useState(false);

    // Smart Reorder
    const [reorderContainerId, setReorderContainerId] = useState('');
    const [reorderResults, setReorderResults] = useState<Record<string, unknown> | null>(null);
    const [reorderLoading, setReorderLoading] = useState(false);

    // Dialog states
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
    const [form, setForm] = useState({
        name: '',
        length_cm: '',
        width_cm: '',
        height_cm: '',
        max_weight_kg: '',
        notes: '',
    });

    const loadData = useCallback(async () => {
        try {
            const data = await api.getContainers();
            setContainers(data);
        } catch (error) {
            console.error('Failed to load containers:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const resetForm = () => setForm({ name: '', length_cm: '', width_cm: '', height_cm: '', max_weight_kg: '', notes: '' });

    const openEdit = (c: Container) => {
        setSelectedContainer(c);
        setForm({
            name: c.name,
            length_cm: String(c.length_cm),
            width_cm: String(c.width_cm),
            height_cm: String(c.height_cm),
            max_weight_kg: String(c.max_weight_kg),
            notes: c.notes || '',
        });
        setShowEditDialog(true);
    };

    const handleSave = async (isEdit: boolean) => {
        try {
            const payload = {
                name: form.name,
                length_cm: Number(form.length_cm),
                width_cm: Number(form.width_cm),
                height_cm: Number(form.height_cm),
                max_weight_kg: Number(form.max_weight_kg),
                notes: form.notes || undefined,
            };
            if (isEdit && selectedContainer) {
                await api.updateContainer(selectedContainer.id, payload);
            } else {
                await api.createContainer(payload);
            }
            setShowAddDialog(false);
            setShowEditDialog(false);
            loadData();
        } catch (error) {
            console.error('Failed to save container:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه الحاوية؟')) return;
        try {
            await api.deleteContainer(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete container:', error);
        }
    };

    const handleCalculateCBM = async () => {
        setCbmCalculating(true);
        try {
            const result = await api.calculateCBM(
                Number(cbmLength), Number(cbmWidth), Number(cbmHeight), Number(cbmCartons),
            );
            setCbmResult(result);
        } catch (error) {
            console.error('CBM calculation failed:', error);
        } finally {
            setCbmCalculating(false);
        }
    };

    const handleReorderSuggestions = async () => {
        if (!reorderContainerId) return;
        setReorderLoading(true);
        try {
            const result = await api.getReorderSuggestions(+reorderContainerId);
            setReorderResults(result);
        } catch (error) {
            console.error('Reorder suggestions failed:', error);
        } finally {
            setReorderLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition";
    const labelClass = "block text-sm font-medium text-gray-300 mb-1";

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">📦 إدارة الحاويات</h1>
                    <div className="flex gap-3">
                        <button onClick={() => router.push('/purchases')} className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition">العودة</button>
                        <button onClick={() => { resetForm(); setShowAddDialog(true); }} className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/30 transition">+ حاوية جديدة</button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Containers Table */}
                <GlassPanel title="أنواع الحاويات القياسية">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="text-right px-6 py-4">الاسم</th>
                                <th className="text-center px-6 py-4">الأبعاد (سم)</th>
                                <th className="text-center px-6 py-4">السعة (CBM)</th>
                                <th className="text-center px-6 py-4">الوزن الأقصى (كجم)</th>
                                <th className="text-center px-6 py-4">الحالة</th>
                                <th className="text-center px-6 py-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {containers.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400">لا توجد حاويات مضافة</td></tr>
                            ) : (
                                containers.map((c) => (
                                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="px-6 py-4 text-white font-medium">{c.name}</td>
                                        <td className="px-6 py-4 text-center text-gray-300">{c.length_cm} × {c.width_cm} × {c.height_cm}</td>
                                        <td className="px-6 py-4 text-center text-amber-400 font-bold">{Number(c.max_cbm).toFixed(3)}</td>
                                        <td className="px-6 py-4 text-center text-gray-300">{Number(c.max_weight_kg).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs ${c.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                {c.is_active ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => openEdit(c)} className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition">تعديل</button>
                                                <button onClick={() => handleDelete(c.id)} className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition">حذف</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </GlassPanel>

                {/* CBM Calculator */}
                <GlassPanel title="🧮 حساب حجم الشحنة (CBM)">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>طول الكرتونة (سم)</label>
                                <input className={inputClass} type="number" value={cbmLength} onChange={e => setCbmLength(e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>عرض الكرتونة (سم)</label>
                                <input className={inputClass} type="number" value={cbmWidth} onChange={e => setCbmWidth(e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>ارتفاع الكرتونة (سم)</label>
                                <input className={inputClass} type="number" value={cbmHeight} onChange={e => setCbmHeight(e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>عدد الكراتين</label>
                                <input className={inputClass} type="number" value={cbmCartons} onChange={e => setCbmCartons(e.target.value)} min="1" />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleCalculateCBM}
                                    disabled={cbmCalculating}
                                    className="w-full px-4 py-3 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 transition disabled:opacity-50"
                                >
                                    {cbmCalculating ? '...' : 'احسب'}
                                </button>
                            </div>
                        </div>

                        {cbmResult && (
                            <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-amber-400">{cbmResult.total_cbm.toFixed(3)}</div>
                                        <div className="text-sm text-gray-400">إجمالي CBM</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-400">{cbmResult.cartons_count}</div>
                                        <div className="text-sm text-gray-400">عدد الكراتين</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-400">{cbmResult.carton_volume_cm3.toLocaleString()}</div>
                                        <div className="text-sm text-gray-400">حجم الكرتونة (سم³)</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm text-gray-400">
                                            {cbmResult.carton_dimensions.length_cm} × {cbmResult.carton_dimensions.width_cm} × {cbmResult.carton_dimensions.height_cm} سم
                                        </div>
                                        <div className="text-xs text-gray-500">أبعاد الكرتونة</div>
                                    </div>
                                </div>

                                {cbmResult.container_suggestions.length > 0 && (
                                    <div>
                                        <h3 className="text-white font-bold mb-3">مقارنة الحاويات</h3>
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10 text-gray-400 text-sm">
                                                    <th className="text-right px-4 py-3">الحاوية</th>
                                                    <th className="text-center px-4 py-3">السعة القصوى (CBM)</th>
                                                    <th className="text-center px-4 py-3">الاستخدام %</th>
                                                    <th className="text-center px-4 py-3">المساحة المتبقية (CBM)</th>
                                                    <th className="text-center px-4 py-3">تناسب؟</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(cbmResult.container_suggestions).map((s) => (
                                                    <tr key={s.id} className={`border-b border-white/5 ${s.fits ? 'bg-green-500/5' : ''}`}>
                                                        <td className="px-4 py-3 text-gray-300">{s.name}</td>
                                                        <td className="px-4 py-3 text-center text-gray-300">{s.max_cbm.toFixed(3)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center gap-2 justify-center">
                                                                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${s.utilization_pct > 90 ? 'bg-red-500' : s.utilization_pct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                                                        style={{ width: `${Math.min(s.utilization_pct, 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-gray-400">{s.utilization_pct.toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-300">{s.remaining_cbm.toFixed(3)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            {s.fits ? (
                                                                <span className="text-green-400 font-bold">✓</span>
                                                            ) : (
                                                                <span className="text-red-400">✗</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </GlassPanel>

                {/* Smart Reorder Suggestions */}
                <GlassPanel title="📦 اقتراحات إعادة الطلب الذكية">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className={labelClass}>اختر الحاوية</label>
                                <select className={inputClass} value={reorderContainerId} onChange={e => setReorderContainerId(e.target.value)}>
                                    <option value="">-- اختر --</option>
                                    {containers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({Number(c.max_cbm).toFixed(3)} CBM)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleReorderSuggestions}
                                    disabled={reorderLoading || !reorderContainerId}
                                    className="w-full px-4 py-3 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/30 transition disabled:opacity-50"
                                >
                                    {reorderLoading ? '...' : 'اقتراح إعادة الطلب'}
                                </button>
                            </div>
                        </div>

                        {reorderResults && (
                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <div className="text-lg font-bold text-cyan-400 mb-1">
                                        المساحة المتبقية: {(reorderResults.remaining_cbm as number).toFixed(3)} CBM
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        عدد الاقتراحات: {(reorderResults.suggestions as Array<unknown>).length}
                                    </div>
                                </div>

                                {(reorderResults.suggestions as Array<Record<string, unknown>>).length > 0 && (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                                <th className="text-right px-4 py-3">المنتج</th>
                                                <th className="text-right px-4 py-3">SKU</th>
                                                <th className="text-center px-4 py-3">النوع</th>
                                                <th className="text-center px-4 py-3">CBM/وحدة</th>
                                                <th className="text-center px-4 py-3">الحد الأقصى</th>
                                                <th className="text-center px-4 py-3">مقترح</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(reorderResults.suggestions as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => (
                                                <tr key={s.product_id as number} className="border-b border-white/5 hover:bg-white/5 transition">
                                                    <td className="px-4 py-3 text-white font-medium">{s.product_name as string}</td>
                                                    <td className="px-4 py-3 text-gray-400">{s.sku as string || '—'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300">
                                                            {s.type as string === 'RAW' ? 'خام' : s.type as string === 'FINISHED' ? 'نهائي' : s.type as string === 'SEMI' ? 'نصف مصنع' : 'ملحق'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-300">{(s.estimated_cbm_per_unit as number).toFixed(6)}</td>
                                                    <td className="px-4 py-3 text-center text-amber-400 font-bold">{(s.max_units_fit as number).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-center text-green-400 font-bold">{(s.suggested_qty as number).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </GlassPanel>
            </main>

            {/* Add Container Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">حاوية جديدة</h2>
                            <button onClick={() => setShowAddDialog(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className={labelClass}>الاسم (مثال: 20 قدم)</label>
                                <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={labelClass}>الطول (سم)</label>
                                    <input className={inputClass} type="number" value={form.length_cm} onChange={e => setForm({ ...form, length_cm: e.target.value })} required />
                                </div>
                                <div>
                                    <label className={labelClass}>العرض (سم)</label>
                                    <input className={inputClass} type="number" value={form.width_cm} onChange={e => setForm({ ...form, width_cm: e.target.value })} required />
                                </div>
                                <div>
                                    <label className={labelClass}>الارتفاع (سم)</label>
                                    <input className={inputClass} type="number" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>الوزن الأقصى (كجم)</label>
                                <input className={inputClass} type="number" value={form.max_weight_kg} onChange={e => setForm({ ...form, max_weight_kg: e.target.value })} required />
                            </div>
                            <div>
                                <label className={labelClass}>ملاحظات</label>
                                <input className={inputClass} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button onClick={() => setShowAddDialog(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
                                <button onClick={() => handleSave(false)} className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition">حفظ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Container Dialog */}
            {showEditDialog && selectedContainer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">تعديل الحاوية</h2>
                            <button onClick={() => setShowEditDialog(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className={labelClass}>الاسم</label>
                                <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={labelClass}>الطول (سم)</label>
                                    <input className={inputClass} type="number" value={form.length_cm} onChange={e => setForm({ ...form, length_cm: e.target.value })} required />
                                </div>
                                <div>
                                    <label className={labelClass}>العرض (سم)</label>
                                    <input className={inputClass} type="number" value={form.width_cm} onChange={e => setForm({ ...form, width_cm: e.target.value })} required />
                                </div>
                                <div>
                                    <label className={labelClass}>الارتفاع (سم)</label>
                                    <input className={inputClass} type="number" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>الوزن الأقصى (كجم)</label>
                                <input className={inputClass} type="number" value={form.max_weight_kg} onChange={e => setForm({ ...form, max_weight_kg: e.target.value })} required />
                            </div>
                            <div>
                                <label className={labelClass}>ملاحظات</label>
                                <input className={inputClass} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button onClick={() => setShowEditDialog(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
                                <button onClick={() => handleSave(true)} className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition">تحديث</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

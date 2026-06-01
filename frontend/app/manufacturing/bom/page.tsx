'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Product {
    id: number;
    name: string;
    sku: string;
    unit: string;
    type: string;
    cost_price: number;
    weight_grams: number;
    image_path: string;
    raw_material_type: string;
    description: string;
}

interface BOMItem {
    id: number;
    product_id: number;
    quantity: number;
    product: Product;
}

interface BOM {
    id: number;
    name: string;
    product_id: number;
    product: Product;
    items: BOMItem[];
    description: string;
    created_at: string;
    updated_at: string;
}

interface ExplodedComponent {
    product_id: number;
    product_name: string;
    sku: string;
    specs: string;
    weight_grams: number;
    raw_material_type: string;
    image_path: string;
    quantity_per_unit: number;
    total_quantity: number;
    unit: string;
    total_weight_grams: number;
    total_weight_kg: number;
}

interface ExplosionResult {
    bom_id: number;
    bom_name: string;
    product_name: string;
    requested_quantity: number;
    total_components: number;
    total_weight_grams: number;
    total_weight_kg: number;
    components: ExplodedComponent[];
}

export default function BOMPage() {
    const router = useRouter();
    const [boms, setBoms] = useState<BOM[]>([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);

    // Dialog state
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showExplodeDialog, setShowExplodeDialog] = useState(false);
    const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formProductId, setFormProductId] = useState('');
    const [formItems, setFormItems] = useState<{ product_id: string; quantity: string }[]>([]);

    // Explosion state
    const [explodeQuantity, setExplodeQuantity] = useState('1');
    const [explosionResult, setExplosionResult] = useState<ExplosionResult | null>(null);
    const [exploding, setExploding] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [bomsData, productsData] = await Promise.all([
                api.getBOMs(),
                api.getProducts(),
            ]);
            setBoms(bomsData);
            setProducts(productsData);
        } catch (error) {
            console.error('Failed to load BOM data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const resetForm = () => {
        setFormName('');
        setFormDescription('');
        setFormProductId('');
        setFormItems([]);
    };

    const openCreate = () => {
        resetForm();
        setShowCreateDialog(true);
    };

    const openEdit = (bom: BOM) => {
        setSelectedBOM(bom);
        setFormName(bom.name);
        setFormDescription(bom.description || '');
        setFormProductId(String(bom.product_id));
        setFormItems(bom.items.map(i => ({
            product_id: String(i.product_id),
            quantity: String(i.quantity),
        })));
        setShowEditDialog(true);
    };

    const openExplode = (bom: BOM) => {
        setSelectedBOM(bom);
        setExplodeQuantity('1');
        setExplosionResult(null);
        setShowExplodeDialog(true);
    };

    const addItem = () => {
        setFormItems([...formItems, { product_id: '', quantity: '1' }]);
    };

    const removeItem = (idx: number) => {
        setFormItems(formItems.filter((_, i) => i !== idx));
    };

    const updateItem = (idx: number, field: 'product_id' | 'quantity', value: string) => {
        const updated = [...formItems];
        updated[idx][field] = value;
        setFormItems(updated);
    };

    const handleSave = async (isEdit: boolean) => {
        try {
            const payload = {
                name: formName,
                product_id: Number(formProductId),
                description: formDescription,
                items: formItems.map(i => ({
                    product_id: Number(i.product_id),
                    quantity: Number(i.quantity),
                })),
            };

            if (isEdit && selectedBOM) {
                await api.updateBOM(selectedBOM.id, payload);
            } else {
                await api.createBOM(payload);
            }

            setShowCreateDialog(false);
            setShowEditDialog(false);
            loadData();
        } catch (error) {
            console.error('Failed to save BOM:', error);
        }
    };

    const handleExplode = async () => {
        if (!selectedBOM) return;
        setExploding(true);
        try {
            const result = await api.explodeBOM(selectedBOM.id, Number(explodeQuantity));
            setExplosionResult(result);
        } catch (error) {
            console.error('Failed to explode BOM:', error);
        } finally {
            setExploding(false);
        }
    };

    const generatePDF = (result: ExplosionResult) => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(`BOM Explosion Report: ${result.bom_name}`, pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Product: ${result.product_name}`, 14, 32);
        doc.text(`Requested Quantity: ${result.requested_quantity.toLocaleString()}`, 14, 40);
        doc.text(`Total Components: ${result.total_components}`, 14, 48);
        doc.text(`Total Weight: ${result.total_weight_kg.toFixed(3)} kg`, 14, 56);

        const currentDate = new Date().toLocaleDateString('en-GB');
        doc.text(`Generated: ${currentDate}`, pageWidth - 14, 32, { align: 'right' });

        const tableData = result.components.map((comp, idx) => [
            idx + 1,
            comp.product_name,
            comp.sku || '—',
            comp.weight_grams > 0 ? `${comp.weight_grams}` : '—',
            comp.raw_material_type || '—',
            comp.total_quantity.toLocaleString(),
            `${comp.total_weight_kg.toFixed(3)}`,
        ]);

        autoTable(doc, {
            startY: 65,
            head: [['#', 'Component', 'SKU', 'Weight (g)', 'Material', 'Quantity', 'Total Weight (kg)']],
            body: tableData,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: 255,
                fontStyle: 'bold',
            },
            foot: [['', '', '', '', 'Total', '', `${result.total_weight_kg.toFixed(3)} kg`]],
            footStyles: {
                fillColor: [240, 240, 240],
                textColor: 0,
                fontStyle: 'bold',
            },
        });

        doc.save(`BOM_${result.bom_name.replace(/\s+/g, '_')}_${result.requested_quantity}.pdf`);
    };

    const getProductName = (id: number) => {
        return products.find(p => p.id === id)?.name || `#${id}`;
    };

    const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";

    const labelClass = "block text-sm font-medium text-gray-300 mb-1";

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">📋 قائمة المكونات (BOM)</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/manufacturing')}
                            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                        >
                            العودة للتصنيع
                        </button>
                        <button
                            onClick={openCreate}
                            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 transition"
                        >
                            + BOM جديد
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <GlassPanel className="overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="text-right px-6 py-4">الاسم</th>
                                <th className="text-right px-6 py-4">المنتج النهائي</th>
                                <th className="text-center px-6 py-4">عدد المكونات</th>
                                <th className="text-center px-6 py-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boms.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-gray-400">
                                        لا توجد قوائم مكونات بعد. أضف BOM جديد للبدء.
                                    </td>
                                </tr>
                            ) : (
                                boms.map((bom) => (
                                    <tr key={bom.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="px-6 py-4 text-white font-medium">{bom.name}</td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {bom.product?.name || getProductName(bom.product_id)}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-300">{bom.items?.length || 0}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => openExplode(bom)}
                                                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-sm transition"
                                                >
                                                    تفجير
                                                </button>
                                                <button
                                                    onClick={() => openEdit(bom)}
                                                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition"
                                                >
                                                    تعديل
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </GlassPanel>
            </main>

            {/* Create BOM Dialog */}
            {showCreateDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">BOM جديد</h2>
                            <button onClick={() => setShowCreateDialog(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className={labelClass}>الاسم</label>
                                <input className={inputClass} value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثال: BOM مفتاح سحري" />
                            </div>
                            <div>
                                <label className={labelClass}>المنتج النهائي</label>
                                <select className={inputClass} value={formProductId} onChange={e => setFormProductId(e.target.value)}>
                                    <option value="">اختر منتج...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>وصف</label>
                                <textarea className={inputClass} value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className={labelClass}>المكونات</label>
                                    <button onClick={addItem} className="text-sm px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition">+ إضافة مكون</button>
                                </div>
                                {formItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 mb-2 items-end">
                                        <div className="flex-1">
                                            <select
                                                className={inputClass}
                                                value={item.product_id}
                                                onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                            >
                                                <option value="">اختر مكون...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                className={inputClass}
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                placeholder="الكمية"
                                                min="0"
                                                step="0.0001"
                                            />
                                        </div>
                                        <button onClick={() => removeItem(idx)} className="px-3 py-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
                            <button onClick={() => setShowCreateDialog(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
                            <button onClick={() => handleSave(false)} className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition">حفظ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit BOM Dialog */}
            {showEditDialog && selectedBOM && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">تعديل BOM: {selectedBOM.name}</h2>
                            <button onClick={() => setShowEditDialog(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className={labelClass}>الاسم</label>
                                <input className={inputClass} value={formName} onChange={e => setFormName(e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>المنتج النهائي</label>
                                <select className={inputClass} value={formProductId} onChange={e => setFormProductId(e.target.value)}>
                                    <option value="">اختر منتج...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>وصف</label>
                                <textarea className={inputClass} value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className={labelClass}>المكونات</label>
                                    <button onClick={addItem} className="text-sm px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition">+ إضافة مكون</button>
                                </div>
                                {formItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 mb-2 items-end">
                                        <div className="flex-1">
                                            <select
                                                className={inputClass}
                                                value={item.product_id}
                                                onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                            >
                                                <option value="">اختر مكون...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                className={inputClass}
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                min="0"
                                                step="0.0001"
                                            />
                                        </div>
                                        <button onClick={() => removeItem(idx)} className="px-3 py-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition">✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
                            <button onClick={() => setShowEditDialog(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
                            <button onClick={() => handleSave(true)} className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition">تحديث</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Explode BOM Dialog */}
            {showExplodeDialog && selectedBOM && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">تفجير BOM: {selectedBOM.name}</h2>
                            <button onClick={() => setShowExplodeDialog(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className={labelClass}>المنتج: {selectedBOM.product?.name || getProductName(selectedBOM.product_id)}</label>
                                </div>
                                <div className="w-40">
                                    <label className={labelClass}>الكمية المطلوبة</label>
                                    <input
                                        className={inputClass}
                                        type="number"
                                        value={explodeQuantity}
                                        onChange={e => setExplodeQuantity(e.target.value)}
                                        min="1"
                                    />
                                </div>
                                <button
                                    onClick={handleExplode}
                                    disabled={exploding}
                                    className="px-6 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition disabled:opacity-50"
                                >
                                    {exploding ? 'جاري التفجير...' : '🔨 تفجير'}
                                </button>
                            </div>

                            {explosionResult && (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white/5 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-emerald-400">{explosionResult.total_components}</div>
                                            <div className="text-sm text-gray-400">إجمالي المكونات</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-blue-400">{explosionResult.total_weight_kg.toFixed(3)}</div>
                                            <div className="text-sm text-gray-400">الوزن الإجمالي (كجم)</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-purple-400">{explosionResult.total_weight_grams.toFixed(0)}</div>
                                            <div className="text-sm text-gray-400">الوزن الإجمالي (جرام)</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-amber-400">{explosionResult.requested_quantity.toLocaleString()}</div>
                                            <div className="text-sm text-gray-400">الكمية المطلوبة</div>
                                        </div>
                                    </div>

                                    <GlassPanel className="overflow-hidden" title="تفاصيل المكونات">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10 text-gray-400 text-sm">
                                                    <th className="text-right px-4 py-3">#</th>
                                                    <th className="text-right px-4 py-3">المكون</th>
                                                    <th className="text-center px-4 py-3">SKU</th>
                                                    <th className="text-center px-4 py-3">الوزن (جرام)</th>
                                                    <th className="text-center px-4 py-3">نوع الخامة</th>
                                                    <th className="text-center px-4 py-3">الكمية</th>
                                                    <th className="text-center px-4 py-3">الوزن الإجمالي (كجم)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {explosionResult.components.map((comp, idx) => (
                                                    <tr key={comp.product_id} className="border-b border-white/5 hover:bg-white/5 transition">
                                                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                {comp.image_path && (
                                                                    <Image
                                                                        src={comp.image_path}
                                                                        alt={comp.product_name}
                                                                        width={40}
                                                                        height={40}
                                                                        className="rounded-lg object-cover"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <div className="text-white font-medium">{comp.product_name}</div>
                                                                    {comp.specs && <div className="text-gray-400 text-xs">{comp.specs}</div>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-300">{comp.sku || '—'}</td>
                                                        <td className="px-4 py-3 text-center text-gray-300">{comp.weight_grams > 0 ? comp.weight_grams : '—'}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">
                                                                {comp.raw_material_type || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-300">
                                                            {comp.total_quantity.toLocaleString()} {comp.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-300">{comp.total_weight_kg.toFixed(3)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </GlassPanel>
                                </>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
                            <div>
                                {explosionResult && (
                                    <button
                                        onClick={() => generatePDF(explosionResult)}
                                        className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition flex items-center gap-2"
                                    >
                                        <span>📄</span> تحميل PDF للمورد
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setShowExplodeDialog(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

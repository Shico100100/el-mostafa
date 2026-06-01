'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import ExcelActions from '@/components/ExcelActions';

const useTranslation = () => ({
  t: (key: string, fallback?: string) => fallback ?? key,
});

interface Accessory {
    id: number;
    product: {
        id: number;
        name: string;
        unit: string;
    };
    preferred_supplier?: {
        name: string;
    };
    reorder_point: number;
    last_purchase_price: number;
    current_stock: number;
    stock_status: string;
    notes?: string;
    weight_per_piece?: number;
    image_path?: string;
}

interface HistoryItem {
    id: number;
    date: string;
    type: 'IN' | 'OUT';
    quantity: number;
    notes?: string;
}

interface ReportItem {
    accessory_name?: string;
    product?: {
        name: string;
        unit: string;
    };
    unit?: string;
    total_consumed?: number;
    last_movement_date: string;
    current_stock?: number;
}

interface POItem {
    product_name: string;
    supplier: string;
    current_stock: number;
    reorder_point: number;
    suggested_quantity: number;
    last_price: number;
    total_estimated_cost: number;
}

export default function AccessoriesPage() {
    const router = useRouter();
    const [accessories, setAccessories] = useState<Accessory[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    // Dialogs
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showStockDialog, setShowStockDialog] = useState(false);
    const [showConsumeDialog, setShowConsumeDialog] = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);

    const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [totalValue, setTotalValue] = useState({ total_value: 0, count: 0 });
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [stockMode, setStockMode] = useState<'UNIT' | 'KG'>('UNIT');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // New Features State
    const [showReportsDialog, setShowReportsDialog] = useState(false);
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [showPODialog, setShowPODialog] = useState(false);
    const [reportType, setReportType] = useState<'TOP' | 'SLOW'>('TOP');
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [poData, setPoData] = useState<POItem[]>([]);
    const [bulkItems, setBulkItems] = useState<{ id: number; quantity: string; price: string }[]>([{ id: 0, quantity: '', price: '' }]);

    const loadData = useCallback(async () => {
        try {
            const data = await api.fetchWithAuth('/manufacturing/accessories');
            const sortedData = sortAlphabetically(data, (item: Accessory) => item.product.name);
            // Add translation support for accessory names
            setAccessories(sortedData.map((acc: Accessory) => ({
                ...acc,
                product: {
                    ...acc.product,
                    name: t(`accessories.${acc.product.name.toLowerCase().replace(/ /g, '_')}`, acc.product.name)
                }
            })));

            const stats = await api.fetchWithAuth('/manufacturing/accessories/stats/total-value');
            setTotalValue(stats);
        } catch (error) {
            console.error('Failed to load accessories:', error);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== undefined && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });
            // Add translation support for form data
            if (formData.name) {
                data.append('name_translation', JSON.stringify({
                    ar: formData.name,
                    en: formData.name
                }));
            }
            if (selectedFile) {
                data.append('image', selectedFile);
            }

            await api.fetchWithAuth('/manufacturing/accessories' + (selectedAccessory ? `/${selectedAccessory.id}` : ''), {
                method: selectedAccessory ? 'PUT' : 'POST',
                body: data,
            });

            setShowAddDialog(false);
            setSelectedFile(null); // Reset file
            loadData();
        } catch {
            alert('Error saving data');
        }
    };

    const handleStockOperation = async (type: 'add' | 'consume', e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccessory) return;

        let quantity = Number(formData.quantity);
        // Add translation support for stock operation notes
        if (formData.notes) {
            formData.notes = t('stock_operation_notes', formData.notes);
        }

        // Conversion Logic
        if (stockMode === 'KG' && selectedAccessory.weight_per_piece) {
            // KG to Pieces: (KG * 1000) / weight_per_piece
            quantity = (quantity * 1000) / selectedAccessory.weight_per_piece;
            quantity = Math.round(quantity); // Round to nearest integer
        }

        const url = `/manufacturing/accessories/${selectedAccessory.id}/stock/${type}`;
        try {
            await api.fetchWithAuth(url, {
                method: 'POST',
                body: JSON.stringify({ ...formData, quantity })
            });
            setShowStockDialog(false);
            setShowConsumeDialog(false);
            loadData();
            alert('تمت العملية بنجاح');
        } catch {
            alert('حدث خطأ');
        }
    };

    const handleHistory = async (acc: Accessory) => {
        try {
            const data = await api.fetchWithAuth(`/manufacturing/accessories/${acc.id}/history`);
            setHistory(data);
            setSelectedAccessory(acc);
            setShowHistoryDialog(true);
        } catch {
            alert('Failed to load history');
        }
    };

    const handleReports = async (type: 'TOP' | 'SLOW') => {
        setReportType(type);
        try {
            const endpoint = type === 'TOP'
                ? '/manufacturing/accessories/reports/top-consumed?limit=10'
                : '/manufacturing/accessories/reports/slow-moving?months=3';
            const data = await api.fetchWithAuth(endpoint);
            setReportData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDraftPO = async () => {
        try {
            const data = await api.fetchWithAuth('/manufacturing/accessories/po/draft');
            setPoData(data);
            setShowPODialog(true);
        } catch {
            alert('Error generating PO');
        }
    };

    const handleBulkSubmit = async () => {
        const validItems = bulkItems.filter(i => i.id && Number(i.quantity) > 0).map(i => ({
            id: Number(i.id),
            quantity: Number(i.quantity),
            price: i.price ? Number(i.price) : undefined
        }));

        if (validItems.length === 0) return;

        try {
            await api.fetchWithAuth('/manufacturing/accessories/stock/bulk', {
                method: 'POST',
                body: JSON.stringify({ items: validItems })
            });
            setShowBulkDialog(false);
            setBulkItems([{ id: 0, quantity: '', price: '' }]);
            loadData();
            alert('تم استلام الشحنة بنجاح');
        } catch {
            alert('خطأ في العملية');
        }
    };

    const openStockDialog = (acc: Accessory, type: 'add' | 'consume') => {
        setSelectedAccessory(acc);
        setFormData({ quantity: '' }); // Reset
        setStockMode('UNIT'); // Default to Unit
        if (type === 'add') setShowStockDialog(true);
        else setShowConsumeDialog(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NORMAL': return 'bg-green-500/20 text-green-400';
            case 'LOW_STOCK': return 'bg-yellow-500/20 text-yellow-400';
            case 'OUT_OF_STOCK': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    if (loading) return <div className="text-white text-center mt-20">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full text-white transition">➡️</button>
                        <h1 className="text-2xl font-bold text-white">⚙️ إدارة الأكسسوارات</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Stats Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-6 rounded-2xl backdrop-blur-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">إجمالي قيمة المخزون</p>
                                <h3 className="text-3xl font-bold text-white">
                                    {Number(totalValue.total_value).toLocaleString()} ج.م
                                </h3>
                            </div>
                            <div className="text-3xl">💰</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mb-6">
                    <div className="flex gap-3">
                        <ExcelActions
                            exportUrl="/manufacturing/accessories/export/excel"
                            importUrl="/manufacturing/accessories/import/excel"
                            fileName="accessories.xlsx"
                            onImportSuccess={loadData}
                        />
                        <button
                            onClick={() => setShowReportsDialog(true)}
                            className="px-4 py-2 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition"
                        >
                            📊 التقارير
                        </button>
                        <button
                            onClick={handleDraftPO}
                            className="px-4 py-2 bg-orange-600/20 text-orange-300 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg transition"
                        >
                            📑 مسودة طلبية
                        </button>
                        <button
                            onClick={() => setShowBulkDialog(true)}
                            className="px-4 py-2 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg transition"
                        >
                            📦 استلام مجمع
                        </button>
                        <button
                            onClick={() => {
                                setSelectedAccessory(null);
                                setFormData({});
                                setSelectedFile(null);
                                setShowAddDialog(true);
                            }}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                        >
                            + إضافة أكسسوار
                        </button>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <table className="w-full text-right">
                        <thead className="bg-white/5 text-gray-300">
                            <tr>
                                <th className="px-6 py-4">الصورة</th>
                                <th className="px-6 py-4">الاسم</th>
                                <th className="px-6 py-4">الرصيد</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">الوزن (جم)</th>
                                <th className="px-6 py-4">حد الطلب</th>
                                <th className="px-6 py-4">آخر سعر</th>
                                <th className="px-6 py-4">المورد</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-gray-200">
                            {accessories.map((acc) => (
                                <tr key={acc.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4">
                                        {acc.image_path ? (
                                            <Image
                                                src={acc.image_path}
                                                alt={acc.product.name}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 object-cover rounded cursor-pointer hover:scale-150 transition"
                                                onClick={() => window.open(acc.image_path, '_blank')}
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-xs text-gray-400">NA</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium">{acc.product.name}</td>
                                    <td className="px-6 py-4">{acc.current_stock} {acc.product.unit}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(acc.stock_status)}`}>
                                            {acc.stock_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">{acc.weight_per_piece ? `${acc.weight_per_piece} جم` : '-'}</td>
                                    <td className="px-6 py-4">{acc.reorder_point}</td>
                                    <td className="px-6 py-4">{Number(acc.last_purchase_price).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-gray-400">{acc.preferred_supplier?.name || '-'}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => openStockDialog(acc, 'add')}
                                            className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30" title="إضافة رصيد"
                                        >
                                            ➕
                                        </button>
                                        <button
                                            onClick={() => openStockDialog(acc, 'consume')}
                                            className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30" title="صرف"
                                        >
                                            ➖
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedAccessory(acc);
                                                setFormData({
                                                    name: acc.product.name,
                                                    unit: acc.product.unit,
                                                    reorder_point: String(acc.reorder_point),
                                                    notes: acc.notes || '',
                                                    weight_per_piece: acc.weight_per_piece != null ? String(acc.weight_per_piece) : ''
                                                });
                                                setSelectedFile(null); // Clear selected file when editing
                                                setShowAddDialog(true);
                                            }}
                                            className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30" title="تعديل"
                                        >
                                            ✏️
                                        </button>

                                        <button
                                            onClick={() => handleHistory(acc)}
                                            className="p-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30" title="سجل الحركات"
                                        >
                                            📜
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('هل أنت متأكد من حذف هذا الأكسسوار؟')) {
                                                    api.fetchWithAuth(`/manufacturing/accessories/${acc.id}`, {
                                                        method: 'DELETE'
                                                    }).then(() => {
                                                        loadData();
                                                        alert('تم الحذف بنجاح');
                                                    }).catch(() => {
                                                        alert('حدث خطأ أثناء الحذف');
                                                    });
                                                }
                                            }}
                                            className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-900/30" title="حذف"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {accessories.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-8 text-gray-500">لا توجد بيانات</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main >

            {/* Add/Edit Dialog */}
            {
                showAddDialog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 p-8 rounded-xl w-full max-w-md border border-white/20">
                            <h2 className="text-xl font-bold text-white mb-4">{selectedAccessory ? 'تعديل' : 'إضافة جديد'}</h2>
                            <form onSubmit={handleSave} className="space-y-4">
                                <input
                                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                    placeholder="اسم الأكسسوار"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">صورة الأكسسوار (اختياري)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => e.target.files && setSelectedFile(e.target.files[0])}
                                        className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                        placeholder="الوحدة (قطعة، متر...)"
                                        value={formData.unit || ''}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                        placeholder="حد الطلب"
                                        value={formData.reorder_point || ''}
                                        onChange={e => setFormData({ ...formData, reorder_point: e.target.value })}
                                    />
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                    placeholder="وزن القطعة (جرام) - اختياري"
                                    value={formData.weight_per_piece || ''}
                                    onChange={e => setFormData({ ...formData, weight_per_piece: e.target.value })}
                                />
                                <textarea
                                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                    placeholder="ملاحظات"
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                                <div className="flex gap-2 justify-end mt-6">
                                    <button type="button" onClick={() => setShowAddDialog(false)} className="px-4 py-2 text-gray-300">إلغاء</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Stock Operations Dialogs */}
            {
                (showStockDialog || showConsumeDialog) && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 p-8 rounded-xl w-full max-w-sm border border-white/20">
                            <h2 className="text-xl font-bold text-white mb-4">
                                {showStockDialog ? 'إضافة رصيد (شراء)' : 'صرف (استخدام)'}
                            </h2>
                            <form onSubmit={(e) => handleStockOperation(showStockDialog ? 'add' : 'consume', e)} className="space-y-4">
                                {selectedAccessory?.weight_per_piece && Number(selectedAccessory.weight_per_piece) > 0 && (
                                    <div className="flex bg-white/5 p-1 rounded-lg mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setStockMode('UNIT')}
                                            className={`flex-1 py-1 rounded-md text-sm transition ${stockMode === 'UNIT' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            بالعدد ({selectedAccessory.product.unit})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStockMode('KG')}
                                            className={`flex-1 py-1 rounded-md text-sm transition ${stockMode === 'KG' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            بالوزن (KG)
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400">
                                        {stockMode === 'KG' ? 'الوزن بالكيلو جرام' : 'الكمية'}
                                    </label>
                                    <input
                                        type="number"
                                        step={stockMode === 'KG' ? "0.001" : "1"}
                                        className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                        placeholder={stockMode === 'KG' ? "أدخل الوزن" : "أدخل العدد"}
                                        value={formData.quantity || ''}
                                        onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        required
                                    />
                                    {stockMode === 'KG' && formData.quantity && (
                                        <p className="text-sm text-green-400">
                                            ≈ {Math.round((Number(formData.quantity) * 1000) / (selectedAccessory?.weight_per_piece || 1))} قطعة
                                        </p>
                                    )}
                                </div>
                                {showStockDialog && (
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                        placeholder="سعر الشراء (اختياري)"
                                        value={formData.price || ''}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                )}
                                <input
                                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                    placeholder="ملاحظات"
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                                <div className="flex gap-2 justify-end mt-6">
                                    <button type="button" onClick={() => { setShowStockDialog(false); setShowConsumeDialog(false); }} className="px-4 py-2 text-gray-300">إلغاء</button>
                                    <button type="submit" className={`px-4 py-2 text-white rounded ${showStockDialog ? 'bg-green-600' : 'bg-red-600'}`}>
                                        {showStockDialog ? 'تأكيد الإضافة' : 'تأكيد الصرف'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }


            {/* History Dialog */}
            {
                showHistoryDialog && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-slate-800 p-8 rounded-xl w-full max-w-2xl border border-white/20">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">سجل الحركات - {selectedAccessory?.product.name}</h2>
                                <button onClick={() => setShowHistoryDialog(false)} className="text-gray-400 hover:text-white">✕</button>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                <table className="w-full text-right text-sm">
                                    <thead className="text-gray-400 border-b border-white/10">
                                        <tr>
                                            <th className="py-2">التاريخ</th>
                                            <th className="py-2">النوع</th>
                                            <th className="py-2">الكمية</th>
                                            <th className="py-2">ملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-300 divide-y divide-white/5">
                                        {history.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-2">{new Date(item.date).toLocaleDateString('ar-EG')}</td>
                                                <td className="py-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${item.type === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {item.type === 'IN' ? 'إضافة' : 'صرف'}
                                                    </span>
                                                </td>
                                                <td className="py-2">{item.quantity}</td>
                                                <td className="py-2 text-gray-500">{item.notes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reports Dialog */}
            {showReportsDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-8 rounded-xl w-full max-w-2xl border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">📊 تقارير الأكسسوارات</h2>
                            <button onClick={() => setShowReportsDialog(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
                            <button
                                onClick={() => handleReports('TOP')}
                                className={`px-4 py-2 rounded-lg transition ${reportType === 'TOP' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                🔥 الأكثر استهلاكاً
                            </button>
                            <button
                                onClick={() => handleReports('SLOW')}
                                className={`px-4 py-2 rounded-lg transition ${reportType === 'SLOW' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                🐢 المخزون الراكد
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="text-gray-400 border-b border-white/10">
                                    <tr>
                                        <th className="py-2">الاسم</th>
                                        <th className="py-2">الوحدة</th>
                                        <th className="py-2">{reportType === 'TOP' ? 'الكمية المستهلكة' : 'آخر حركة خروج'}</th>
                                        <th className="py-2">{reportType === 'SLOW' ? 'الرصيد الحالي' : ''}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-300 divide-y divide-white/5">
                                    {reportData.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="py-2">{row.accessory_name || row.product?.name}</td>
                                            <td className="py-2">{row.unit || row.product?.unit}</td>
                                            <td className="py-2 text-blue-300 font-bold">
                                                {reportType === 'TOP' ? row.total_consumed : (row.last_movement_date ? new Date(row.last_movement_date).toLocaleDateString() : '-')}
                                            </td>
                                            <td className="py-2">
                                                {reportType === 'SLOW' ? row.current_stock : ''}
                                            </td>
                                        </tr>
                                    ))}
                                    {reportData.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-4 text-gray-500">جاري التحميل أو لا توجد بيانات</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* PO Draft Dialog */}
            {showPODialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white text-black p-8 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:h-full print:rounded-none">
                        <div className="flex justify-between items-start mb-8 border-b pb-4">
                            <div>
                                <h1 className="text-2xl font-bold mb-2">طلب شراء نواقص (Draft PO)</h1>
                                <p className="text-sm text-gray-600">تاريخ الإنشاء: {new Date().toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 print:hidden">
                                🖨️ طباعة
                            </button>
                            <button onClick={() => setShowPODialog(false)} className="text-gray-400 hover:text-black print:hidden text-xl mr-4">✕</button>
                        </div>
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-2 border">م</th>
                                    <th className="p-2 border">الصنف</th>
                                    <th className="p-2 border">المورد المفضل</th>
                                    <th className="p-2 border">الرصيد الحالي</th>
                                    <th className="p-2 border">حد الطلب</th>
                                    <th className="p-2 border">الكمية المقترحة</th>
                                    <th className="p-2 border">آخر سعر</th>
                                    <th className="p-2 border">إجمالي تقديري</th>
                                </tr>
                            </thead>
                            <tbody>
                                {poData.map((item, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="p-2 border">{idx + 1}</td>
                                        <td className="p-2 border font-bold">{item.product_name}</td>
                                        <td className="p-2 border">{item.supplier}</td>
                                        <td className="p-2 border text-red-600">{item.current_stock}</td>
                                        <td className="p-2 border">{item.reorder_point}</td>
                                        <td className="p-2 border bg-yellow-50">{item.suggested_quantity}</td>
                                        <td className="p-2 border">{Number(item.last_price).toFixed(2)}</td>
                                        <td className="p-2 border font-bold">{Number(item.total_estimated_cost).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 border-t-2">
                                    <td colSpan={7} className="p-2 font-bold text-center">الإجمالي الكلي التقديري</td>
                                    <td className="p-2 font-bold border">{poData.reduce((sum, i) => sum + Number(i.total_estimated_cost), 0).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Bulk Stock Dialog */}
            {showBulkDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-8 rounded-xl w-full max-w-4xl border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">📦 استلام شحنة مجمعة</h2>
                            <button onClick={() => setShowBulkDialog(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto mb-6">
                            <table className="w-full text-right">
                                <thead className="text-gray-400">
                                    <tr>
                                        <th className="px-4 py-2">الصنف</th>
                                        <th className="px-4 py-2 w-32">الكمية</th>
                                        <th className="px-4 py-2 w-32">السعر (اختياري)</th>
                                        <th className="px-4 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-white/5">
                                            <td className="px-4 py-2">
                                                <select
                                                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                                    value={item.id}
                                                    onChange={(e) => {
                                                        const updated = [...bulkItems];
                                                        updated[idx].id = Number(e.target.value);
                                                        setBulkItems(updated);
                                                    }}
                                                >
                                                    <option value={0}>اختر صنف...</option>
                                                    {accessories.map(acc => (
                                                        <option key={acc.id} value={acc.id}>{acc.product.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                                    placeholder="الكمية"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const updated = [...bulkItems];
                                                        updated[idx].quantity = e.target.value;
                                                        setBulkItems(updated);
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                                                    placeholder="السعر"
                                                    value={item.price}
                                                    onChange={(e) => {
                                                        const updated = [...bulkItems];
                                                        updated[idx].price = e.target.value;
                                                        setBulkItems(updated);
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <button
                                                    onClick={() => {
                                                        const updated = bulkItems.filter((_, i) => i !== idx);
                                                        setBulkItems(updated);
                                                    }}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between">
                            <button
                                onClick={() => setBulkItems([...bulkItems, { id: 0, quantity: '', price: '' }])}
                                className="px-4 py-2 border border-dashed border-gray-500 text-gray-400 rounded hover:border-white hover:text-white"
                            >
                                + إضافة سطر
                            </button>
                            <div className="flex gap-2">
                                <button onClick={() => setShowBulkDialog(false)} className="px-4 py-2 text-gray-300">إلغاء</button>
                                <button onClick={handleBulkSubmit} className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">تأكيد الاستلام</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

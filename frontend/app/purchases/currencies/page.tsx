'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import GlassPanel from '@/components/ui/GlassPanel';

interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate_to_egp: number;
    is_active: boolean;
}

interface FxRate {
    id: number;
    currency_id: number;
    rate_to_egp: number;
    amount_paid: number;
    notes: string;
    rate_date: string;
    currency?: Currency;
}

export default function CurrenciesPage() {
    const router = useRouter();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [fxRates, setFxRates] = useState<FxRate[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialogs
    const [showAddCurrency, setShowAddCurrency] = useState(false);
    const [showEditCurrency, setShowEditCurrency] = useState(false);
    const [showFxRate, setShowFxRate] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

    // Forms
    const [formCode, setFormCode] = useState('');
    const [formName, setFormName] = useState('');
    const [formSymbol, setFormSymbol] = useState('');
    const [formRate, setFormRate] = useState('');
    const [fxCurrencyId, setFxCurrencyId] = useState('');
    const [fxRate, setFxRate] = useState('');
    const [fxAmount, setFxAmount] = useState('');
    const [fxDate, setFxDate] = useState('');
    const [fxNotes, setFxNotes] = useState('');

    const [weightedAvg, setWeightedAvg] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [currenciesData, fxRatesData] = await Promise.all([
                api.getAllCurrencies(),
                api.getFxRates(),
            ]);
            setCurrencies(currenciesData);
            setFxRates(fxRatesData);
        } catch (error) {
            console.error('Failed to load currency data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const resetCurrencyForm = () => {
        setFormCode('');
        setFormName('');
        setFormSymbol('');
        setFormRate('');
    };

    const openEditCurrency = (c: Currency) => {
        setSelectedCurrency(c);
        setFormCode(c.code);
        setFormName(c.name);
        setFormSymbol(c.symbol || '');
        setFormRate(String(c.exchange_rate_to_egp));
        setShowEditCurrency(true);
    };

    const openFxRate = (c: Currency) => {
        setSelectedCurrency(c);
        setFxCurrencyId(String(c.id));
        setFxRate('');
        setFxAmount('');
        setFxDate(new Date().toISOString().split('T')[0]);
        setFxNotes('');
        setWeightedAvg(null);
        setShowFxRate(true);
    };

    const calcWeightedAvg = async (currencyId: number) => {
        try {
            const avg = await api.getWeightedAverageFx(currencyId);
            setWeightedAvg(avg);
        } catch {
            setWeightedAvg(null);
        }
    };

    const handleCreateCurrency = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createCurrency({
                code: formCode.toUpperCase(),
                name: formName,
                symbol: formSymbol,
                exchange_rate_to_egp: Number(formRate),
            });
            setShowAddCurrency(false);
            loadData();
        } catch (error) {
            console.error('Failed to create currency:', error);
        }
    };

    const handleUpdateCurrency = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCurrency) return;
        try {
            await api.updateCurrency(selectedCurrency.id, {
                code: formCode.toUpperCase(),
                name: formName,
                symbol: formSymbol,
                exchange_rate_to_egp: Number(formRate),
            });
            setShowEditCurrency(false);
            loadData();
        } catch (error) {
            console.error('Failed to update currency:', error);
        }
    };

    const handleAddFxRate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.addFxRate({
                currency_id: Number(fxCurrencyId),
                rate_to_egp: Number(fxRate),
                amount_paid: fxAmount ? Number(fxAmount) : null,
                rate_date: fxDate,
                notes: fxNotes || undefined,
            });
            setShowFxRate(false);
            loadData();
        } catch (error) {
            console.error('Failed to add FX rate:', error);
        }
    };

    const handleDeleteCurrency = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه العملة؟')) return;
        try {
            await api.deleteCurrency(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete currency:', error);
        }
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
                    <h1 className="text-2xl font-bold text-white">💱 إدارة العملات</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/purchases')}
                            className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                        >
                            العودة
                        </button>
                        <button
                            onClick={() => { resetCurrencyForm(); setShowAddCurrency(true); }}
                            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 transition"
                        >
                            + عملة جديدة
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                <GlassPanel title="العملات">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="text-right px-6 py-4">الرمز</th>
                                <th className="text-right px-6 py-4">الاسم</th>
                                <th className="text-center px-6 py-4">سعر الصرف (→ EGP)</th>
                                <th className="text-center px-6 py-4">الحالة</th>
                                <th className="text-center px-6 py-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currencies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">لا توجد عملات مضافة بعد</td>
                                </tr>
                            ) : (
                                currencies.map((c) => (
                                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="px-6 py-4">
                                            <span className="text-white font-bold text-lg">{c.symbol || c.code}</span>
                                            <span className="text-gray-400 mr-2">{c.code}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{c.name}</td>
                                        <td className="px-6 py-4 text-center text-gray-300">
                                            {Number(c.exchange_rate_to_egp).toFixed(4)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs ${c.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                {c.is_active ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => openFxRate(c)} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm hover:bg-emerald-500/30 transition">سعر</button>
                                                <button onClick={() => openEditCurrency(c)} className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition">تعديل</button>
                                                <button onClick={() => handleDeleteCurrency(c.id)} className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition">حذف</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </GlassPanel>

                <GlassPanel title="سجل أسعار الصرف (FX Rates)">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="text-right px-6 py-4">العملة</th>
                                <th className="text-center px-6 py-4">السعر (→ EGP)</th>
                                <th className="text-center px-6 py-4">المبلغ المدفوع</th>
                                <th className="text-center px-6 py-4">التاريخ</th>
                                <th className="text-right px-6 py-4">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fxRates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">لا توجد أسعار صرف مسجلة</td>
                                </tr>
                            ) : (
                                fxRates.map((r) => (
                                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition">
                                        <td className="px-6 py-4 text-gray-300">{r.currency?.code || `#${r.currency_id}`}</td>
                                        <td className="px-6 py-4 text-center text-white font-medium">{Number(r.rate_to_egp).toFixed(4)}</td>
                                        <td className="px-6 py-4 text-center text-gray-300">{r.amount_paid ? `${Number(r.amount_paid).toLocaleString()} EGP` : '—'}</td>
                                        <td className="px-6 py-4 text-center text-gray-300">{new Date(r.rate_date).toLocaleDateString('ar-EG')}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">{r.notes || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </GlassPanel>
            </main>

            {/* Add Currency Dialog */}
            {showAddCurrency && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">عملة جديدة</h2>
                            <button onClick={() => setShowAddCurrency(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <form onSubmit={handleCreateCurrency} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>الرمز (مثال: CNY)</label>
                                    <input className={inputClass} value={formCode} onChange={e => setFormCode(e.target.value)} maxLength={3} required />
                                </div>
                                <div>
                                    <label className={labelClass}>الرمز ($, ¥, €)</label>
                                    <input className={inputClass} value={formSymbol} onChange={e => setFormSymbol(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>الاسم</label>
                                <input className={inputClass} value={formName} onChange={e => setFormName(e.target.value)} required />
                            </div>
                            <div>
                                <label className={labelClass}>سعر الصرف مقابل EGP</label>
                                <input className={inputClass} type="number" step="0.0001" value={formRate} onChange={e => setFormRate(e.target.value)} required />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => setShowAddCurrency(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition">إضافة</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Currency Dialog */}
            {showEditCurrency && selectedCurrency && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">تعديل العملة</h2>
                            <button onClick={() => setShowEditCurrency(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <form onSubmit={handleUpdateCurrency} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>الرمز</label>
                                    <input className={inputClass} value={formCode} onChange={e => setFormCode(e.target.value)} maxLength={3} required />
                                </div>
                                <div>
                                    <label className={labelClass}>الرمز ($, ¥, €)</label>
                                    <input className={inputClass} value={formSymbol} onChange={e => setFormSymbol(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>الاسم</label>
                                <input className={inputClass} value={formName} onChange={e => setFormName(e.target.value)} required />
                            </div>
                            <div>
                                <label className={labelClass}>سعر الصرف مقابل EGP</label>
                                <input className={inputClass} type="number" step="0.0001" value={formRate} onChange={e => setFormRate(e.target.value)} required />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => setShowEditCurrency(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
                                <button type="submit" className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition">تحديث</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add FX Rate Dialog */}
            {showFxRate && selectedCurrency && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">إضافة سعر صرف - {selectedCurrency.code}</h2>
                            <button onClick={() => setShowFxRate(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <form onSubmit={handleAddFxRate} className="p-6 space-y-4">
                            <div>
                                <label className={labelClass}>سعر الصرف (1 {selectedCurrency.code} = ? EGP)</label>
                                <input className={inputClass} type="number" step="0.0001" value={fxRate} onChange={e => setFxRate(e.target.value)} required />
                            </div>
                            <div>
                                <label className={labelClass}>المبلغ المدفوع (EGP) - لحساب المتوسط المرجح</label>
                                <input className={inputClass} type="number" step="0.01" value={fxAmount} onChange={e => setFxAmount(e.target.value)} />
                            </div>
                            <div>
                                <label className={labelClass}>التاريخ</label>
                                <input className={inputClass} type="date" value={fxDate} onChange={e => setFxDate(e.target.value)} required />
                            </div>
                            <div>
                                <label className={labelClass}>ملاحظات</label>
                                <input className={inputClass} value={fxNotes} onChange={e => setFxNotes(e.target.value)} />
                            </div>

                            <button
                                type="button"
                                onClick={() => calcWeightedAvg(selectedCurrency.id)}
                                className="w-full px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition text-sm"
                            >
                                حساب المتوسط المرجح
                            </button>
                            {weightedAvg !== null && (
                                <div className="bg-white/5 rounded-xl p-3 text-center">
                                    <span className="text-gray-400 text-sm">المتوسط المرجح: </span>
                                    <span className="text-white font-bold">{weightedAvg.toFixed(4)}</span>
                                </div>
                            )}

                            <div className="flex gap-3 justify-end pt-2">
                                <button type="button" onClick={() => setShowFxRate(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition">حفظ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

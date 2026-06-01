'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { ArrowLeft } from 'lucide-react';

interface Account {
    id: number;
    code: string;
    name: string;
}

interface JournalEntry {
    id: number;
    date: string;
    description: string;
    account?: Account;
    debit: string | number;
    credit: string | number;
}

export default function JournalPage() {
    const router = useRouter();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [lines, setLines] = useState<{ account_id: string; debit: string; credit: string }[]>([
        { account_id: '', debit: '0', credit: '0' },
        { account_id: '', debit: '0', credit: '0' }
    ]);

    const loadData = useCallback(async () => {
        try {
            const [entriesData, accountsData] = await Promise.all([
                api.fetchWithAuth<JournalEntry[]>('/accounting/journal'),
                api.fetchWithAuth<Account[]>('/accounting/accounts'),
            ]);
            setEntries(entriesData);
            setAccounts(sortAlphabetically(accountsData, 'name'));
        } catch (error) {
            console.error('Error loading data:', error);
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
        loadData();
    }, [router, loadData]);

    const handleAddLine = () => {
        setLines([...lines, { account_id: '', debit: '0', credit: '0' }]);
    };

    const handleRemoveLine = (index: number) => {
        if (lines.length <= 2) return;
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const handleLineChange = (index: number, field: string, value: string) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Balance
        const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
        const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alert(`القيد غير متزن! المدين (${totalDebit}) لا يساوي الدائن (${totalCredit})`);
            return;
        }

        const data = {
            date,
            description,
            reference,
            entries: lines.map(line => ({
                account_id: Number(line.account_id),
                debit: Number(line.debit),
                credit: Number(line.credit)
            }))
        };

        try {
            await api.fetchWithAuth('/accounting/journal', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setShowModal(false);
            resetForm();
            loadData();
            alert('تم تسجيل القيد بنجاح');
        } catch (error) {
            console.error('Error saving journal entry:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const resetForm = () => {
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setReference('');
        setLines([
            { account_id: '', debit: '0', credit: '0' },
            { account_id: '', debit: '0', credit: '0' }
        ]);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/accounting')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">قيود اليومية</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="mb-6">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition"
                    >
                        + قيد يومية جديد
                    </button>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-right text-white font-semibold">التاريخ</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">البيان</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">الحساب</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">مدين</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">دائن</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.id} className="border-t border-white/10 hover:bg-white/5">
                                    <td className="px-6 py-4 text-gray-300">{new Date(entry.date).toLocaleDateString('ar-EG')}</td>
                                    <td className="px-6 py-4 text-gray-300">{entry.description}</td>
                                    <td className="px-6 py-4 text-gray-200">{entry.account?.name}</td>
                                    <td className="px-6 py-4 text-green-400 font-mono">{Number(entry.debit) > 0 ? Number(entry.debit).toFixed(2) : '-'}</td>
                                    <td className="px-6 py-4 text-red-400 font-mono">{Number(entry.credit) > 0 ? Number(entry.credit).toFixed(2) : '-'}</td>
                                </tr>
                            ))}
                            {entries.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        لا توجد قيود يومية.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-3xl border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">قيد يومية جديد</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">رقم المستند (اختياري)</label>
                                    <input
                                        type="text"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">البيان</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-200 mb-2">أطراف القيد</label>
                                {lines.map((line, index) => (
                                    <div key={index} className="flex gap-4 items-center animate-in fade-in slide-in-from-top-1">
                                        <div className="flex-1">
                                            <SearchableSelect
                                                options={accounts.map(acc => ({ value: acc.id, label: `${acc.code} - ${acc.name}` }))}
                                                value={line.account_id}
                                                onChange={(val) => handleLineChange(index, 'account_id', val.toString())}
                                                placeholder="اختر الحساب..."
                                                className="w-full"
                                            />
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={line.debit}
                                            onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                                            placeholder="مدين"
                                            className="w-32 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={line.credit}
                                            onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                                            placeholder="دائن"
                                            className="w-32 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLine(index)}
                                            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg"
                                        >
                                            X
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddLine}
                                    className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                                >
                                    + إضافة طرف آخر
                                </button>
                            </div>

                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg">
                                <div className="text-gray-300">
                                    إجمالي المدين: <span className="text-green-400 font-bold">{lines.reduce((sum, l) => sum + Number(l.debit), 0).toFixed(2)}</span>
                                </div>
                                <div className="text-gray-300">
                                    إجمالي الدائن: <span className="text-red-400 font-bold">{lines.reduce((sum, l) => sum + Number(l.credit), 0).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700"
                                >
                                    حفظ القيد
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

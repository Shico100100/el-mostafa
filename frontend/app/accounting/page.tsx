'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { FileText, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { useSetBackButton } from '@/components/BackButton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
    balance: string | number;
}

interface TrialBalanceItem {
    account_name: string;
    debit: string | number;
    credit: string | number;
}

export default function AccountingPage() {
    const router = useRouter();
    useSetBackButton('/dashboard');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState('ASSET');
    const [description, setDescription] = useState('');

    const loadData = useCallback(async () => {
        try {
            const [accountsData, trialData] = await Promise.all([
                api.fetchWithAuth<Account[]>('/accounting/accounts'),
                api.fetchWithAuth<TrialBalanceItem[]>('/accounting/trial-balance'),
            ]);
            setAccounts(sortAlphabetically(accountsData, 'name'));
            setTrialBalance(trialData);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { code, name, type, description };

        try {
            await api.fetchWithAuth('/v1/accounting/accounts', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setShowModal(false);
            setCode('');
            setName('');
            setDescription('');
            loadData();
            alert('تم إضافة الحساب بنجاح');
        } catch (error) {
            console.error('Error saving account:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
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
                    <h1 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">الحسابات العامة</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/accounting/journal')}
                            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl border border-blue-500/20 transition flex items-center gap-2 font-bold"
                        >
                            <FileText className="w-4 h-4" />
                            قيود اليومية
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <GlassPanel className="p-6 h-[400px]">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-blue-400" />
                            توزيع الحسابات
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'أصول', value: accounts.filter(a => a.type === 'ASSET').length },
                                        { name: 'خصوم', value: accounts.filter(a => a.type === 'LIABILITY').length },
                                        { name: 'حقوق ملكية', value: accounts.filter(a => a.type === 'EQUITY').length },
                                        { name: 'إيرادات', value: accounts.filter(a => a.type === 'REVENUE').length },
                                        { name: 'مصروفات', value: accounts.filter(a => a.type === 'EXPENSE').length },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {[
                                        { color: '#3b82f6' }, // Blue
                                        { color: '#ef4444' }, // Red
                                        { color: '#fbbf24' }, // Amber
                                        { color: '#22c55e' }, // Green
                                        { color: '#a855f7' }, // Purple
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </GlassPanel>

                    <GlassPanel className="p-6 h-[400px]">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <BarChartIcon className="w-5 h-5 text-purple-400" />
                            أرصدة ميزان المراجعة (لأعلى 5 حسابات)
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={trialBalance
                                    .sort((a, b) => (Number(b.debit) + Number(b.credit)) - (Number(a.debit) + Number(a.credit)))
                                    .slice(0, 5)
                                    .map(item => ({
                                        name: item.account_name,
                                        debit: Number(item.debit),
                                        credit: Number(item.credit)
                                    }))
                                }
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                />
                                <Legend />
                                <Bar dataKey="debit" name="مدين" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="credit" name="دائن" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </GlassPanel>
                </div>

                <div className="mb-6 flex justify-between items-center">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition"
                    >
                        + إضافة حساب جديد
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Chart of Accounts */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                        <div className="p-4 border-b border-white/10 bg-white/5">
                            <h2 className="text-xl font-bold text-white">شجرة الحسابات</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-white font-semibold">الكود</th>
                                        <th className="px-6 py-3 text-right text-white font-semibold">اسم الحساب</th>
                                        <th className="px-6 py-3 text-right text-white font-semibold">النوع</th>
                                        <th className="px-6 py-3 text-right text-white font-semibold">الرصيد</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((acc) => (
                                        <tr key={acc.id} className="border-t border-white/10 hover:bg-white/5">
                                            <td className="px-6 py-3 text-gray-300">{acc.code}</td>
                                            <td className="px-6 py-3 text-gray-200 font-medium">{acc.name}</td>
                                            <td className="px-6 py-3 text-gray-400 text-sm">{acc.type}</td>
                                            <td className={`px-6 py-3 font-mono ${Number(acc.balance) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {Number(acc.balance).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Trial Balance Summary */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden h-fit">
                        <div className="p-4 border-b border-white/10 bg-white/5">
                            <h2 className="text-xl font-bold text-white">ميزان المراجعة (ملخص)</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map(type => {
                                    const total = accounts
                                        .filter(a => a.type === type)
                                        .reduce((sum, a) => sum + Number(a.balance), 0);

                                    return (
                                        <div key={type} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                            <span className="text-gray-300">{type}</span>
                                            <span className={`font-mono font-bold ${total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {total.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">إضافة حساب جديد</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">كود الحساب</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">اسم الحساب</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">نوع الحساب</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                >
                                    <option value="ASSET">أصول (ASSET)</option>
                                    <option value="LIABILITY">خصوم (LIABILITY)</option>
                                    <option value="EQUITY">حقوق ملكية (EQUITY)</option>
                                    <option value="REVENUE">إيرادات (REVENUE)</option>
                                    <option value="EXPENSE">مصروفات (EXPENSE)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">وصف</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
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
                                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700"
                                >
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

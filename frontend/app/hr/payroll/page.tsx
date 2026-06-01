'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface PayrollProfile {
    id: number;
    base_salary: number;
    working_hours_per_day: number;
    overtime_rate: number;
    deduction_rate: number;
    updated_at: string;
    user?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface CalculationResult {
    user: {
        id: number;
        firstName: string;
        lastName: string;
    };
    month: string;
    attendanceDays: number;
    absentDays: number;
    baseSalary: number;
    deductions: number;
    netSalary: number;
}

interface PayrollPayment {
    id: number;
    net_salary: number;
    payment_date: string;
    notes?: string;
    user?: {
        firstName: string;
        lastName: string;
    };
}

export default function PayrollPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('PROFILES');
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<PayrollProfile[]>([]);
    const [calculationResults, setCalculationResults] = useState<CalculationResult[]>([]);
    const [payments, setPayments] = useState<PayrollPayment[]>([]);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [, setEditingProfile] = useState<PayrollProfile | null>(null);

    const loadProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getPayrollProfiles();
            setProfiles(data);
        } catch (error) {
            console.error('Failed to load profiles:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadCalculation = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.calculatePayroll({ month });
            setCalculationResults(data);
        } catch (error) {
            console.error('Failed to calculate payroll:', error);
        } finally {
            setLoading(false);
        }
    }, [month]);

    const loadPayments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getPayrollPayments();
            setPayments(data);
        } catch (error) {
            console.error('Failed to load payments:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'PROFILES') loadProfiles();
        if (activeTab === 'CALCULATION') loadCalculation();
        if (activeTab === 'HISTORY') loadPayments();
    }, [activeTab, month, loadProfiles, loadCalculation, loadPayments]);

    const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const userId = Number(formData.get('user_id'));
        const data = {
            base_salary: Number(formData.get('base_salary')),
            working_hours_per_day: Number(formData.get('working_hours_per_day')),
            overtime_rate: Number(formData.get('overtime_rate')),
            deduction_rate: Number(formData.get('deduction_rate')),
        };

        try {
            await api.updatePayrollProfile(userId, data);
            setShowProfileModal(false);
            loadProfiles();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error saving profile';
            alert(message);
        }
    };

    const handleConfirmPayment = useCallback(async (result: CalculationResult) => {
        if (!confirm(`تأكيد صرف راتب (${result.user.firstName}) بقيمة ${result.netSalary}؟`)) return;

        try {
            await api.savePayrollPayment({
                user_id: result.user.id,
                month: result.month,
                base_salary: result.baseSalary,
                attendance_days: result.attendanceDays,
                absent_days: result.absentDays,
                deductions: result.deductions,
                net_salary: result.netSalary,
                status: 'PAID',
                payment_date: new Date().toISOString().split('T')[0]
            });
            alert('تم تأكيد الصرف بنجاح');
            loadCalculation();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error saving payment';
            alert(message);
        }
    }, [loadCalculation]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span>💵</span> الرواتب والموظفين
                    </h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('PROFILES')}
                        className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'PROFILES' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        إعدادات الموظفين
                    </button>
                    <button
                        onClick={() => setActiveTab('CALCULATION')}
                        className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'CALCULATION' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        حساب مسير الرواتب
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`px-6 py-2 rounded-lg transition whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        سجل المدفوعات
                    </button>
                </div>

                {/* Filters */}
                {activeTab !== 'PROFILES' && (
                    <div className="bg-white/5 p-4 rounded-xl mb-8 flex gap-4 items-end">
                        <div className="flex-1 max-w-xs">
                            <label className="block text-sm text-gray-400 mb-1">الشهر</label>
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                    </div>
                )}

                {/* Profiles Tab */}
                {activeTab === 'PROFILES' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">رواتب الموظفين الأساسية</h2>
                            <button
                                onClick={() => {
                                    setEditingProfile(null);
                                    setShowProfileModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
                            >
                                <span>+</span> تحديث راتب موظف
                            </button>
                        </div>
                        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-white/5 text-gray-300">
                                    <tr>
                                        <th className="p-4">الموظف</th>
                                        <th className="p-4">الراتب الأساسي</th>
                                        <th className="p-4">ساعات العمل</th>
                                        <th className="p-4">معدل الإضافي</th>
                                        <th className="p-4">معدل الخصم</th>
                                        <th className="p-4">تاريخ التحديث</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {profiles.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition">
                                            <td className="p-4">
                                                <div className="font-bold">{p.user?.firstName} {p.user?.lastName}</div>
                                                <div className="text-xs text-gray-500">{p.user?.email}</div>
                                            </td>
                                            <td className="p-4 font-mono text-emerald-400 font-bold">{Number(p.base_salary).toLocaleString()} ج.م</td>
                                            <td className="p-4">{p.working_hours_per_day} ساعة</td>
                                            <td className="p-4">{p.overtime_rate}x</td>
                                            <td className="p-4">{p.deduction_rate}x</td>
                                            <td className="p-4 text-xs text-gray-400">{new Date(p.updated_at).toLocaleDateString('ar-EG')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Calculation Tab */}
                {activeTab === 'CALCULATION' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">كشف رواتب شهر {month}</h2>
                        </div>
                        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-white/5 text-gray-300">
                                    <tr>
                                        <th className="p-4">الموظف</th>
                                        <th className="p-4 text-center">حضور</th>
                                        <th className="p-4 text-center">غياب</th>
                                        <th className="p-4">الأساسي</th>
                                        <th className="p-4">خصومات</th>
                                        <th className="p-4 font-bold">صافي الراتب</th>
                                        <th className="p-4">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {calculationResults.map((res, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition">
                                            <td className="p-4 font-bold">{res.user.firstName} {res.user.lastName}</td>
                                            <td className="p-4 text-center text-emerald-400">{res.attendanceDays}</td>
                                            <td className="p-4 text-center text-rose-400">{res.absentDays}</td>
                                            <td className="p-4 font-mono text-sm">{Number(res.baseSalary).toLocaleString()}</td>
                                            <td className="p-4 font-mono text-rose-400">-{Number(res.deductions).toLocaleString()}</td>
                                            <td className="p-4 font-mono text-lg font-bold text-white">{Number(res.netSalary).toLocaleString()} ج.م</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleConfirmPayment(res)}
                                                    className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-600 hover:text-white transition text-sm font-bold"
                                                >
                                                    تأكيد الصرف
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'HISTORY' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">الرواتب المصروفة لشهر {month}</h2>
                        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-white/5 text-gray-300">
                                    <tr>
                                        <th className="p-4">الموظف</th>
                                        <th className="p-4">المبلغ</th>
                                        <th className="p-4">تاريخ الصرف</th>
                                        <th className="p-4">الحالة</th>
                                        <th className="p-4">ملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payments.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-500">لا يوجد مدفوعات مسجلة لهذا الشهر بعد</td></tr>
                                    ) : payments.map(p => (
                                        <tr key={p.id} className="hover:bg-white/5 transition">
                                            <td className="p-4 font-bold">{p.user?.firstName} {p.user?.lastName}</td>
                                            <td className="p-4 font-mono text-emerald-400 font-bold">{Number(p.net_salary).toLocaleString()} ج.م</td>
                                            <td className="p-4 text-sm">{p.payment_date}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">تم الدفع</span>
                                            </td>
                                            <td className="p-4 text-gray-400 text-sm">{p.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowProfileModal(false)}></div>
                    <form onSubmit={handleProfileSave} className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md relative z-10 p-6 space-y-4 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">إعدادات راتب موظف</h2>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">الموظف</label>
                            <select name="user_id" required className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none">
                                <option value="">اختر الموظف...</option>
                                {calculationResults.map(r => (
                                    <option key={r.user.id} value={r.user.id}>{r.user.firstName} {r.user.lastName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">الراتب الأساسي (ج.م)</label>
                            <input type="number" step="0.01" name="base_salary" required className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">ساعات العمل/يوم</label>
                                <input type="number" name="working_hours_per_day" defaultValue="8" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">معدل الإضافي (x)</label>
                                <input type="number" step="0.1" name="overtime_rate" defaultValue="1.5" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">معدل الخصم للغياب (x)</label>
                            <input type="number" step="0.1" name="deduction_rate" defaultValue="1.0" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-bold transition">حفظ</button>
                            <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg transition">إلغاء</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

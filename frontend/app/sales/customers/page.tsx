'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    balance: number | string;
}

interface StatementItem {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [showStatementModal, setShowStatementModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [statement, setStatement] = useState<StatementItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [statementLoading, setStatementLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadCustomers();
    }, [router]);

    const loadCustomers = async () => {
        try {
            const data = await api.fetchWithAuth('/sales/customers');
            setCustomers(data);
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStatement = async (id: number) => {
        setStatementLoading(true);
        try {
            const data = await api.getCustomerStatement(id);
            setStatement(data);
        } catch (error) {
            console.error('Error loading statement:', error);
        } finally {
            setStatementLoading(false);
        }
    };

    const openStatement = (customer: Customer) => {
        setSelectedCustomer(customer);
        setStatement([]);
        setShowStatementModal(true);
        loadStatement(customer.id);
    };

    const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        const formData = new FormData(e.currentTarget);
        const data = {
            amount: Number(formData.get('amount')),
            payment_date: formData.get('payment_date'),
            notes: formData.get('notes'),
        };

        try {
            await api.addCustomerPayment(selectedCustomer.id, data);
            setShowPaymentModal(false);
            loadCustomers();
        } catch (error) {
            console.error('Error recording payment:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
        };

        try {
            if (editingCustomer) {
                await api.fetchWithAuth(`/sales/customers/${editingCustomer.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } else {
                await api.fetchWithAuth('/sales/customers', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            }
            setShowModal(false);
            setEditingCustomer(null);
            loadCustomers();
        } catch (error) {
            console.error('Error saving customer:', error);
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
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">إدارة العملاء</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-blue-600/20 border border-blue-500/30 p-6 rounded-2xl backdrop-blur-sm">
                        <h3 className="text-blue-200 text-sm font-medium mb-2">إجمالي العملاء</h3>
                        <p className="text-3xl font-bold text-white">{customers.length}</p>
                    </div>
                    <div className="bg-green-600/20 border border-green-500/30 p-6 rounded-2xl backdrop-blur-sm">
                        <h3 className="text-green-200 text-sm font-medium mb-2">عملاء عليهم مديونيات</h3>
                        <p className="text-3xl font-bold text-white">
                            {customers.filter(c => Number(c.balance) > 0).length}
                        </p>
                    </div>
                    <div className="bg-amber-600/20 border border-amber-500/30 p-6 rounded-2xl backdrop-blur-sm">
                        <h3 className="text-amber-200 text-sm font-medium mb-2">إجمالي الديون المستحقة</h3>
                        <p className="text-3xl font-bold text-white">
                            {customers.reduce((sum, c) => sum + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0).toLocaleString()}
                        </p>
                        <span className="text-xs text-amber-300">جنيه مصري</span>
                    </div>
                    <div className="bg-purple-600/20 border border-purple-500/30 p-6 rounded-2xl backdrop-blur-sm">
                        <h3 className="text-purple-200 text-sm font-medium mb-2">متوسط المديونية</h3>
                        <p className="text-3xl font-bold text-white">
                            {customers.length > 0
                                ? (customers.reduce((sum, c) => sum + Number(c.balance), 0) / customers.length).toLocaleString(undefined, { maximumFractionDigits: 0 })
                                : 0}
                        </p>
                        <span className="text-xs text-purple-300">جنيه / عميل</span>
                    </div>
                </div>

                <div className="mb-6">
                    <button
                        onClick={() => {
                            setEditingCustomer(null);
                            setShowModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition"
                    >
                        + إضافة عميل جديد
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map((customer) => (
                        <div key={customer.id} className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                            <h3 className="text-xl font-bold text-white mb-2">{customer.name}</h3>
                            <p className="text-gray-300 mb-1">📞 {customer.phone || '-'}</p>
                            <p className="text-gray-300 mb-1">📧 {customer.email || '-'}</p>
                            <p className="text-gray-300 mb-3">📍 {customer.address || '-'}</p>
                            <p className="text-green-400 font-semibold mb-4">الرصيد: {customer.balance} جنيه</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingCustomer(customer);
                                        setShowModal(true);
                                    }}
                                    className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded"
                                >
                                    تعديل
                                </button>
                                <button
                                    onClick={() => openStatement(customer)}
                                    className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded"
                                >
                                    كشف حساب
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCustomer(customer);
                                        setShowPaymentModal(true);
                                    }}
                                    className="flex-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded"
                                >
                                    تحصيل
                                </button>
                            </div>
                        </div>
                    ))}
                    {customers.length === 0 && (
                        <div className="col-span-full text-center text-gray-400 py-12">
                            لا يوجد عملاء. قم بإضافة عميل جديد.
                        </div>
                    )}
                </div>
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingCustomer ? 'تعديل عميل' : 'إضافة عميل جديد'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الاسم</label>
                                <input
                                    name="name"
                                    type="text"
                                    defaultValue={editingCustomer?.name}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الهاتف</label>
                                <input
                                    name="phone"
                                    type="text"
                                    defaultValue={editingCustomer?.phone}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">البريد الإلكتروني</label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={editingCustomer?.email}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">العنوان</label>
                                <textarea
                                    name="address"
                                    defaultValue={editingCustomer?.address}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingCustomer(null);
                                    }}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700"
                                >
                                    {editingCustomer ? 'تحديث' : 'إضافة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPaymentModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">تحصيل مبلغ من: {selectedCustomer?.name}</h2>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">المبلغ (جنيه)</label>
                                <input
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
                                <input
                                    name="payment_date"
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">ملاحظات (طريقة الدفع/رقم الشيك)</label>
                                <textarea
                                    name="notes"
                                    rows={2}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700"
                                >
                                    تسجيل المبلغ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showStatementModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60]" onClick={() => setShowStatementModal(false)}>
                    <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white">كشف حساب: {selectedCustomer?.name}</h2>
                                <p className="text-sm text-gray-400">سجل المعاملات المالية التاريخي</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => selectedCustomer && window.open(`/sales/customers/statement/${selectedCustomer.id}`, '_blank')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-bold transition shadow-lg shadow-blue-600/20"
                                >
                                    <span>🖨️</span> طباعة
                                </button>
                                <button
                                    onClick={() => setShowStatementModal(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 transition"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            {statementLoading ? (
                                <div className="text-center py-12 text-gray-500 animate-pulse">جاري تحميل البيانات...</div>
                            ) : (
                                <table className="w-full text-right border-collapse">
                                    <thead className="bg-white/5 sticky top-0">
                                        <tr>
                                            <th className="p-3 border-b border-white/10 text-gray-300">التاريخ</th>
                                            <th className="p-3 border-b border-white/10 text-gray-300">البيان</th>
                                            <th className="p-3 border-b border-white/10 text-gray-300">مبيعات (+)</th>
                                            <th className="p-3 border-b border-white/10 text-gray-300">تحصيل (-)</th>
                                            <th className="p-3 border-b border-white/10 text-gray-300">الرصيد الجاري</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {statement.length === 0 ? (
                                            <tr><td colSpan={5} className="p-12 text-center text-gray-500">لا توجد معاملات مسجلة</td></tr>
                                        ) : statement.map((m, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition">
                                                <td className="p-3 text-sm text-gray-400">{new Date(m.date).toLocaleDateString('ar-EG')}</td>
                                                <td className="p-3 text-sm text-white font-medium">{m.description}</td>
                                                <td className="p-3 text-sm text-emerald-400 font-bold">{m.debit > 0 ? Number(m.debit).toLocaleString() : ''}</td>
                                                <td className="p-3 text-sm text-rose-400 font-bold">{m.credit > 0 ? Number(m.credit).toLocaleString() : ''}</td>
                                                <td className={`p-3 text-sm font-bold ${m.balance > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                                                    {Number(m.balance).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center text-white">
                            <span className="font-bold">إجمالي المديونية المستحقة:</span>
                            <span className="text-2xl font-black text-amber-500">
                                {Number(selectedCustomer?.balance || 0).toLocaleString()} جنيه
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

interface Customer {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    balance: number | string;
}

interface Transaction {
    id: number;
    type: 'INVOICE' | 'OPENING_BALANCE' | 'PAYMENT' | 'RETURN';
    amount: number | string;
    date: string;
    description?: string;
}

interface StatementEntry {
    id: number;
    ref: number;
    date: string;
    description: string;
    debit: number;
    credit: number;
    type: 'ORDER' | 'RETURN' | 'PAYMENT';
    balance: number;
}

export default function CustomerStatementPage() {
    const { id } = useParams();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const customers = await api.fetchWithAuth('/sales/customers');
            const cust = customers.find((c: Customer) => c.id === Number(id));
            setCustomer(cust);

            if (cust) {
                const trans = await api.fetchWithAuth<StatementEntry[]>(`/sales/customers/${id}/statement`);
                setTransactions((trans || []).map((t) => ({
                  id: t.ref || t.id,
                  type: t.type === 'ORDER' ? 'INVOICE' : t.type,
                  amount: Number(t.debit || t.credit),
                  date: t.date,
                  description: t.description || '',
                })));
            }
        } catch (error) {
            console.error('Error loading data', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) return <div>جاري التحميل...</div>;
    if (!customer) return <div>العميل غير موجود</div>;

    const totalDebit = transactions
        .filter(t => t.type === 'INVOICE' || t.type === 'OPENING_BALANCE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCredit = transactions
        .filter(t => t.type === 'PAYMENT' || t.type === 'RETURN')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalDebit - totalCredit;

    return (
        <div className="min-h-screen bg-white text-black p-8 font-serif" dir="rtl">
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">كشف حساب عميل</h1>
                    <p className="text-sm">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="text-left">
                    <h2 className="text-xl font-bold">المصنع الحديث للبلاستيك</h2>
                    <p>العنوان: المنطقة الصناعية</p>
                    <p>هاتف: 01000000000</p>
                </div>
            </div>

            <div className="bg-[#6b8378] p-4 rounded mb-6 border border-gray-300">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="font-bold">اسم العميل:</span> {customer.name}
                    </div>
                    <div>
                        <span className="font-bold">رقم الهاتف:</span> {customer.phone}
                    </div>
                    <div>
                        <span className="font-bold">العنوان:</span> {customer.address}
                    </div>
                </div>
            </div>

            <table className="w-full border-collapse border border-black mb-6 text-sm">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-black p-2">التاريخ</th>
                        <th className="border border-black p-2">العملية</th>
                        <th className="border border-black p-2">الوصف</th>
                        <th className="border border-black p-2">مدين (لنا)</th>
                        <th className="border border-black p-2">دائن (علينا)</th>
                        <th className="border border-black p-2">الرصيد</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t, index) => {
                        const debit = (t.type === 'INVOICE' || t.type === 'OPENING_BALANCE') ? Number(t.amount) : 0;
                        const credit = (t.type === 'PAYMENT' || t.type === 'RETURN') ? Number(t.amount) : 0;

                        return (
                            <tr key={index}>
                                <td className="border border-black p-2">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                <td className="border border-black p-2">
                                    {t.type === 'INVOICE' ? 'فاتورة بيع' :
                                        t.type === 'PAYMENT' ? 'دفعة نقدية' :
                                            t.type === 'RETURN' ? 'مرتجع' : 'رصيد افتتاحي'}
                                </td>
                                <td className="border border-black p-2">{t.description || '-'}</td>
                                <td className="border border-black p-2">{debit > 0 ? debit.toLocaleString() : '-'}</td>
                                <td className="border border-black p-2">{credit > 0 ? credit.toLocaleString() : '-'}</td>
                                <td className="border border-black p-2 bg-[#ecfdf5]"></td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-300 font-bold">
                        <td className="border border-black p-2" colSpan={3}>الإجمالي</td>
                        <td className="border border-black p-2">{totalDebit.toLocaleString()}</td>
                        <td className="border border-black p-2">{totalCredit.toLocaleString()}</td>
                        <td className="border border-black p-2">{balance.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="flex justify-between mt-12 pt-8 border-t border-black">
                <div>
                    <p>توقيع المحاسب</p>
                    <p className="mt-8">....................</p>
                </div>
                <div>
                    <p>توقيع العميل</p>
                    <p className="mt-8">....................</p>
                </div>
            </div>

            <div className="fixed bottom-8 left-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 font-bold flex items-center gap-2"
                >
                    <Printer className="w-5 h-5" /> طباعة
                </button>
            </div>
        </div>
    );
}

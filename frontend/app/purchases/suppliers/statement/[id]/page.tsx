'use client';

import { Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

interface Supplier {
    id: number;
    name: string;
    phone?: string;
    balance: number | string;
}

interface Transaction {
    id: number;
    type: 'INVOICE' | 'OPENING_BALANCE' | 'PAYMENT' | 'RETURN';
    amount: number | string;
    date: string;
    description?: string;
}

export default function SupplierStatementPage() {
    const { id } = useParams();
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const suppliers = await api.fetchWithAuth('/purchases/suppliers');
            const supp = suppliers.find((s: Supplier) => s.id === Number(id));
            setSupplier(supp);

            if (supp) {
                const trans = await api.fetchWithAuth(`/purchases/suppliers/${id}/statement`);
                setTransactions((trans || []).map((t: any) => ({
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
    if (!supplier) return <div>المورد غير موجود</div>;

    // For suppliers: Invoice = Credit (we owe), Payment = Debit (we paid)
    // Actually, usually:
    // Invoice -> Increases Balance (Credit)
    // Payment -> Decreases Balance (Debit)

    const totalPurchases = transactions
        .filter(t => t.type === 'INVOICE' || t.type === 'OPENING_BALANCE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPayments = transactions
        .filter(t => t.type === 'PAYMENT' || t.type === 'RETURN')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = totalPurchases - totalPayments;

    return (
        <div className="min-h-screen bg-white text-black p-8 font-serif" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">كشف حساب مورد</h1>
                    <p className="text-sm">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="text-left">
                    <h2 className="text-xl font-bold">المصنع الحديث للبلاستيك</h2>
                    <p>العنوان: المنطقة الصناعية</p>
                </div>
            </div>

            {/* Supplier Info */}
            <div className="bg-gray-100 p-4 rounded mb-6 border border-gray-300">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="font-bold">اسم المورد:</span> {supplier.name}
                    </div>
                    <div>
                        <span className="font-bold">رقم الهاتف:</span> {supplier.phone}
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <table className="w-full border-collapse border border-black mb-6 text-sm">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-black p-2">التاريخ</th>
                        <th className="border border-black p-2">العملية</th>
                        <th className="border border-black p-2">الوصف</th>
                        <th className="border border-black p-2">مشتريات (علينا)</th>
                        <th className="border border-black p-2">سداد (منا)</th>
                        <th className="border border-black p-2">الرصيد</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((t, index) => {
                        const credit = (t.type === 'INVOICE' || t.type === 'OPENING_BALANCE') ? Number(t.amount) : 0;
                        const debit = (t.type === 'PAYMENT' || t.type === 'RETURN') ? Number(t.amount) : 0;

                        return (
                            <tr key={index}>
                                <td className="border border-black p-2">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                <td className="border border-black p-2">
                                    {t.type === 'INVOICE' ? 'فاتورة شراء' :
                                        t.type === 'PAYMENT' ? 'سداد نقدية' :
                                            t.type === 'RETURN' ? 'مرتجع' : 'رصيد افتتاحي'}
                                </td>
                                <td className="border border-black p-2">{t.description || '-'}</td>
                                <td className="border border-black p-2">{credit > 0 ? credit.toLocaleString() : '-'}</td>
                                <td className="border border-black p-2">{debit > 0 ? debit.toLocaleString() : '-'}</td>
                                <td className="border border-black p-2 bg-gray-50"></td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-300 font-bold">
                        <td className="border border-black p-2" colSpan={3}>الإجمالي</td>
                        <td className="border border-black p-2">{totalPurchases.toLocaleString()}</td>
                        <td className="border border-black p-2">{totalPayments.toLocaleString()}</td>
                        <td className="border border-black p-2">{balance.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Print Button */}
            <div className="fixed bottom-8 left-8 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-purple-700 font-bold flex items-center gap-2"
                >
                    <Printer className="w-5 h-5" /> طباعة
                </button>
            </div>
        </div>
    );
}

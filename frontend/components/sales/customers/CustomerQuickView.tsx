'use client';

import { X, FileText, Wallet, Loader2 } from 'lucide-react';
import { Customer, StatementItem } from './types';

interface CustomerQuickViewProps {
  customer: Customer;
  statement: StatementItem[];
  loading: boolean;
  onClose: () => void;
  onStatement: (customer: Customer) => void;
  onPayment: (customer: Customer) => void;
}

export function CustomerQuickView({
  customer,
  statement,
  loading,
  onClose,
  onStatement,
  onPayment,
}: CustomerQuickViewProps) {
  const recentTransactions = statement.slice(0, 5);

  const totalSales = statement.reduce((sum, item) => sum + item.debit, 0);
  const totalPayments = statement.reduce((sum, item) => sum + item.credit, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[350px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 transform transition-transform duration-300 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">كشف حساب: {customer.name}</h3>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Summary */}
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white/60 text-sm mb-4">ملخص سريع</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">إجمالي المبيعات</span>
                <span className="text-white font-medium">{totalSales.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">إجمالي السندات</span>
                <span className="text-emerald-400 font-medium">{totalPayments.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-white/60">الرصيد المتبقي</span>
                  <span className={`font-bold ${customer.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {customer.balance.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white/5 rounded-xl p-4">
            <h4 className="text-white/60 text-sm mb-4">آخر 5 معاملات</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <div className="text-white text-sm">{item.description}</div>
                      <div className="text-white/40 text-xs">{new Date(item.date).toLocaleDateString('ar-EG')}</div>
                    </div>
                    <div className="text-left">
                      {item.debit > 0 && (
                        <span className="text-red-400 text-sm">+{item.debit.toLocaleString('ar-EG')}</span>
                      )}
                      {item.credit > 0 && (
                        <span className="text-emerald-400 text-sm">-{item.credit.toLocaleString('ar-EG')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-center py-8">لا توجد معاملات</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onStatement(customer);
                onClose();
              }}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              كشف حساب كامل
            </button>
            <button
              onClick={() => {
                onPayment(customer);
                onClose();
              }}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              سند قبض
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

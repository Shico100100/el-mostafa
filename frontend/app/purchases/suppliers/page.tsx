'use client';

import { useEffect } from 'react';
import { useSuppliers } from '@/hooks/purchases/useSuppliers';
import { SuppliersHeader } from '@/components/purchases/suppliers/SuppliersHeader';
import { SupplierStatsCards } from '@/components/purchases/suppliers/SupplierStatsCards';
import { SupplierCard } from '@/components/purchases/suppliers/SupplierCard';
import { AddEditSupplierDialog } from '@/components/purchases/suppliers/AddEditSupplierDialog';
import { PaymentDialog } from '@/components/purchases/suppliers/PaymentDialog';
import { StatementModal } from '@/components/purchases/suppliers/StatementModal';

export default function SuppliersPage() {
  const { loadSuppliers, ...h } = useSuppliers();

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <SuppliersHeader />
      <main className="container mx-auto px-6 py-8">
        <SupplierStatsCards suppliers={h.suppliers} />
        <div className="mb-6">
          <button onClick={() => { h.setEditingSupplier(null); h.setShowModal(true); }}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-pink-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-pink-700 transition">
            + إضافة مورد جديد
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {h.suppliers.map(supplier => (
            <SupplierCard key={supplier.id} supplier={supplier}
              onEdit={(s) => { h.setEditingSupplier(s); h.setShowModal(true); }}
              onStatement={h.openStatement}
              onPayment={(s) => { h.setSelectedSupplier(s); h.setShowPaymentModal(true); }} />
          ))}
          {h.suppliers.length === 0 && (
            <div className="col-span-full text-center text-[#6b8378] py-12">لا يوجد موردين. قم بإضافة مورد جديد.</div>
          )}
        </div>
      </main>
      <AddEditSupplierDialog visible={h.showModal} editingSupplier={h.editingSupplier}
        onSave={h.handleSave} onClose={() => { h.setShowModal(false); h.setEditingSupplier(null); }} />
      <PaymentDialog visible={h.showPaymentModal} supplier={h.selectedSupplier}
        onSave={h.handlePayment} onClose={() => h.setShowPaymentModal(false)} />
      <StatementModal visible={h.showStatementModal} supplier={h.selectedSupplier}
        statement={h.statement} loading={h.statementLoading} onClose={() => h.setShowStatementModal(false)} />
    </div>
  );
}

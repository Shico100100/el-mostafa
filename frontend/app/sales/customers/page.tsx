'use client';

import { useEffect } from 'react';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { CustomersHeader } from '@/components/sales/customers/CustomersHeader';
import { CustomerStatsCards } from '@/components/sales/customers/CustomerStatsCards';
import { CustomerCard } from '@/components/sales/customers/CustomerCard';
import { AddEditCustomerDialog } from '@/components/sales/customers/AddEditCustomerDialog';
import { CollectionDialog } from '@/components/sales/customers/CollectionDialog';
import { StatementModal } from '@/components/sales/customers/StatementModal';

export default function CustomersPage() {
  const { loadCustomers, ...h } = useCustomers();

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <CustomersHeader />
      <main className="container mx-auto px-6 py-8">
        <CustomerStatsCards customers={h.customers} />
        <div className="mb-6">
          <button onClick={() => { h.setEditingCustomer(null); h.setShowModal(true); }}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition">
            + إضافة عميل جديد
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {h.customers.map(customer => (
            <CustomerCard key={customer.id} customer={customer}
              onEdit={(c) => { h.setEditingCustomer(c); h.setShowModal(true); }}
              onStatement={h.openStatement}
              onPayment={(c) => { h.setSelectedCustomer(c); h.setShowPaymentModal(true); }} />
          ))}
          {h.customers.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-12">لا يوجد عملاء. قم بإضافة عميل جديد.</div>
          )}
        </div>
      </main>
      <AddEditCustomerDialog visible={h.showModal} editingCustomer={h.editingCustomer}
        onSave={h.handleSave} onClose={() => { h.setShowModal(false); h.setEditingCustomer(null); }} />
      <CollectionDialog visible={h.showPaymentModal} customer={h.selectedCustomer}
        onSave={h.handlePayment} onClose={() => h.setShowPaymentModal(false)} />
      <StatementModal visible={h.showStatementModal} customer={h.selectedCustomer}
        statement={h.statement} loading={h.statementLoading} onClose={() => h.setShowStatementModal(false)} />
    </div>
  );
}

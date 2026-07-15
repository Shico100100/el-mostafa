'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/sales/useCustomers';
import { useAuth } from '@/hooks/useAuth';
import { CustomersHeader } from '@/components/sales/customers/CustomersHeader';
import { CustomerFilters } from '@/components/sales/customers/CustomerFilters';
import { CustomerCard } from '@/components/sales/customers/CustomerCard';
import { CustomerQuickView } from '@/components/sales/customers/CustomerQuickView';
import { CustomerCharts } from '@/components/sales/customers/CustomerCharts';
import { AddEditCustomerDialog } from '@/components/sales/customers/AddEditCustomerDialog';
import { CollectionDialog } from '@/components/sales/customers/CollectionDialog';
import { StatementModal } from '@/components/sales/customers/StatementModal';
import { Loader2 } from 'lucide-react';
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function CustomersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const {
    customers,
    filteredCustomers,
    loading,
    showModal,
    setShowModal,
    editingCustomer,
    setEditingCustomer,
    showStatementModal,
    setShowStatementModal,
    showPaymentModal,
    setShowPaymentModal,
    statement,
    selectedCustomer,
    setSelectedCustomer,
    statementLoading,
    statementMonth,
    statementYear,
    showQuickView,
    quickViewCustomer,
    filters,
    stats,
    loadStatement,
    handleSave,
    handlePayment,
    handleStatementFilter,
    clearStatementFilter,
    handleSearch,
    handleFilterStatus,
    handleSort,
    openQuickView,
    closeQuickView,
  } = useCustomers();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('العملاء');

    // Add headers
    worksheet.columns = [
      { header: 'الاسم', key: 'name', width: 30 },
      { header: 'الهاتف', key: 'phone', width: 20 },
      { header: 'الإيميل', key: 'email', width: 30 },
      { header: 'العنوان', key: 'address', width: 30 },
      { header: 'الرصيد', key: 'balance', width: 15 },
      { header: 'الحالة', key: 'status', width: 15 },
    ];

    // Add data
    filteredCustomers.forEach((customer) => {
      const status = customer.balance <= 0 ? 'أمين' : customer.balance <= 10000 ? 'مدين' : 'مدين متأخر';
      worksheet.addRow({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        balance: customer.balance,
        status: status,
      });
    });

    // Generate file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'العملاء.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Add Arabic font support (simplified)
    doc.setFont('helvetica');

    // Title
    doc.setFontSize(20);
    doc.text('قائمة العملاء', 148, 20, { align: 'center' });

    // Table data
    const tableData = filteredCustomers.map((customer) => {
      const status = customer.balance <= 0 ? 'أمين' : customer.balance <= 10000 ? 'مدين' : 'مدين متأخر';
      return [
        customer.name,
        customer.phone || '-',
        customer.email || '-',
        customer.balance.toLocaleString('ar-EG'),
        status,
      ];
    });

    // Add table
    autoTable(doc, {
      head: [['الاسم', 'الهاتف', 'الإيميل', 'الرصيد', 'الحالة']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 109] },
    });

    // Save file
    doc.save('العملاء.pdf');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <CustomersHeader
          stats={stats}
          onNewCustomer={() => setShowModal(true)}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
        />

        {/* Filters */}
        <CustomerFilters
          filters={filters}
          onSearch={handleSearch}
          onFilterStatus={handleFilterStatus}
          onSort={handleSort}
        />

        {/* Charts */}
        <CustomerCharts stats={stats} customers={customers} />

        {/* Customer Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg">لا يوجد عملاء</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={(c) => {
                  setEditingCustomer(c);
                  setShowModal(true);
                }}
                onStatement={(c) => {
                  setSelectedCustomer(c);
                  loadStatement(c.id);
                  setShowStatementModal(true);
                }}
                onPayment={(c) => {
                  setSelectedCustomer(c);
                  setShowPaymentModal(true);
                }}
                onQuickView={openQuickView}
              />
            ))}
          </div>
        )}

        {/* Quick View Panel */}
        {showQuickView && quickViewCustomer && (
          <CustomerQuickView
            customer={quickViewCustomer}
            statement={statement}
            loading={statementLoading}
            onClose={closeQuickView}
            onStatement={(c) => {
              setSelectedCustomer(c);
              loadStatement(c.id);
              setShowStatementModal(true);
            }}
            onPayment={(c) => {
              setSelectedCustomer(c);
              setShowPaymentModal(true);
            }}
          />
        )}

        {/* Modals */}
        <AddEditCustomerDialog
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingCustomer(null);
          }}
          onSave={handleSave}
          customer={editingCustomer}
        />

        <CollectionDialog
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCustomer(null);
          }}
          onSave={handlePayment}
          customer={selectedCustomer}
        />

        <StatementModal
          isOpen={showStatementModal}
          onClose={() => {
            setShowStatementModal(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          statement={statement}
          loading={statementLoading}
          month={statementMonth}
          year={statementYear}
          onFilter={handleStatementFilter}
          onClearFilter={clearStatementFilter}
        />
      </div>
    </div>
  );
}

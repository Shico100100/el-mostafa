'use client';

import { Plus, FileSpreadsheet, FileText, Users, AlertTriangle, DollarSign, CheckCircle } from 'lucide-react';
import { CustomerStats } from './types';

interface CustomersHeaderProps {
  stats: CustomerStats;
  onNewCustomer: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export function CustomersHeader({
  stats,
  onNewCustomer,
  onExportExcel,
  onExportPDF,
}: CustomersHeaderProps) {
  return (
    <div className="mb-6">
      {/* Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">العملاء</h1>
          <p className="text-white/60">إدارة بيانات العملاء والديون</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExportExcel}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            تصدير Excel
          </button>
          <button
            onClick={onExportPDF}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            تصدير PDF
          </button>
          <button
            onClick={onNewCustomer}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            عميل جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">إجمالي العملاء</p>
              <p className="text-white text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-3 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">المدينون</p>
              <p className="text-white text-2xl font-bold">{stats.debtorsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">إجمالي الديون</p>
              <p className="text-white text-2xl font-bold">{stats.totalDebt.toLocaleString('ar-EG')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">أمينون</p>
              <p className="text-white text-2xl font-bold">{stats.cleanCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

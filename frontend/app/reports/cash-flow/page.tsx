'use client';

import { useFinancialReports } from '@/hooks/reports/useFinancialReports';
import { ArrowDownLeft, ArrowUpRight, Wallet, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-reports';
import { useState } from 'react';

interface CashFlowLine {
  account_code: string | null;
  account_name: string;
  type: string;
  debit: number;
  credit: number;
  net: number;
}

interface CashFlowSection {
  items: CashFlowLine[];
  total: number;
}

interface CashFlowReport {
  period?: { start?: string; end?: string };
  operating_activities?: CashFlowSection;
  investing_activities?: CashFlowSection;
  financing_activities?: CashFlowSection;
  net_cash_flow: number;
}

export default function CashFlowPage() {
  const h = useFinancialReports();
  const [showOperating, setShowOperating] = useState(false);
  const [showInvesting, setShowInvesting] = useState(false);
  const [showFinancing, setShowFinancing] = useState(false);

  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const cf = h.cashFlow as CashFlowReport | null;
  const opTotal = Number(cf?.operating_activities?.total ?? cf?.operating_activities ?? 0);
  const invTotal = Number(cf?.investing_activities?.total ?? cf?.investing_activities ?? 0);
  const finTotal = Number(cf?.financing_activities?.total ?? cf?.financing_activities ?? 0);
  const opItems = cf?.operating_activities?.items || [];
  const invItems = cf?.investing_activities?.items || [];
  const finItems = cf?.financing_activities?.items || [];

  const renderItems = (items: CashFlowLine[]) => items.length === 0 ? (
    <p className="text-[#6b8378] text-sm text-center py-2">لا توجد بنود</p>
  ) : (
    <div className="mt-3 space-y-1">
      {items.map((item: CashFlowLine, i: number) => (
        <div key={i} className="flex justify-between text-sm py-1 border-b border-[#1f2d26]">
          <span className="text-[#ecfdf5]">{item.account_code} - {item.account_name}</span>
          <span className={`font-semibold ${item.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {item.net >= 0 ? '+' : ''}{Number(item.net).toLocaleString()} ج.م
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Wallet className="w-8 h-8 text-cyan-400" />قائمة التدفقات النقدية</h1>
          {cf && <button onClick={() => exportElementToPdf('cash-flow-content', 'cash-flow')} className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 px-4 py-2 rounded-lg border border-cyan-500/30 transition flex items-center gap-2"><FileDown className="w-4 h-4" />تصدير PDF</button>}
        </div>

        {!cf ? (
          <p className="text-[#6b8378] text-center py-12">لا توجد بيانات متاحة</p>
        ) : (
          <div id="cash-flow-content" className="p-6 bg-[#0a0f0d] rounded-xl space-y-6">
            <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-4 text-center">
              <span className="text-[#6b8378]">الفترة:</span>
              <span className="text-white font-bold mr-2">{cf.period?.start}</span>
              <span className="text-[#6b8378] mr-2">إلى</span>
              <span className="text-white font-bold">{cf.period?.end}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button onClick={() => setShowOperating(!showOperating)} className={`bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6 text-right transition hover:border-cyan-500/30`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {opTotal >= 0 ? <ArrowDownLeft className="w-6 h-6 text-green-400" /> : <ArrowUpRight className="w-6 h-6 text-red-400" />}
                    <h2 className="text-lg font-bold text-white">الأنشطة التشغيلية</h2>
                  </div>
                  {showOperating ? <ChevronUp className="w-4 h-4 text-[#6b8378]" /> : <ChevronDown className="w-4 h-4 text-[#6b8378]" />}
                </div>
                <p className={`text-3xl font-bold mt-2 ${opTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {opTotal.toLocaleString()} ج.م
                </p>
                <p className="text-[#6b8378] text-sm mt-1">الإيرادات والمصروفات التشغيلية</p>
                {showOperating && renderItems(opItems)}
              </button>

              <button onClick={() => setShowInvesting(!showInvesting)} className={`bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6 text-right transition hover:border-cyan-500/30`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-lg font-bold text-white">الأنشطة الاستثمارية</h2>
                  </div>
                  {showInvesting ? <ChevronUp className="w-4 h-4 text-[#6b8378]" /> : <ChevronDown className="w-4 h-4 text-[#6b8378]" />}
                </div>
                <p className="text-3xl font-bold mt-2 text-emerald-400">
                  {invTotal.toLocaleString()} ج.م
                </p>
                <p className="text-[#6b8378] text-sm mt-1">شراء/بيع الأصول الثابتة</p>
                {showInvesting && renderItems(invItems)}
              </button>

              <button onClick={() => setShowFinancing(!showFinancing)} className={`bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6 text-right transition hover:border-cyan-500/30`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-6 h-6 text-teal-400" />
                    <h2 className="text-lg font-bold text-white">الأنشطة التمويلية</h2>
                  </div>
                  {showFinancing ? <ChevronUp className="w-4 h-4 text-[#6b8378]" /> : <ChevronDown className="w-4 h-4 text-[#6b8378]" />}
                </div>
                <p className="text-3xl font-bold mt-2 text-teal-400">
                  {finTotal.toLocaleString()} ج.م
                </p>
                <p className="text-[#6b8378] text-sm mt-1">القروض والحقوق</p>
                {showFinancing && renderItems(finItems)}
              </button>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-white">صافي التدفق النقدي</span>
                <span className={`font-bold text-2xl ${cf.net_cash_flow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {Number(cf.net_cash_flow || 0).toLocaleString()} ج.م
                </span>
              </div>
              <div className="mt-2 text-center">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${cf.net_cash_flow >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {cf.net_cash_flow >= 0 ? 'تدفق نقدي إيجابي' : 'تدفق نقدي سلبي'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

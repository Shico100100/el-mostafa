'use client';

import { BarChart3, Flame, Turtle, X } from 'lucide-react';
import type { ReportItem } from '../types';

export function ReportsModal({
  show, reportType, reportData, onReportTypeChange, onClose,
}: {
  show: boolean;
  reportType: 'TOP' | 'SLOW';
  reportData: ReportItem[];
  onReportTypeChange: (type: 'TOP' | 'SLOW') => void;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-2xl border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5" /> تقارير الأكسسوارات</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
          <button
            onClick={() => onReportTypeChange('TOP')}
            className={`px-4 py-2 rounded-lg transition ${reportType === 'TOP' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Flame className="w-4 h-4 inline" /> الأكثر استهلاكاً
          </button>
          <button
            onClick={() => onReportTypeChange('SLOW')}
            className={`px-4 py-2 rounded-lg transition ${reportType === 'SLOW' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            المخزون الراكد
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-right text-sm">
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="py-2">الاسم</th>
                <th className="py-2">الوحدة</th>
                <th className="py-2">{reportType === 'TOP' ? 'الكمية المستهلكة' : 'آخر حركة خروج'}</th>
                <th className="py-2">{reportType === 'SLOW' ? 'الرصيد الحالي' : ''}</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 divide-y divide-white/5">
              {reportData.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2">{row.accessory_name || row.product?.name}</td>
                  <td className="py-2">{row.unit || row.product?.unit}</td>
                  <td className="py-2 text-blue-300 font-bold">
                    {reportType === 'TOP' ? row.total_consumed : (row.last_movement_date ? new Date(row.last_movement_date).toLocaleDateString() : '-')}
                  </td>
                  <td className="py-2">
                    {reportType === 'SLOW' ? row.current_stock : ''}
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr><td colSpan={4} className="text-center py-4 text-gray-500">جاري التحميل أو لا توجد بيانات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import type { ProductionHistoryData } from '@/components/manufacturing/feasibility/types';

interface ProductionHistoryModalProps {
  productName: string;
  data: ProductionHistoryData;
  onClose: () => void;
}

export function ProductionHistoryModal({ productName, data, onClose }: ProductionHistoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl border border-white/20 w-full max-w-4xl max-h-[85vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-800 border-b border-white/10 p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">سجل الإنتاج - {productName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
            <div className="text-gray-400 text-sm">متوسط الإنتاج اليومي (كل التاريخ)</div>
            <div className="text-3xl font-bold text-cyan-400">{data.allAverage.toLocaleString()}</div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
            <div className="text-gray-400 text-sm">متوسط الإنتاج اليومي (آخر 25 يوم)</div>
            <div className="text-3xl font-bold text-amber-400">{data.recentAverage.toLocaleString()}</div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">أعلى 10 أيام إنتاج (كل التاريخ)</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="text-right px-4 py-2">#</th>
                  <th className="text-right px-4 py-2">التاريخ</th>
                  <th className="text-center px-4 py-2">الكمية</th>
                  <th className="text-center px-4 py-2">الماكينة</th>
                  <th className="text-center px-4 py-2">ساعات العمل</th>
                </tr>
              </thead>
              <tbody>
                {data.allTop10.map((d, idx) => (
                  <tr key={d.date} className="border-b border-white/5">
                    <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-2 text-white">{d.date}</td>
                    <td className="px-4 py-2 text-center text-amber-400 font-bold">{d.pieces.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center text-blue-400">{d.machineName || '—'}</td>
                    <td className="px-4 py-2 text-center text-gray-300">{d.hours}</td>
                  </tr>
                ))}
                {data.allTop10.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">لا توجد بيانات إنتاج</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">الإنتاج اليومي (آخر 25 يوم)</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="text-right px-4 py-2">التاريخ</th>
                  <th className="text-center px-4 py-2">الكمية</th>
                  <th className="text-center px-4 py-2">الماكينة</th>
                  <th className="text-center px-4 py-2">ساعات العمل</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDays.map((d) => (
                  <tr key={d.date} className="border-b border-white/5">
                    <td className="px-4 py-2 text-white">{d.date}</td>
                    <td className="px-4 py-2 text-center text-amber-400">{d.pieces.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center text-blue-400">{d.machineName || '—'}</td>
                    <td className="px-4 py-2 text-center text-gray-300">{d.hours}</td>
                  </tr>
                ))}
                {data.recentDays.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">لا توجد بيانات إنتاج</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">الإنتاج اليومي (كل التاريخ)</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="text-right px-4 py-2">التاريخ</th>
                  <th className="text-center px-4 py-2">الكمية</th>
                  <th className="text-center px-4 py-2">الماكينة</th>
                  <th className="text-center px-4 py-2">ساعات العمل</th>
                </tr>
              </thead>
              <tbody>
                {data.allDays.map((d) => (
                  <tr key={d.date} className="border-b border-white/5">
                    <td className="px-4 py-2 text-white">{d.date}</td>
                    <td className="px-4 py-2 text-center text-amber-400">{d.pieces.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center text-blue-400">{d.machineName || '—'}</td>
                    <td className="px-4 py-2 text-center text-gray-300">{d.hours}</td>
                  </tr>
                ))}
                {data.allDays.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-400">لا توجد بيانات إنتاج</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

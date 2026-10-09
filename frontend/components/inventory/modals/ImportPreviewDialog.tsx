'use client';

import { X, AlertTriangle, Check } from 'lucide-react';
import type { ImportPreview } from '@/hooks/inventory/useProducts';

interface Props {
  preview: ImportPreview | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ImportPreviewDialog({
  preview,
  loading,
  onConfirm,
  onClose,
}: Props) {
  if (!loading && !preview) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">معاينة الاستيراد</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading || !preview ? (
            <p className="text-center text-slate-400 py-10">
              جاري قراءة الملف...
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-xl tabular-nums">
                    {preview.total}
                  </p>
                  <p className="text-slate-400 text-xs">إجمالي الصفوف</p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                  <p className="text-emerald-400 font-bold text-xl tabular-nums">
                    {preview.toCreate}
                  </p>
                  <p className="text-slate-400 text-xs">إضافة جديدة</p>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-3 text-center">
                  <p className="text-blue-400 font-bold text-xl tabular-nums">
                    {preview.toUpdate}
                  </p>
                  <p className="text-slate-400 text-xs">تحديث موجود</p>
                </div>
                <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                  <p className="text-amber-400 font-bold text-xl tabular-nums">
                    {preview.skipped}
                  </p>
                  <p className="text-slate-400 text-xs">متجاهل</p>
                </div>
              </div>

              {preview.errors.length > 0 && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-300 font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    صفوف لن تُكتب ({preview.errors.length})
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {preview.errors.slice(0, 20).map((e, i) => (
                      <p key={i} className="text-red-200/80 text-xs font-mono">
                        سطر {e.row} — {e.field}: {e.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {preview.rows.length > 0 && (
                <div className="mb-6">
                  <p className="text-slate-400 text-sm mb-2">
                    عينة (أول {preview.rows.length} صف):
                  </p>
                  <div className="max-h-48 overflow-y-auto border border-white/10 rounded-xl">
                    <table className="w-full text-xs">
                      <tbody>
                        {preview.rows.map((r) => (
                          <tr
                            key={`${r.row}-${r.name}`}
                            className="border-b border-white/5"
                          >
                            <td className="py-2 px-3 text-slate-400 font-mono">
                              {r.row}
                            </td>
                            <td className="py-2 px-3 text-white">
                              {r.name}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full ${
                                  r.action === 'create'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-blue-500/20 text-blue-300'
                                }`}
                              >
                                {r.action === 'create' ? 'إضافة' : 'تحديث'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              {r.note}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={onConfirm}
                  disabled={preview.toCreate + preview.toUpdate === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  تنفيذ الاستيراد ({preview.toCreate + preview.toUpdate})
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

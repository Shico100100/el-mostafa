'use client';
import { useBudgets } from '@/hooks/accounting/useBudgets';
import { Plus, Trash2, PieChart, BarChart3, ArrowLeft } from 'lucide-react';

export default function BudgetsPage() {
  const h = useBudgets();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  if (h.variance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => { h.setVariance(null); h.setSelectedBudget(null); }} className="p-2 hover:bg-white/5 rounded-lg transition text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3"><BarChart3 className="w-8 h-8 text-purple-400" />تقرير انحرافات: {h.variance.name}</h1>
              <p className="text-gray-400 mt-1">الفترة: {h.variance.period}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <p className="text-gray-400 text-sm">إجمالي الميزانية</p>
              <p className="text-3xl font-bold text-blue-400">{Number(h.variance.totalBudgeted).toLocaleString()} ج.م</p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <p className="text-gray-400 text-sm">إجمالي الفعلي</p>
              <p className="text-3xl font-bold text-green-400">{Number(h.variance.totalActual).toLocaleString()} ج.م</p>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-white/10">
                  <th className="py-3 px-4 text-right">الحساب</th>
                  <th className="py-3 px-4 text-right">الميزانية</th>
                  <th className="py-3 px-4 text-right">الفعلي</th>
                  <th className="py-3 px-4 text-right">الانحراف</th>
                  <th className="py-3 px-4 text-right">النسبة</th>
                </tr></thead>
                <tbody>
                  {h.variance.lines?.map((l: any, i: number) => {
                    const pct = Number(l.variancePercent);
                    const isOver = l.variance > 0;
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-3 px-4 text-white font-semibold">{l.account_code} - {l.account_name}</td>
                        <td className="py-3 px-4 text-blue-400">{Number(l.budgeted).toLocaleString()}</td>
                        <td className="py-3 px-4 text-green-400">{Number(l.actual).toLocaleString()}</td>
                        <td className={`py-3 px-4 font-bold ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                          {isOver ? '+' : ''}{Number(l.variance).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${Math.abs(pct) > 20 ? 'bg-red-500' : Math.abs(pct) > 10 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(Math.abs(pct), 100)}%` }} />
                            </div>
                            <span className={`text-xs ${isOver ? 'text-red-400' : 'text-green-400'}`}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><PieChart className="w-8 h-8 text-purple-400" />الميزانيات</h1>
            <p className="text-gray-400 mt-1">إدارة ميزانيات الحسابات ومتابعة الانحرافات</p>
          </div>
          <button onClick={() => h.setShowModal(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition flex items-center gap-2">
            <Plus className="w-5 h-5" /> إضافة ميزانية
          </button>
        </div>

        <div className="space-y-4">
          {h.budgets.length === 0 ? <p className="text-gray-500 text-center py-12">لا توجد ميزانيات</p> : h.budgets.map((b: any) => (
            <div key={b.id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">{b.name}</h3>
                  <p className="text-gray-400 text-sm">الفترة: {b.period} | الحالة: {b.status}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white text-xl font-bold">{b.lines?.reduce((s: number, l: any) => s + Number(l.budgeted_amount), 0).toLocaleString()} ج.م</span>
                  <button onClick={() => h.loadVariance(b.id)} className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg border border-purple-500/30 transition flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4" /> تقرير الانحرافات
                  </button>
                </div>
              </div>
              {b.lines?.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {b.lines.map((l: any) => (
                    <div key={l.id} className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">{l.account?.code} - {l.account?.name}</p>
                      <p className="text-white font-semibold">{Number(l.budgeted_amount).toLocaleString()} ج.م</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {h.showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => h.setShowModal(false)}>
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">إضافة ميزانية جديدة</h2>
            <form onSubmit={h.handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><label className="text-gray-400 text-sm">اسم الميزانية</label><input type="text" value={h.name} onChange={e => h.setName(e.target.value)} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">الفترة</label><input type="month" value={h.period} onChange={e => h.setPeriod(e.target.value)} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3"><span className="text-white font-semibold">بنود الميزانية</span><button type="button" onClick={h.addLine} className="text-purple-400 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> إضافة بند</button></div>
                {h.lines.map((line, i) => (
                  <div key={i} className="flex gap-3 mb-2">
                    <select value={line.account_id} onChange={e => h.updateLine(i, 'account_id', parseInt(e.target.value))} className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                      {h.accounts.map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                    </select>
                    <input type="number" placeholder="المبلغ" value={line.budgeted_amount || ''} onChange={e => h.updateLine(i, 'budgeted_amount', parseFloat(e.target.value) || 0)} className="w-40 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                    <button type="button" onClick={() => h.removeLine(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">حفظ</button>
                <button type="button" onClick={() => h.setShowModal(false)} className="flex-1 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

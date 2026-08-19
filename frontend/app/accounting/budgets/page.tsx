'use client';
import { useBudgets } from '@/hooks/accounting/useBudgets';
import { Plus, Trash2, PieChart, BarChart3, ArrowLeft } from 'lucide-react';

interface BudgetLine {
  id: number;
  account?: { code: string; name: string };
  budgeted_amount: number;
}

interface Budget {
  id: number;
  name: string;
  period: string;
  status: string;
  lines: BudgetLine[];
}

interface VarianceLine {
  account_code: string;
  account_name: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

interface AccountOption {
  id: number;
  code: string;
  name: string;
}

export default function BudgetsPage() {
  const h = useBudgets();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  if (h.variance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => { h.setVariance(null); h.setSelectedBudget(null); }} className="p-2 hover:bg-[#121a16] rounded-lg transition text-[#6b8378] hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3"><BarChart3 className="w-8 h-8 text-teal-400" />تقرير انحرافات: {h.variance.name}</h1>
              <p className="text-[#6b8378] mt-1">الفترة: {h.variance.period}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
              <p className="text-[#6b8378] text-sm">إجمالي الميزانية</p>
              <p className="text-3xl font-bold text-emerald-400">{Number(h.variance.totalBudgeted).toLocaleString()} ج.م</p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
              <p className="text-[#6b8378] text-sm">إجمالي الفعلي</p>
              <p className="text-3xl font-bold text-green-400">{Number(h.variance.totalActual).toLocaleString()} ج.م</p>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-[#6b8378] border-b border-[#1f2d26]">
                  <th className="py-3 px-4 text-right">الحساب</th>
                  <th className="py-3 px-4 text-right">الميزانية</th>
                  <th className="py-3 px-4 text-right">الفعلي</th>
                  <th className="py-3 px-4 text-right">الانحراف</th>
                  <th className="py-3 px-4 text-right">النسبة</th>
                </tr></thead>
                <tbody>
                  {h.variance.lines?.map((l: VarianceLine, i: number) => {
                    const pct = Number(l.variancePercent);
                    const isOver = l.variance > 0;
                    return (
                      <tr key={i} className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                        <td className="py-3 px-4 text-white font-semibold">{l.account_code} - {l.account_name}</td>
                        <td className="py-3 px-4 text-emerald-400">{Number(l.budgeted).toLocaleString()}</td>
                        <td className="py-3 px-4 text-green-400">{Number(l.actual).toLocaleString()}</td>
                        <td className={`py-3 px-4 font-bold ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                          {isOver ? '+' : ''}{Number(l.variance).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[#121a16] rounded-full overflow-hidden">
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><PieChart className="w-8 h-8 text-teal-400" />الميزانيات</h1>
            <p className="text-[#6b8378] mt-1">إدارة ميزانيات الحسابات ومتابعة الانحرافات</p>
          </div>
          <button onClick={() => h.setShowModal(true)} className="px-6 py-3 bg-gradient-to-r from-teal-600 to-pink-600 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-pink-700 transition flex items-center gap-2">
            <Plus className="w-5 h-5" /> إضافة ميزانية
          </button>
        </div>

        <div className="space-y-4">
          {h.budgets.length === 0 ? <p className="text-[#6b8378] text-center py-12">لا توجد ميزانيات</p> : h.budgets.map((b: Budget) => (
            <div key={b.id} className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">{b.name}</h3>
                  <p className="text-[#6b8378] text-sm">الفترة: {b.period} | الحالة: {b.status}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white text-xl font-bold">{b.lines?.reduce((s: number, l: BudgetLine) => s + Number(l.budgeted_amount), 0).toLocaleString()} ج.م</span>
                  <button onClick={() => h.loadVariance(b.id)} className="px-4 py-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 rounded-lg border border-teal-500/30 transition flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4" /> تقرير الانحرافات
                  </button>
                </div>
              </div>
              {b.lines?.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {b.lines.map((l: BudgetLine) => (
                    <div key={l.id} className="bg-[#121a16] rounded-lg p-3">
                      <p className="text-[#6b8378] text-xs">{l.account?.code} - {l.account?.name}</p>
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
          <div className="bg-[#0f1714] border border-[#1f2d26] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">إضافة ميزانية جديدة</h2>
            <form onSubmit={h.handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><label className="text-[#6b8378] text-sm">اسم الميزانية</label><input type="text" value={h.name} onChange={e => h.setName(e.target.value)} className="w-full mt-1 px-3 py-2 bg-[#121a16] border border-[#1f2d26] rounded-lg text-white" required /></div>
                <div><label className="text-[#6b8378] text-sm">الفترة</label><input type="month" value={h.period} onChange={e => h.setPeriod(e.target.value)} className="w-full mt-1 px-3 py-2 bg-[#121a16] border border-[#1f2d26] rounded-lg text-white" required /></div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3"><span className="text-white font-semibold">بنود الميزانية</span><button type="button" onClick={h.addLine} className="text-teal-400 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> إضافة بند</button></div>
                {h.lines.map((line, i) => (
                  <div key={i} className="flex gap-3 mb-2">
                    <select value={line.account_id} onChange={e => h.updateLine(i, 'account_id', parseInt(e.target.value))} className="flex-1 px-3 py-2 bg-[#121a16] border border-[#1f2d26] rounded-lg text-white">
                      {h.accounts.map((a: AccountOption) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                    </select>
                    <input type="number" placeholder="المبلغ" value={line.budgeted_amount || ''} onChange={e => h.updateLine(i, 'budgeted_amount', parseFloat(e.target.value) || 0)} className="w-40 px-3 py-2 bg-[#121a16] border border-[#1f2d26] rounded-lg text-white" />
                    <button type="button" onClick={() => h.removeLine(i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-600 transition">حفظ</button>
                <button type="button" onClick={() => h.setShowModal(false)} className="flex-1 py-3 bg-[#121a16] text-[#ecfdf5] rounded-lg hover:bg-white/20 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

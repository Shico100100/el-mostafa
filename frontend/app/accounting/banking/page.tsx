'use client';
import { useBanking } from '@/hooks/accounting/useBanking';
import { Building2, Plus } from 'lucide-react';

export default function BankingPage() {
  const h = useBanking();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Building2 className="w-8 h-8 text-blue-400" />الحسابات البنكية</h1>
            <p className="text-gray-400 mt-1">إدارة الحسابات البنكية والتسويات</p>
          </div>
          <button onClick={() => h.setShowAddModal(true)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition flex items-center gap-2">
            <Plus className="w-5 h-5" /> حساب جديد
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {h.accounts.map((acc: any) => (
            <div key={acc.id} onClick={() => h.selectAccount(acc.id)} className={`bg-black/40 backdrop-blur-xl border rounded-xl p-6 cursor-pointer transition hover:border-blue-500/50 ${h.selectedAccount?.id === acc.id ? 'border-blue-500/50' : 'border-white/10'}`}>
              <h3 className="text-white font-semibold">{acc.name}</h3>
              <p className="text-gray-400 text-sm">{acc.bank_name}</p>
              <p className="text-gray-400 text-sm">{acc.account_number}</p>
              <p className="text-2xl font-bold text-white mt-3">{Number(acc.balance).toLocaleString()} ج.م</p>
            </div>
          ))}
        </div>

        {h.statement && (
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">كشف حساب - {h.selectedAccount?.name}</h3>
              <div className="flex gap-6">
                <div className="text-center"><p className="text-gray-400 text-xs">إجمالي المدين</p><p className="text-green-400 font-bold">{h.statement.totalDebits?.toLocaleString()} ج.م</p></div>
                <div className="text-center"><p className="text-gray-400 text-xs">إجمالي الدائن</p><p className="text-red-400 font-bold">{h.statement.totalCredits?.toLocaleString()} ج.م</p></div>
                <div className="text-center"><p className="text-gray-400 text-xs">الرصيد الحالي</p><p className="text-blue-400 font-bold">{h.statement.currentBalance?.toLocaleString()} ج.م</p></div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-400 border-b border-white/10">
                  <th className="py-3 px-4 text-right">التاريخ</th><th className="py-3 px-4 text-right">الوصف</th><th className="py-3 px-4 text-right">المدين</th><th className="py-3 px-4 text-right">الدائن</th><th className="py-3 px-4 text-right">مرجع</th>
                </tr></thead>
                <tbody>
                  {h.transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-white/5">
                      <td className="py-3 px-4 text-white">{new Date(tx.date).toLocaleDateString('ar')}</td>
                      <td className="py-3 px-4 text-gray-300">{tx.description}</td>
                      <td className="py-3 px-4 text-green-400">{tx.debit ? Number(tx.debit).toLocaleString() : '-'}</td>
                      <td className="py-3 px-4 text-red-400">{tx.credit ? Number(tx.credit).toLocaleString() : '-'}</td>
                      <td className="py-3 px-4 text-gray-400">{tx.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {h.showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => h.setShowAddModal(false)}>
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">إضافة حساب بنكي</h2>
            <form onSubmit={h.createAccount}>
              <div className="space-y-4">
                <div><label className="text-gray-400 text-sm">اسم الحساب</label><input type="text" value={h.newAcc.name} onChange={e => h.setNewAcc({ ...h.newAcc, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">اسم البنك</label><input type="text" value={h.newAcc.bank_name} onChange={e => h.setNewAcc({ ...h.newAcc, bank_name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
                <div><label className="text-gray-400 text-sm">رقم الحساب</label><input type="text" value={h.newAcc.account_number} onChange={e => h.setNewAcc({ ...h.newAcc, account_number: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">حفظ</button>
                <button type="button" onClick={() => h.setShowAddModal(false)} className="flex-1 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

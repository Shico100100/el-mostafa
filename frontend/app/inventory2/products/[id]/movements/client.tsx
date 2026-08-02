'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { BarChart3, Package, TrendingUp, ArrowLeft, Edit3, Trash2, X } from 'lucide-react';
import StatCards from '@/components/inventory2/StatCards';
import { Modal } from '@/components/inventory2/Modal';

interface ProductData {
  id: number; name: string; stock_quantity: string; selling_price: string;
}

interface Movement {
  id: number; date: string; type: string; quantity: string;
  notes?: string; warehouse?: { name: string };
}

export default function ProductMovementsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [editForm, setEditForm] = useState({ quantity: '', type: 'IN', notes: '' });

  const loadData = useCallback(async () => {
    try {
      const [productData, movementsData] = await Promise.all([
        api.fetchWithAuth<ProductData>(`/inventory/products/${productId}`),
        api.fetchWithAuth<Movement[]>(`/inventory/products/${productId}/movements`),
      ]);
      setProduct(productData);
      setMovements(movementsData || []);
    } catch {
      toast.error('فشل تحميل البيانات');
    } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEditModal = (movement: Movement) => {
    setEditingMovement(movement);
    setEditForm({ quantity: movement.quantity, type: movement.type, notes: movement.notes || '' });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovement) return;
    try {
      await api.fetchWithAuth(`/inventory/stock/movements/${editingMovement.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: Number(editForm.quantity), type: editForm.type, notes: editForm.notes }),
      });
      await api.createNotification({
        title: 'طلب الموافقة على تعديل حركة مخزون',
        message: `تم طلب تعديل حركة المخزون رقم ${editingMovement.id} للمنتج ${product?.name}`,
      });
      toast.success('تم إرسال طلب التعديل للمدير');
      setShowEditModal(false);
      loadData();
    } catch {
      toast.error('حدث خطأ أثناء التعديل');
    }
  };

  const handleDeleteMovement = async (movement: Movement) => {
    if (!product) return;
    try {
      await api.createNotification({
        title: 'طلب حذف حركة مخزون',
        message: `تم طلب حذف حركة المخزون رقم ${movement.id} للمنتج ${product.name} - الكمية: ${movement.quantity}`,
        actionType: 'delete_movement',
        actionData: { movementId: movement.id, productId: product.id },
      });
      toast.success('تم إرسال طلب الحذف للمدير');
    } catch {
      toast.error('حدث خطأ أثناء إرسال الطلب');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  const qty = Number(product?.stock_quantity || 0);

  const statsCards = [
    { label: 'الكمية الحالية', value: qty.toLocaleString(), icon: <Package className="w-6 h-6 text-blue-400" />, color: 'bg-blue-500/20' },
    { label: 'إجمالي الحركات', value: movements.length, icon: <BarChart3 className="w-6 h-6 text-purple-400" />, color: 'bg-purple-500/20' },
    { label: 'سعر البيع', value: product ? `${Number(product.selling_price).toFixed(2)} ج.م` : '—', icon: <TrendingUp className="w-6 h-6 text-green-400" />, color: 'bg-green-500/20' },
  ];

  return (
    <>
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/inventory2/products/${productId}`)} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-black text-white">سجل حركات: {product?.name}</h1>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <StatCards cards={statsCards} />

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-right text-white font-semibold text-sm">التاريخ</th>
                <th className="px-6 py-4 text-right text-white font-semibold text-sm">النوع</th>
                <th className="px-6 py-4 text-right text-white font-semibold text-sm">الكمية</th>
                <th className="px-6 py-4 text-right text-white font-semibold text-sm">المخزن</th>
                <th className="px-6 py-4 text-right text-white font-semibold text-sm">ملاحظات</th>
                <th className="px-6 py-4 text-center text-white font-semibold text-sm">الرصيد بعد الحركة</th>
                <th className="px-6 py-4 text-right text-white font-semibold text-sm">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const sorted = [...movements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                let netChange = 0;
                sorted.forEach(m => {
                  const qty = Number(m.quantity);
                  if (m.type === 'IN') netChange += qty;
                  else if (m.type === 'OUT') netChange -= qty;
                });
                const currentStock = Number(product?.stock_quantity || 0);
                let balance = currentStock - netChange;
                return sorted.map((movement) => {
                  const qty = Number(movement.quantity);
                  if (movement.type === 'IN') balance += qty;
                  else if (movement.type === 'OUT') balance -= qty;
                  else balance = qty;
                  return (
                    <tr key={movement.id} className="border-t border-white/5 hover:bg-white/5 transition">
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {new Date(movement.date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          movement.type === 'IN' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          movement.type === 'OUT' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {movement.type === 'IN' ? 'إدخال' : movement.type === 'OUT' ? 'إخراج' : 'تعديل'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-semibold text-sm ${
                        movement.type === 'IN' ? 'text-emerald-400' :
                        movement.type === 'OUT' ? 'text-red-400' : 'text-amber-400'
                      }`}>{Number(movement.quantity).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{movement.warehouse?.name || '—'}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{movement.notes || '—'}</td>
                      <td className={`px-6 py-4 text-center font-bold text-sm ${
                        balance >= 0 ? 'text-white' : 'text-red-400'
                      }`}>{balance.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          <button onClick={() => openEditModal(movement)} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-200 rounded-lg transition" title="تعديل"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteMovement(movement)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg transition" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p>لا توجد حركات لهذا المنتج</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="تعديل حركة المخزون" icon={<Edit3 className="w-6 h-6 text-blue-400" />}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">الكمية</label>
            <input type="number" required min="0" step="0.01"
              value={editForm.quantity}
              onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">النوع</label>
            <select value={editForm.type}
              onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none">
              <option value="IN">إدخال</option>
              <option value="OUT">إخراج</option>
              <option value="ADJUST">تعديل</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">ملاحظات</label>
            <textarea rows={3} value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition">إلغاء</button>
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-900/20">حفظ التعديل</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

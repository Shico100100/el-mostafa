'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Package, Search, ArrowRightLeft,
  ShoppingCart, Truck
} from 'lucide-react';

interface StockItem {
  product_id: number;
  product_name: string;
  product_sku?: string;
  product_type: string;
  quantity: number;
  unit: string;
}

interface WarehouseDetail {
  id: number;
  name: string;
  location?: string;
  is_active: boolean;
}

export default function WarehouseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = Number(params.id);

  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [otherWarehouses, setOtherWarehouses] = useState<WarehouseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Transfer state
  const [transferProduct, setTransferProduct] = useState<StockItem | null>(null);
  const [transferForm, setTransferForm] = useState({ toWarehouseId: '', notes: '' });
  const [showTransfer, setShowTransfer] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [warehouseData, stockData, allWarehouses] = await Promise.all([
        api.fetchWithAuth(`/inventory/warehouses/${warehouseId}`),
        api.fetchWithAuth(`/inventory/warehouses/${warehouseId}/stock`),
        api.fetchWithAuth('/inventory/warehouses'),
      ]);
      setWarehouse(warehouseData);
      setStock(stockData || []);
      setOtherWarehouses((allWarehouses as WarehouseDetail[]).filter((w) => w.id !== warehouseId));
    } catch {
      toast.error('فشل تحميل بيانات المخزن');
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const filteredStock = stock.filter((s) =>
    !search || s.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.product_sku && s.product_sku.toLowerCase().includes(search.toLowerCase()))
  );

  const totalItems = stock.reduce((sum, s) => sum + s.quantity, 0);

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      RAW: 'bg-amber-500/20 text-amber-300',
      SEMI: 'bg-blue-500/20 text-blue-300',
      FINISHED: 'bg-emerald-500/20 text-emerald-300',
    };
    const labels: Record<string, string> = {
      RAW: 'خامة',
      SEMI: 'نصف مصنع',
      FINISHED: 'منتج تام',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[type] || 'bg-gray-500/20 text-gray-300'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const openTransfer = (item: StockItem) => {
    setTransferProduct(item);
    setTransferForm({ toWarehouseId: '', notes: '' });
    setShowTransfer(true);
  };

  const handleTransfer = async () => {
    if (!transferProduct || !transferForm.toWarehouseId) {
      toast.error('الرجاء اختيار المخزن الوجهة');
      return;
    }
    try {
      await api.fetchWithAuth('/inventory/stock/transfer', {
        method: 'POST',
        body: JSON.stringify({
          product_id: transferProduct.product_id,
          from_warehouse_id: warehouseId,
          to_warehouse_id: parseInt(transferForm.toWarehouseId),
          notes: transferForm.notes || `نقل ${transferProduct.product_name}`,
        }),
      });
      toast.success(`تم نقل "${transferProduct.product_name}" بنجاح`);
      setShowTransfer(false);
      loadData();
    } catch {
      toast.error('فشل نقل المنتج');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-gray-400 text-xl">المخزن غير موجود</div>
      </div>
    );
  }

  const typeIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('اكسسوار') || n.includes('accessory')) return '🔧';
    if (n.includes('بلاستيك') || n.includes('plastic')) return '🧩';
    if (n.includes('تعبئة') || n.includes('تغليف') || n.includes('كرتون') || n.includes('pack')) return '📦';
    if (n.includes('تام') || n.includes('finished') || n.includes('منتج')) return '✅';
    return '🏭';
  };

  return (
    <>
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => router.push('/inventory/warehouses')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-2xl">{typeIcon(warehouse.name)}</span>
            <div>
              <h1 className="text-2xl font-black text-white">{warehouse.name}</h1>
              {warehouse.location && <p className="text-gray-400 text-sm">{warehouse.location}</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stock.length}</div>
              <div className="text-xs text-gray-400">عدد الأصناف</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-5 flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalItems.toLocaleString()}</div>
              <div className="text-xs text-gray-400">إجمالي القطع</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Truck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{otherWarehouses.length}</div>
              <div className="text-xs text-gray-400">مخازن أخرى للتحويل</div>
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="بحث في المخزن..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="text-sm text-gray-400">
            عرض {filteredStock.length} من {stock.length} صنف
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">المنتج</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">النوع</th>
                  <th className="px-6 py-4 text-right text-gray-300 font-semibold text-sm">الكمية</th>
                  <th className="px-6 py-4 text-center text-gray-300 font-semibold text-sm">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStock.map((item) => (
                  <tr key={item.product_id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{item.product_name}</div>
                      {item.product_sku && <div className="text-xs text-gray-500 mt-0.5">SKU: {item.product_sku}</div>}
                    </td>
                    <td className="px-6 py-4">{typeBadge(item.product_type)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-lg font-bold ${item.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.quantity}
                      </span>
                      <span className="text-xs text-gray-500 mr-1">{item.unit || 'قطعة'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {otherWarehouses.length > 0 && (
                        <button
                          onClick={() => openTransfer(item)}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-sm transition inline-flex items-center gap-1.5"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          تحويل
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredStock.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-10 h-10 text-gray-600" />
                        <p>{search ? 'لا توجد نتائج للبحث' : 'هذا المخزن فارغ'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Transfer Modal */}
      {showTransfer && transferProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTransfer(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <ArrowRightLeft className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-bold text-white">تحويل مخزون</h3>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="text-white font-medium">{transferProduct.product_name}</div>
              <div className="text-sm text-gray-400 mt-1">
                الكمية: <span className="text-green-400 font-bold">{transferProduct.quantity}</span> {transferProduct.unit || 'قطعة'}
              </div>
              <div className="text-xs text-gray-500 mt-1">سيتم نقل كامل الكمية إلى المخزن الجديد</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">المخزن الوجهة</label>
                <select
                  value={transferForm.toWarehouseId}
                  onChange={(e) => setTransferForm({ ...transferForm, toWarehouseId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  autoFocus
                >
                  <option value="">اختر المخزن...</option>
                  {otherWarehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ملاحظات (اختياري)</label>
                <input
                  type="text"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="سبب التحويل..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button onClick={() => setShowTransfer(false)} className="px-4 py-2 bg-gray-500/20 text-gray-200 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
                <button onClick={handleTransfer} className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-bold shadow-lg shadow-amber-900/20">
                  تأكيد التحويل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

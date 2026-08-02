'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Package, Search, ArrowRightLeft,
  Filter, ShoppingCart, Layers
} from 'lucide-react';

interface StockItem {
  product?: { id: number; name: string; sku?: string; type?: string; unit?: string };
  warehouse?: { id: number; name: string };
  product_id: number;
  warehouse_id: number;
  quantity: string | number;
}

interface WarehouseOption {
  id: number;
  name: string;
}

export default function StockPage() {
  const router = useRouter();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [search, setSearch] = useState('');

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferItem, setTransferItem] = useState<StockItem | null>(null);
  const [transferForm, setTransferForm] = useState({ toWarehouseId: '', notes: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, warehousesData] = await Promise.all([
        api.fetchWithAuth(`/inventory/stock${selectedWarehouse ? `?warehouse_id=${selectedWarehouse}` : ''}`),
        api.fetchWithAuth('/inventory/warehouses'),
      ]);
      setStock(stockData || []);
      setWarehouses(warehousesData || []);
    } catch (error) {
      console.error('Error loading stock:', error);
      toast.error('فشل تحميل بيانات المخزون');
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, [router, loadData]);

  const filteredStock = stock.filter((item) => {
    const name = item.product?.name || '';
    const sku = item.product?.sku || '';
    const type = item.product?.type || '';
    if (search && !name.toLowerCase().includes(search.toLowerCase()) && !sku.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedProductType && type !== selectedProductType) return false;
    return true;
  });

  const totalItems = filteredStock.reduce((sum, s) => sum + Number(s.quantity), 0);
  const activeCount = filteredStock.filter((s) => Number(s.quantity) > 0).length;

  const openTransfer = (item: StockItem) => {
    setTransferItem(item);
    const otherWarehouses = warehouses.filter((w) => w.id !== item.warehouse_id);
    setTransferForm({ toWarehouseId: otherWarehouses[0]?.id?.toString() || '', notes: '' });
    setShowTransfer(true);
  };

  const handleTransfer = async () => {
    if (!transferItem || !transferForm.toWarehouseId) {
      toast.error('الرجاء اختيار المخزن الوجهة');
      return;
    }
    try {
      await api.fetchWithAuth('/inventory/stock/transfer', {
        method: 'POST',
        body: JSON.stringify({
          product_id: transferItem.product_id,
          from_warehouse_id: transferItem.warehouse_id,
          to_warehouse_id: parseInt(transferForm.toWarehouseId),
          notes: transferForm.notes || `نقل ${transferItem.product?.name}`,
        }),
      });
      toast.success(`تم نقل "${transferItem.product?.name}" بنجاح`);
      setShowTransfer(false);
      loadData();
    } catch {
      toast.error('فشل نقل المنتج');
    }
  };

  return (
    <>
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/inventory/products')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-white">تقرير المخزون</h1>
          </div>
          <div className="text-xs text-gray-500 font-mono">{filteredStock.length} سجل</div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Layers className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{filteredStock.length}</div>
              <div className="text-xs text-gray-400">إجمالي السجلات</div>
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
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Package className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{activeCount}</div>
              <div className="text-xs text-gray-400">أصناف متوفرة</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-wrap gap-4 items-center mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 min-w-[160px]"
          >
            <option value="">كل المخازن</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select
            value={selectedProductType}
            onChange={(e) => setSelectedProductType(e.target.value)}
            className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 min-w-[140px]"
          >
            <option value="">كل الأنواع</option>
            <option value="RAW">خامة</option>
            <option value="SEMI">نصف مصنع</option>
            <option value="FINISHED">منتج تام</option>
          </select>
          <Filter className="w-4 h-4 text-gray-500" />
        </div>

        {/* Stock Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="text-center text-gray-400 py-20">جاري التحميل...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-right text-white font-semibold">المنتج</th>
                  <th className="px-6 py-4 text-right text-white font-semibold">المخزن</th>
                  <th className="px-6 py-4 text-right text-white font-semibold">الكمية</th>
                  <th className="px-6 py-4 text-right text-white font-semibold">الحالة</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">تحويل</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item, index) => {
                  const qty = Number(item.quantity);
                  const pid = item.product_id || item.product?.id;
                  return (
                    <tr key={`${item.warehouse_id}-${pid}-${index}`} className="border-t border-white/10 hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="text-gray-200 font-medium">{item.product?.name || `منتج #${pid}`}</div>
                        {item.product?.sku && <div className="text-xs text-gray-500 mt-0.5">SKU: {item.product.sku}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{item.warehouse?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${qty > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {qty.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 mr-1">{item.product?.unit || 'قطعة'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {qty > 0 ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-200 rounded-full text-sm">متوفر</span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/20 text-red-200 rounded-full text-sm">غير متوفر</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {qty > 0 && warehouses.length > 1 && (
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
                  );
                })}
                {filteredStock.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-10 h-10 text-gray-600" />
                        <p>لا توجد بيانات مخزون</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Transfer Modal */}
      {showTransfer && transferItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTransfer(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <ArrowRightLeft className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-bold text-white">تحويل مخزون</h3>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
              <div className="text-white font-medium">{transferItem.product?.name || `منتج #${transferItem.product_id}`}</div>
              <div className="text-sm text-gray-400 mt-1">
                من: <span className="text-amber-300">{transferItem.warehouse?.name}</span>
              </div>
              <div className="text-sm text-gray-400">
                الكمية: <span className="text-green-400 font-bold">{Number(transferItem.quantity).toLocaleString()}</span>
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
                  {warehouses.filter((w) => w.id !== transferItem.warehouse_id).map((w) => (
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

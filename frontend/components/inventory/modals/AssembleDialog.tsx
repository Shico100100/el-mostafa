'use client';

import { useEffect, useState } from 'react';
import { X, PackagePlus, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Warehouse { id: number; name: string; }

interface PreviewItem {
  product_id: number;
  name: string;
  bomQty: number;
  required: number;
  available: number;
  shortfall: number;
  unitCost: number;
}

interface AssemblyPreview {
  product: { id: number; name: string };
  warehouse: { id: number; name: string };
  quantity: number;
  unitCost: number;
  totalCost: number;
  canAssemble: boolean;
  items: PreviewItem[];
}

interface Props {
  product: { id: number; name: string } | null;
  warehouses: Warehouse[];
  defaultWarehouseId?: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function AssembleDialog({
  product,
  warehouses,
  defaultWarehouseId,
  onClose,
  onSaved,
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [warehouseId, setWarehouseId] = useState<number | undefined>(
    defaultWarehouseId,
  );
  const [preview, setPreview] = useState<AssemblyPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [assembling, setAssembling] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setWarehouseId(defaultWarehouseId);
    setPreview(null);
  }, [product?.id, defaultWarehouseId]);

  useEffect(() => {
    if (!product || quantity < 1) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setLoadingPreview(true);
    const qs = new URLSearchParams({ quantity: String(quantity) });
    if (warehouseId) qs.append('warehouseId', String(warehouseId));
    api
      .fetchWithAuth<AssemblyPreview>(
        `/inventory/products/${product.id}/assembly-preview?${qs.toString()}`,
      )
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product, quantity, warehouseId]);

  if (!product) return null;

  const confirm = async () => {
    if (!preview?.canAssemble || quantity < 1) return;
    setAssembling(true);
    try {
      const result = await api.fetchWithAuth<{
        produced: number;
        unitCost: number;
      }>(`/inventory/products/${product.id}/assemble`, {
        method: 'POST',
        body: JSON.stringify({
          quantity,
          warehouse_id: preview.warehouse.id,
        }),
      });
      toast.success(
        `تم تجميع ${result.produced} × ${product.name} (تكلفة الوحدة ${result.unitCost})`,
      );
      onClose();
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل التجميع');
    } finally {
      setAssembling(false);
    }
  };

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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-400" />
            تجميع: {product.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                الكمية
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                المخزن (كل العملية فيه)
              </label>
              <select
                value={warehouseId ?? preview?.warehouse.id ?? ''}
                onChange={(e) =>
                  setWarehouseId(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingPreview ? (
            <p className="text-center text-slate-400 py-8">
              جاري حساب المكونات...
            </p>
          ) : !preview ? (
            <p className="text-center text-slate-400 py-8">
              تعذر تحميل الوصفة — تأكد أن المنتج له مكونات مسجلة
            </p>
          ) : (
            <>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-wrap gap-6 text-sm">
                <span className="text-slate-400">
                  تكلفة الوحدة:{' '}
                  <span className="text-emerald-400 font-bold">
                    {preview.unitCost}
                  </span>
                </span>
                <span className="text-slate-400">
                  الإجمالي:{' '}
                  <span className="text-emerald-400 font-bold">
                    {preview.totalCost}
                  </span>
                </span>
                <span className="text-slate-400">
                  المخزن: {preview.warehouse.name}
                </span>
              </div>

              {!preview.canAssemble && (
                <p className="text-amber-300 text-sm flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  مخزون غير كافٍ — وفّر الكميات الناقصة أولاً
                </p>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-white/10">
                    <th className="py-2 text-right">المكون</th>
                    <th className="py-2 text-right">المطلوب</th>
                    <th className="py-2 text-right">المتاح</th>
                    <th className="py-2 text-right">العجز</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((it) => (
                    <tr
                      key={it.product_id}
                      className="border-b border-white/5"
                    >
                      <td className="py-2 text-white">{it.name}</td>
                      <td className="py-2 text-slate-300 font-mono">
                        {it.required}
                      </td>
                      <td className="py-2 text-slate-300 font-mono">
                        {it.available}
                      </td>
                      <td
                        className={`py-2 font-mono font-bold ${it.shortfall > 0 ? 'text-red-400' : 'text-emerald-400'}`}
                      >
                        {it.shortfall > 0 ? it.shortfall : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition"
            >
              إلغاء
            </button>
            <button
              onClick={confirm}
              disabled={assembling || !preview?.canAssemble}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <PackagePlus className="w-4 h-4" />
              {assembling ? 'جاري التجميع...' : 'تنفيذ التجميع'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Package, DollarSign, BarChart3, Warehouse, Tag, Pencil, PackagePlus } from 'lucide-react';
import PageShell from '@/components/inventory/PageShell';
import InfoCard, { DetailRow } from '@/components/inventory/InfoCard';
import { TypeBadge, StockBadge } from '@/components/inventory/Badge';
import AddEditProductModal from '@/components/inventory/modals/AddEditProductModal';
import AssembleDialog from '@/components/inventory/modals/AssembleDialog';
import {
  toProductData,
  toProductPayload,
  type ProductFormData,
} from '@/lib/inventory/productPayload';

interface Category { id: number; name: string; }
interface Warehouse { id: number; name: string; }
interface ProductDetail {
  id: number; name: string; type: string; unit: string;
  cost_price: string; selling_price: string; stock_quantity: string;
  min_stock?: string; warehouse_id?: number; warehouse?: Warehouse;
  sku?: string; barcode?: string; category?: Category; category_id?: number;
  description?: string; image_path?: string; weight_grams?: string;
  created_at: string; updated_at: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showAssemble, setShowAssemble] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchProduct = useCallback(async () => {
    try {
      const data = await api.fetchWithAuth<ProductDetail>(`/inventory/products/${productId}`);
      setProduct(data);
    } catch {
      toast.error('فشل تحميل بيانات المنتج');
    } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const ensureLookups = async () => {
    if (warehouses.length > 0) return true;
    try {
      const [wh, cats] = await Promise.all([
        api.fetchWithAuth<Warehouse[]>('/inventory/warehouses'),
        api.fetchWithAuth<Category[]>('/inventory/categories').catch(() => []),
      ]);
      setWarehouses(wh || []);
      setCategories(cats || []);
      return true;
    } catch {
      toast.error('فشل تحميل بيانات المخازن');
      return false;
    }
  };

  const openEdit = async () => {
    if (await ensureLookups()) setShowEdit(true);
  };

  const openAssemble = async () => {
    if (await ensureLookups()) setShowAssemble(true);
  };

  const saveEdit = async (data: ProductFormData) => {
    if (!product) return;
    try {
      await api.fetchWithAuth(`/inventory/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(toProductPayload(data)),
      });
      toast.success('تم التحديث');
      setShowEdit(false);
      setLoading(true);
      await fetchProduct();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل الحفظ');
    }
  };

  if (loading) return (
    <PageShell title="..." backHref="/inventory/products">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-48 animate-pulse" />
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-48 animate-pulse" />
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-48 animate-pulse" />
      </div>
    </PageShell>
  );

  if (!product) return (
    <PageShell title="المنتج غير موجود" backHref="/inventory/products">
      <p className="text-center text-slate-400 py-20">المنتج غير موجود</p>
    </PageShell>
  );

  const cost = Number(product.cost_price);
  const sell = Number(product.selling_price);
  const qty = Number(product.stock_quantity);
  const margin = cost > 0 ? { value: sell - cost, pct: ((sell - cost) / cost * 100) } : { value: 0, pct: 0 };

  return (
    <>
    <PageShell
      title={product.name}
      subtitle={product.sku ? `SKU: ${product.sku}` : undefined}
      backHref="/inventory/products"
      actions={
        <>
          <button
            onClick={openEdit}
            className="px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition flex items-center gap-2 text-sm"
          >
            <Pencil className="w-4 h-4" /> تعديل
          </button>
          <button
            onClick={openAssemble}
            title="تجميع المنتج من مكوناته حسب الوصفة المسجلة"
            className="px-4 py-2.5 bg-teal-600/10 hover:bg-teal-600/20 text-teal-300 rounded-xl border border-teal-500/20 transition flex items-center gap-2 text-sm"
          >
            <PackagePlus className="w-4 h-4" /> تجميع
          </button>
          <button
            onClick={() => router.push(`/inventory/products/${product.id}/movements`)}
            className="px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl border border-emerald-500/20 transition flex items-center gap-2 text-sm"
          >
            <BarChart3 className="w-4 h-4" /> سجل الحركات
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {product.image_path && (
          <div className="lg:col-span-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl flex justify-center">
              <div className="relative h-48 w-full max-w-md">
                <Image src={product.image_path} alt={product.name} fill className="object-contain rounded-xl" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
            </div>
          </div>
        )}

        <InfoCard title="معلومات أساسية" icon={<Package className="w-5 h-5 text-blue-400" />}>
          <DetailRow label="الاسم" value={product.name} />
          <DetailRow label="الكود (SKU)" value={product.sku || '—'} />
          <DetailRow label="الباركود" value={product.barcode || '—'} />
          <DetailRow label="النوع" value={<TypeBadge type={product.type} />} />
          <DetailRow label="التصنيف" value={product.category?.name || '—'} />
          <DetailRow label="الوحدة" value={product.unit} />
          {product.weight_grams && <DetailRow label="الوزن" value={`${Number(product.weight_grams).toLocaleString()} جرام`} />}
        </InfoCard>

        <InfoCard title="المخزون" icon={<Warehouse className="w-5 h-5 text-amber-400" />}>
          <DetailRow label="الكمية الحالية" value={<span className="flex items-center gap-2">{qty.toLocaleString()} <StockBadge quantity={qty} /></span>} />
          <DetailRow label="الحد الأدنى" value={product.min_stock ? Number(product.min_stock).toLocaleString() : '—'} />
          <DetailRow label="المخزن" value={product.warehouse?.name || '—'} />
        </InfoCard>

        <InfoCard title="التسعير" icon={<DollarSign className="w-5 h-5 text-emerald-400" />}>
          <DetailRow label="سعر التكلفة" value={`${cost.toFixed(2)} ج.م`} valueClass="text-green-400" />
          <DetailRow label="سعر البيع" value={`${sell.toFixed(2)} ج.م`} valueClass="text-blue-400" />
          <DetailRow label="الهامش" value={`${margin.value.toFixed(2)} ج.م (${margin.pct.toFixed(1)}%)`} valueClass="text-purple-400" />
        </InfoCard>

        {product.description && (
          <div className="lg:col-span-3">
            <InfoCard title="وصف" icon={<Tag className="w-5 h-5 text-slate-400" />}>
              <p className="text-slate-300 text-sm leading-relaxed">{product.description}</p>
            </InfoCard>
          </div>
        )}
      </div>
    </PageShell>
      {showEdit && (
        <AddEditProductModal
          isOpen
          product={toProductData(product)}
          warehouses={warehouses}
          categories={categories}
          onClose={() => setShowEdit(false)}
          onSave={saveEdit}
        />
      )}
      {showAssemble && (
        <AssembleDialog
          product={{ id: product.id, name: product.name }}
          warehouses={warehouses}
          defaultWarehouseId={product.warehouse_id}
          onClose={() => setShowAssemble(false)}
          onSaved={async () => {
            setShowAssemble(false);
            setLoading(true);
            await fetchProduct();
          }}
        />
      )}
    </>
  );
}

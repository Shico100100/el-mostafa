'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ChevronRight, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ManufacturingOrder = {
  id: number;
  sales_order_id: number;
  sales_order_item_id: number | null;
  product_id: number;
  product_name: string | null;
  quantity_required: string | number;
  quantity_produced: string | number;
  status: string;
  priority: string;
  due_date: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'قيد الانتظار', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  IN_PROGRESS: { label: 'جاري التنفيذ', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  COMPLETED: { label: 'مكتمل', cls: 'bg-green-500/15 text-green-300 border-green-500/30' },
  CANCELLED: { label: 'ملغي', cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'منخفضة',
  MEDIUM: 'متوسطة',
  HIGH: 'عالية',
  URGENT: 'عاجلة',
};

function statusBadge(status: string) {
  const s = STATUS_LABELS[status] || { label: status, cls: 'bg-[#6b8378]/15 text-[#ecfdf5] border-[#6b8378]/30' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function ManufacturingOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.fetchWithAuth('/manufacturing/manufacturing-orders');
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching manufacturing orders:', err);
        setError('حدث خطأ أثناء تحميل أوامر الإنتاج');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completed = orders.filter((o) => o.status === 'COMPLETED').length;
  const pending = orders.filter((o) => o.status !== 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="border-b border-[#1f2d26] bg-[#0a0f0d]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/manufacturing')}
            className="flex items-center gap-1 text-[#6b8378] hover:text-white transition"
            aria-label="رجوع"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">أوامر الإنتاج</h1>
            <p className="text-sm text-[#6b8378]">متابعة أوامر الإنتاج المرتبطة بطلبات البيع</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-[#1f2d26] bg-[#121a16] p-5">
            <div className="text-sm text-[#6b8378]">إجمالي الأوامر</div>
            <div className="text-3xl font-bold text-white mt-1">{orders.length}</div>
          </div>
          <div className="rounded-2xl border border-[#1f2d26] bg-[#121a16] p-5">
            <div className="text-sm text-[#6b8378]">قيد التنفيذ</div>
            <div className="text-3xl font-bold text-amber-400 mt-1">{pending}</div>
          </div>
          <div className="rounded-2xl border border-[#1f2d26] bg-[#121a16] p-5">
            <div className="text-sm text-[#6b8378]">مكتمل</div>
            <div className="text-3xl font-bold text-green-400 mt-1">{completed}</div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-white text-lg">جاري التحميل...</div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">{error}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-[#1f2d26] bg-[#121a16] p-16 text-center">
            <Package className="w-12 h-12 text-[#6b8378] mx-auto mb-4" />
            <div className="text-[#ecfdf5] text-lg">لا توجد أوامر إنتاج</div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#1f2d26] bg-[#121a16]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#6b8378] border-b border-[#1f2d26] text-right">
                  <th className="px-4 py-3 font-medium">رقم الأمر</th>
                  <th className="px-4 py-3 font-medium">المنتج</th>
                  <th className="px-4 py-3 font-medium">المطلوب</th>
                  <th className="px-4 py-3 font-medium">المنتج</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium">الأولوية</th>
                  <th className="px-4 py-3 font-medium">تاريخ الاستحقاق</th>
                  <th className="px-4 py-3 font-medium">أمر البيع</th>
                  <th className="px-4 py-3 font-medium">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-[#1f2d26] text-white hover:bg-[#121a16] transition">
                    <td className="px-4 py-3 font-semibold">#{o.id}</td>
                    <td className="px-4 py-3">{o.product_name || `منتج ${o.product_id}`}</td>
                    <td className="px-4 py-3">{Number(o.quantity_required)}</td>
                    <td className="px-4 py-3">{Number(o.quantity_produced)}</td>
                    <td className="px-4 py-3">{statusBadge(o.status)}</td>
                    <td className="px-4 py-3">{PRIORITY_LABELS[o.priority] || o.priority}</td>
                    <td className="px-4 py-3 text-[#ecfdf5]">
                      {o.due_date ? new Date(o.due_date).toLocaleDateString('ar-EG') : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#ecfdf5]">#{o.sales_order_id}</td>
                    <td className="px-4 py-3 text-[#6b8378] max-w-[200px] truncate">{o.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

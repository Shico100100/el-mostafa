'use client';

import { DollarSign, Printer, Pencil, BarChart3, ClipboardList, Trash2 } from 'lucide-react';
import type { Order, Supplier } from '@/components/purchases/types';

interface PurchaseOrderTableProps {
  orders: Order[];
  suppliers: Supplier[];
  loading: boolean;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onPayment: (order: Order) => void;
  onPrint: (order: Order) => void;
  onLandedCost: (order: Order) => void;
  onPackingList: (order: Order) => void;
}

export default function PurchaseOrderTable({
  orders, suppliers, loading,
  onEdit, onDelete, onPayment, onPrint, onLandedCost, onPackingList,
}: PurchaseOrderTableProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-right text-white font-semibold">رقم الأمر</th>
              <th className="px-6 py-4 text-right text-white font-semibold">رقم الفاتورة</th>
              <th className="px-6 py-4 text-right text-white font-semibold">التاريخ</th>
              <th className="px-6 py-4 text-right text-white font-semibold">المورد</th>
              <th className="px-6 py-4 text-right text-white font-semibold">الإجمالي</th>
              <th className="px-6 py-4 text-center text-white font-semibold">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-white">جاري التحميل...</td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-white/10 hover:bg-white/5 transition">
                  <td className="px-6 py-4 text-gray-200">#{order.id}</td>
                  <td className="px-6 py-4 text-gray-300">{order.invoice_number || '-'}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {order.supplier?.name || suppliers.find(s => s.id === order.supplier_id)?.name || 'غير معروف'}
                  </td>
                  <td className="px-6 py-4 text-green-400 font-bold">{Number(order.total_amount).toLocaleString()} جنيه</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <ActionButton icon={<DollarSign className="w-4 h-4" />} title="تسجيل دفعة" onClick={() => onPayment(order)} color="green" />
                      <ActionButton icon={<Printer className="w-4 h-4" />} title="طباعة" onClick={() => onPrint(order)} color="indigo" />
                      <ActionButton icon={<Pencil className="w-4 h-4" />} title="تعديل" onClick={() => onEdit(order)} color="blue" />
                      <ActionButton icon={<BarChart3 className="w-4 h-4" />} title="حساب التكلفة الكلية" onClick={() => onLandedCost(order)} color="amber" />
                      <ActionButton icon={<ClipboardList className="w-4 h-4" />} title="قائمة التعبئة" onClick={() => onPackingList(order)} color="purple" />
                      <ActionButton icon={<Trash2 className="w-4 h-4" />} title="حذف" onClick={() => onDelete(order)} color="red" />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  لا توجد أوامر شراء مطابقة للبحث.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButton({
  icon, title, onClick, color,
}: {
  icon: React.ReactNode; title: string; onClick: () => void; color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-500/20 hover:bg-green-500/30 text-green-200',
    indigo: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200',
    blue: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200',
    amber: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200',
    purple: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200',
    red: 'bg-red-500/20 hover:bg-red-500/30 text-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded tooltip ${colorClasses[color] || ''}`}
      title={title}
    >
      {icon}
    </button>
  );
}

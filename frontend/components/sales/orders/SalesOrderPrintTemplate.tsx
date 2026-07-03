import type { Order, OrderItem } from './types';

export function SalesOrderPrintTemplate({ order, ref }: { order: Order | null; ref: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div style={{ display: 'none' }}>
      <div ref={ref} className="p-12 text-right" dir="rtl">
        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
          <div><h1 className="text-3xl font-black mb-1">المصطفى للإنتاج</h1><p className="text-gray-600 font-bold">لصناعة الأجهزة الكهربائية</p></div>
          <div className="text-left font-bold">
            <h2 className="text-2xl font-black mb-2">فاتورة مبيعات</h2>
            <p>رقم: <span className="font-mono">#{order?.id}</span></p>
            <p>تاريخ: {new Date(order?.order_date || order?.created_at || '').toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-100 p-6 rounded-2xl"><h3 className="font-black text-gray-500 mb-2 border-b border-slate-300 pb-1">بيانات العميل</h3><p className="text-2xl font-black">{order?.customer?.name}</p><p className="mt-1">{order?.customer?.phone}</p><p>{order?.customer?.address}</p></div>
          <div className="bg-slate-100 p-6 rounded-2xl flex flex-col justify-center text-center border-R-4 border-slate-900"><p className="text-slate-500 font-bold mb-1">إجمالي الفاتورة</p><p className="text-4xl font-black">{Number(order?.total_amount).toLocaleString()} ج.م</p></div>
        </div>
        <table className="w-full mb-8 border-collapse">
          <thead><tr className="bg-slate-900 text-white"><th className="p-4 border border-slate-900">م</th><th className="p-4 border border-slate-900">الصنف / المنتج</th><th className="p-4 border border-slate-900">الكمية</th><th className="p-4 border border-slate-900">السعر</th><th className="p-4 border border-slate-900">الإجمالي</th></tr></thead>
          <tbody>{order?.items?.map((item: OrderItem, idx: number) => (<tr key={item.id}><td className="p-4 border border-slate-300 text-center">{idx + 1}</td><td className="p-4 border border-slate-300 font-bold">{item.product?.name}</td><td className="p-4 border border-slate-300 text-center">{item.quantity} {item.product?.unit || 'قطعة'}</td><td className="p-4 border border-slate-300 text-center">{Number(item.price).toLocaleString()}</td><td className="p-4 border border-slate-300 text-center font-bold">{(item.quantity * item.price).toLocaleString()}</td></tr>))}</tbody>
        </table>
        <div className="flex justify-end mt-12"><div className="w-80 space-y-4"><div className="flex justify-between items-center text-xl font-black bg-slate-900 text-white p-6 rounded-2xl"><span>الصافي المطلوب:</span><span>{Number(order?.total_amount).toLocaleString()} ج.م</span></div></div></div>
        {order?.notes && (<div className="mt-12 p-6 bg-slate-50 rounded-2xl border-r-4 border-blue-500"><h4 className="font-black text-blue-900 mb-2">ملاحظات الفاتورة:</h4><p className="text-lg">{order.notes}</p></div>)}
        <div className="mt-24 grid grid-cols-2 text-center text-xl font-bold">
          <div><p className="mb-20 text-slate-400">إمضاء المسؤول</p><div className="w-48 mx-auto border-t-2 border-slate-900 pt-2">ختم الشركة</div></div>
          <div><p className="mb-20 text-slate-400">إمضاء المستلم</p><div className="w-48 mx-auto border-t-2 border-slate-900 pt-2">توقيع العميل</div></div>
        </div>
      </div>
    </div>
  );
}

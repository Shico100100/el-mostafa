import type { Order, OrderItem } from './types';

// 80mm thermal receipt: compact, ink-friendly, no backgrounds.
export function SalesOrderReceiptTemplate({ order, ref }: { order: Order | null; ref: React.RefObject<HTMLDivElement | null> }) {
  const items = order?.items || [];
  return (
    <div style={{ display: 'none' }}>
      <div ref={ref} dir="rtl" style={{ width: '80mm', padding: '4mm', fontFamily: 'inherit', color: '#000', fontSize: '12px' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '6px' }}>
          <div style={{ fontWeight: 900, fontSize: '15px' }}>المصطفى للإنتاج</div>
          <div>فاتورة مبيعات: {order?.invoice_number || `#${order?.id}`}</div>
          <div>التاريخ: {new Date(order?.order_date || order?.created_at || '').toLocaleDateString('ar-EG')}</div>
          <div>العميل: {order?.customer?.name || ''}</div>
        </div>
        {items.length === 0 && <div style={{ textAlign: 'center' }}>لا توجد أصناف</div>}
        {items.map((item: OrderItem, idx: number) => (
          <div key={item.id} style={{ borderBottom: '1px dotted #999', padding: '3px 0' }}>
            <div style={{ fontWeight: 700 }}>{idx + 1}) {item.product?.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.quantity} × {Number(item.price).toLocaleString()}</span>
              <span style={{ fontWeight: 700 }}>{Number(item.total).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {order?.discount_type && order.discount_type !== 'none' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span>خصم:</span>
            <span>{order.discount_type === 'percentage' ? `${order.discount_value}%` : `${Number(order.discount_value).toLocaleString()} ج.م`}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px', marginTop: '6px', borderTop: '1px dashed #000', paddingTop: '6px' }}>
          <span>الإجمالي:</span>
          <span>{Number(order?.total_amount).toLocaleString()} ج.م</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>مدفوع: {Number(order?.paid_amount ?? 0).toLocaleString()}</span>
          <span>متبقي: {Number(order?.remaining ?? order?.total_amount ?? 0).toLocaleString()}</span>
        </div>
        {order?.notes && <div style={{ marginTop: '6px' }}>ملاحظات: {order.notes}</div>}
        <div style={{ textAlign: 'center', marginTop: '8px' }}>شكراً لتعاملكم معنا</div>
      </div>
    </div>
  );
}

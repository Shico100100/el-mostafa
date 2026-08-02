'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { X, Loader2, Printer, ChevronLeft, ChevronRight, CheckSquare, Square, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrderRow {
  id: number;
  customer_id: number;
  customer?: { id: number; name: string; phone?: string };
  total_amount: string | number;
  order_date: string;
  status: string;
  notes?: string;
  invoice_number?: string;
}

interface MonthlySalesDialogProps {
  visible: boolean;
  initialMonth: number;
  initialYear: number;
  onClose: () => void;
}

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const STATUS_AR: Record<string, string> = {
  COMPLETED: 'مكتمل',
  PENDING: 'قيد الانتظار',
  CANCELLED: 'ملغي',
};

async function renderToPdf(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = (canvas.height * pdfW) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
  pdf.save(filename);
}

function SingleInvoicePrint({ order }: { order: OrderRow }) {
  return (
    <div dir="rtl" style={{ fontFamily: 'Arial, sans-serif', padding: '24px', width: '210mm', background: '#fff', color: '#000' }}>
      <div style={{ textAlign: 'center', borderBottom: '3px solid #10b981', paddingBottom: '12px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: 0, color: '#10b981' }}>فاتورة مبيعات</h1>
      </div>
      <table style={{ width: '100%', marginBottom: '20px', fontSize: '14px' }}>
        <tbody>
          <tr><td style={{ fontWeight: 'bold', padding: '4px 0' }}>رقم الفاتورة:</td><td>{order.invoice_number || order.id}</td></tr>
          <tr><td style={{ fontWeight: 'bold', padding: '4px 0' }}>التاريخ:</td><td>{order.order_date}</td></tr>
          <tr><td style={{ fontWeight: 'bold', padding: '4px 0' }}>العميل:</td><td>{order.customer?.name || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold', padding: '4px 0' }}>الهاتف:</td><td>{order.customer?.phone || '-'}</td></tr>
          <tr><td style={{ fontWeight: 'bold', padding: '4px 0' }}>الحالة:</td><td>{STATUS_AR[order.status] || order.status}</td></tr>
        </tbody>
      </table>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ background: '#10b981', color: '#fff' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>البيان</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{order.notes || `فاتورة مبيعات #${order.id}`}</td>
            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>{Number(order.total_amount).toLocaleString('ar-EG')} ج.م</td>
          </tr>
        </tbody>
      </table>
      <div style={{ borderTop: '2px solid #10b981', paddingTop: '12px', textAlign: 'left' }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>الإجمالي: {Number(order.total_amount).toLocaleString('ar-EG')} ج.م</span>
      </div>
    </div>
  );
}

function SummaryPrintContent({ orders, month, year }: { orders: OrderRow[]; month: number; year: number }) {
  const total = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  return (
    <div dir="rtl" style={{ fontFamily: 'Arial, sans-serif', padding: '24px', width: '297mm', background: '#fff', color: '#000' }}>
      <div style={{ textAlign: 'center', borderBottom: '3px solid #10b981', paddingBottom: '12px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>ملخص مبيعات {MONTH_NAMES[month]} {year}</h1>
        <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>عدد الفواتير: {orders.length} | الإجمالي: {total.toLocaleString('ar-EG')} ج.م</p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#10b981', color: '#fff' }}>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>#</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>رقم الفاتورة</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>العميل</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>التاريخ</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>الحالة</th>
            <th style={{ padding: '8px', border: '1px solid #ddd' }}>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={o.id} style={{ background: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
              <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{i + 1}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{o.invoice_number || '-'}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{o.customer?.name || '-'}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{o.order_date}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{STATUS_AR[o.status] || o.status}</td>
              <td style={{ padding: '6px 8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{Number(o.total_amount).toLocaleString('ar-EG')} ج.م</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#10b981', color: '#fff', fontWeight: 'bold' }}>
            <td colSpan={5} style={{ padding: '10px 8px', border: '1px solid #ddd', textAlign: 'left' }}>الإجمالي</td>
            <td style={{ padding: '10px 8px', border: '1px solid #ddd' }}>{total.toLocaleString('ar-EG')} ج.م</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function MonthlySalesDialog({ visible, initialMonth, initialYear, onClose }: MonthlySalesDialogProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [printing, setPrinting] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const loadOrders = useCallback(async (m: number, y: number) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);

      const allOrders: OrderRow[] = [];
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const res = await api.fetchWithAuth<{ items: OrderRow[]; total: number; totalPages: number }>(
          `/sales/orders?page=${page}&limit=100`
        );
        allOrders.push(...(res.items || []));
        totalPages = res.totalPages || 1;
        if (allOrders.length >= (res.total || 0)) break;
        page++;
      }

      const filtered = allOrders.filter((o) => {
        const d = new Date(o.order_date);
        return d >= firstDay && d <= lastDay && o.status !== 'CANCELLED';
      });

      setOrders(filtered);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadOrders(month, year);
    }
  }, [visible, month, year, loadOrders]);

  useEffect(() => {
    setMonth(initialMonth);
    setYear(initialYear);
  }, [initialMonth, initialYear]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === orders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  };

  const handlePrintSingle = async (order: OrderRow) => {
    setPrinting(true);
    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const { createRoot } = await import('react-dom/client');
      const root = createRoot(container);
      await new Promise<void>((resolve) => {
        root.render(<SingleInvoicePrint order={order} />);
        setTimeout(resolve, 200);
      });

      const el = container.firstElementChild as HTMLElement;
      if (el) {
        await renderToPdf(el, `invoice-${order.invoice_number || order.id}.pdf`);
      }

      root.unmount();
      document.body.removeChild(container);
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintSummary = async (ordersToPrint: OrderRow[], label: string) => {
    setPrinting(true);
    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const { createRoot } = await import('react-dom/client');
      const root = createRoot(container);
      await new Promise<void>((resolve) => {
        root.render(<SummaryPrintContent orders={ordersToPrint} month={month} year={year} />);
        setTimeout(resolve, 200);
      });

      const el = container.firstElementChild as HTMLElement;
      if (el) {
        await renderToPdf(el, `sales-${label}-${MONTH_NAMES[month]}-${year}.pdf`);
      }

      root.unmount();
      document.body.removeChild(container);
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setPrinting(false);
    }
  };

  const selectedOrders = orders.filter((o) => selected.has(o.id));
  const total = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const selectedTotal = selectedOrders.reduce((s, o) => s + Number(o.total_amount), 0);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" dir="rtl">
      <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <FileText className="w-6 h-6 text-blue-400" />
            <h2 className="text-white text-xl font-bold">فواتير المبيعات</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Picker + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 pb-0">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-white font-semibold text-lg min-w-[160px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={nextMonth} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {selected.size > 0 && (
              <button
                onClick={() => handlePrintSummary(selectedOrders, `selected-${selected.size}`)}
                disabled={printing}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                طباعة المحدد ({selected.size})
              </button>
            )}
            <button
              onClick={() => handlePrintSummary(orders, 'all')}
              disabled={printing}
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              طباعة كل الفواتير
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 px-6 py-3 text-sm">
          <span className="text-slate-400">الفواتير: <span className="text-white font-semibold">{orders.length}</span></span>
          <span className="text-slate-400">الإجمالي: <span className="text-emerald-400 font-semibold">{total.toLocaleString('ar-EG')} ج.م</span></span>
          {selected.size > 0 && (
            <span className="text-slate-400">المحدد: <span className="text-blue-400 font-semibold">{selectedTotal.toLocaleString('ar-EG')} ج.م</span></span>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6" ref={printRef}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/40">لا توجد فواتير في هذا الشهر</p>
            </div>
          ) : (
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-2">
                    <button onClick={toggleAll} className="text-white/60 hover:text-white">
                      {selected.size === orders.length && orders.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-2 text-white/60 text-sm font-medium">رقم</th>
                  <th className="py-3 px-2 text-white/60 text-sm font-medium">رقم الفاتورة</th>
                  <th className="py-3 px-2 text-white/60 text-sm font-medium">العميل</th>
                  <th className="py-3 px-2 text-white/60 text-sm font-medium">التاريخ</th>
                  <th className="py-3 px-2 text-white/60 text-sm font-medium">الحالة</th>
                  <th className="py-3 px-2 text-white/60 text-sm font-medium">المبلغ</th>
                  <th className="py-3 px-2 text-white/60 text-sm font-medium">طباعة</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2">
                      <button onClick={() => toggleSelect(order.id)}>
                        {selected.has(order.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Square className="w-5 h-5 text-white/30 hover:text-white/60" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-white/40 text-sm">{order.id}</td>
                    <td className="py-3 px-2 text-white text-sm font-mono">{order.invoice_number || '-'}</td>
                    <td className="py-3 px-2 text-white text-sm">{order.customer?.name || '-'}</td>
                    <td className="py-3 px-2 text-white/60 text-sm">{order.order_date}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                        order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {STATUS_AR[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-white font-semibold text-sm">
                      {Number(order.total_amount).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handlePrintSingle(order)}
                        disabled={printing}
                        className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                        title="طباعة الفاتورة"
                      >
                        <Printer className="w-4 h-4 text-white/60 hover:text-white" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/20">
                  <td colSpan={6} className="py-3 px-2 text-white font-bold text-sm text-left">
                    الإجمالي
                  </td>
                  <td className="py-3 px-2 text-emerald-400 font-bold text-sm">
                    {total.toLocaleString('ar-EG')} ج.م
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

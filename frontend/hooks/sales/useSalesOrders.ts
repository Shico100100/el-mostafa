'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import type { Order, Customer, Product, Warehouse, OrderPayment, NewOrderData, PaymentData, Filters } from '@/components/sales/orders/types';

const EMPTY_FILTERS: Filters = {
  search: '',
  fromDate: '',
  toDate: '',
  status: '',
  delivered: '',
  payment: '',
  page: 1,
  limit: 20,
};

export function useSalesOrders() {
  const ready = useAuthCheck();
  const router = useRouter();
  // Monotonic request id: stale list responses are dropped so rapid
  // filter/paging changes can never paint out-of-order results.
  const listReqId = useRef(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderPayments, setOrderPayments] = useState<OrderPayment[]>([]);
  // Edit mode: reuses the create modal, prefilled from the saved order.
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  // Debounced search: typing updates the input instantly, the query fires 400ms later.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search.trim()), 400);
    return () => clearTimeout(t);
  }, [filters.search]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [quickCustomerData, setQuickCustomerData] = useState({ name: '', phone: '', email: '', address: '' });

  const [newOrder, setNewOrder] = useState<NewOrderData>({
    customer_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [],
    discount_type: 'none',
    discount_value: 0,
  });

  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
    method: 'cash',
  });

  const componentRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [printKind, setPrintKind] = useState<'invoice' | 'receipt'>('invoice');

  const handlePrint = useReactToPrint({
    contentRef: printKind === 'receipt' ? receiptRef : componentRef,
    documentTitle: `${printKind === 'receipt' ? 'Receipt' : 'Sales_Order'}_${orderToPrint?.id}`,
    onAfterPrint: () => setOrderToPrint(null),
  });

  useEffect(() => {
    if (orderToPrint && (printKind === 'receipt' ? receiptRef.current : componentRef.current)) {
      handlePrint();
    }
  }, [orderToPrint, printKind, handlePrint]);

  // Static reference data: loaded once (customers refresh separately after quick-add).
  const loadStatic = useCallback(async () => {
    try {
      const [customersData, productsData, warehousesData] = await Promise.all([
        api.fetchWithAuth('/sales/customers'),
        api.fetchWithAuth('/inventory/products'),
        api.fetchWithAuth('/inventory/warehouses'),
      ]);
      setCustomers(sortAlphabetically(customersData || [], 'name'));
      setProducts(sortAlphabetically((productsData || []).filter((p: Product) => p.type === 'FINISHED' || p.type === 'SEMI'), 'name'));
      setWarehouses(warehousesData || []);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const productsData = await api.fetchWithAuth('/inventory/products');
      setProducts(sortAlphabetically((productsData || []).filter((p: Product) => p.type === 'FINISHED' || p.type === 'SEMI'), 'name'));
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const myReq = ++listReqId.current;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(filters.status && { status: filters.status }),
        ...(filters.delivered && { delivered: filters.delivered }),
        ...(filters.payment && { payment: filters.payment }),
      });

      const ordersData = await api.fetchWithAuth(`/sales/orders?${queryParams}`);
      if (listReqId.current !== myReq) return;

      setOrders(ordersData.items || []);
      setTotalPages(ordersData.totalPages || 1);
      setTotalItems(ordersData.total || 0);
    } catch (error) {
      if (listReqId.current !== myReq) return;
      console.error('Error loading data:', error);
      toast.error('فشل تحميل أوامر البيع');
      setOrders([]);
    } finally {
      if (listReqId.current === myReq) setLoading(false);
    }
  }, [filters.page, filters.limit, filters.fromDate, filters.toDate, filters.status, filters.delivered, filters.payment, debouncedSearch]);

  // Full reload (orders + fresh availability): after mutations and Peachtree imports.
  const loadData = useCallback(async () => {
    await Promise.all([loadOrders(), refreshProducts()]);
  }, [loadOrders, refreshProducts]);

  useEffect(() => {
    if (!ready) return;
    loadStatic();
  }, [ready, loadStatic]);

  useEffect(() => {
    if (!ready) return;
    loadOrders();
  }, [ready, loadOrders]);

  const resetFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setDebouncedSearch('');
  };

  const handleAddItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_id: '', quantity: 1, unit_price: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value } as typeof updatedItems[number];

    if (field === 'product_id') {
      const product = products.find(p => p.id === Number(value));
      if (product) {
        updatedItems[index].unit_price = product.selling_price;
        if (!updatedItems[index].warehouse_id && product.warehouse_id) {
          updatedItems[index].warehouse_id = String(product.warehouse_id);
        }
      }
    }

    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const calculateSubtotal = () => {
    return newOrder.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    let discount = 0;
    if (newOrder.discount_type === 'percentage') {
      discount = subtotal * (Math.min(Number(newOrder.discount_value) || 0, 100) / 100);
    } else if (newOrder.discount_type === 'fixed') {
      discount = Math.min(Number(newOrder.discount_value) || 0, subtotal);
    }
    return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  };

  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.fetchWithAuth('/sales/customers', {
        method: 'POST',
        body: JSON.stringify(quickCustomerData),
      });
      const customersData = await api.fetchWithAuth('/sales/customers');
      setCustomers(sortAlphabetically(customersData, 'name'));
      setNewOrder({ ...newOrder, customer_id: result.id });
      setShowQuickCustomerModal(false);
      setQuickCustomerData({ name: '', phone: '', email: '', address: '' });
      toast.success('تم إضافة العميل بنجاح');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('فشل إضافة العميل');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;
    const remaining = Number(selectedOrderForPayment.remaining ?? selectedOrderForPayment.total_amount);
    if (Number(paymentData.amount) <= 0) {
      toast.error('مبلغ الدفعة يجب أن يكون أكبر من صفر');
      return;
    }
    if (Number(paymentData.amount) > remaining) {
      toast.error(`المبلغ يتجاوز المتبقي على الفاتورة (${remaining.toLocaleString()})`);
      return;
    }
    try {
      await api.fetchWithAuth(`/sales/customers/${selectedOrderForPayment.customer_id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ ...paymentData, order_id: selectedOrderForPayment.id }),
      });
      setShowPaymentModal(false);
      setSelectedOrderForPayment(null);
      setPaymentData({ amount: 0, payment_date: new Date().toISOString().split('T')[0], notes: '', method: 'cash' });
      toast.success('تم تسجيل الدفعة بنجاح');
      loadData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('فشل تسجيل الدفعة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customer_id) {
      toast.error('اختر العميل أولاً');
      return;
    }
    if (newOrder.items.length === 0) {
      toast.error('أضف صنفاً واحداً على الأقل');
      return;
    }
    for (let i = 0; i < newOrder.items.length; i++) {
      const item = newOrder.items[i];
      if (!item.product_id) {
        toast.error(`اختر المنتج في السطر ${i + 1}`);
        return;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast.error(`الكمية في السطر ${i + 1} يجب أن تكون أكبر من صفر`);
        return;
      }
    }
    try {
      await api.fetchWithAuth('/sales/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: parseInt(newOrder.customer_id),
          total_amount: calculateTotal(),
          order_date: newOrder.date,
          notes: newOrder.notes,
          discount_type: newOrder.discount_type,
          discount_value: Number(newOrder.discount_value) || 0,
          items: newOrder.items.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: Number(item.quantity),
            price: Number(item.unit_price),
            total: Number(item.quantity) * Number(item.unit_price),
            ...(item.warehouse_id ? { warehouse_id: parseInt(item.warehouse_id) } : {}),
          })),
        }),
      });
      setShowModal(false);
      resetOrderForm();
      loadData();
      toast.success('تم إنشاء أمر البيع بنجاح');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('فشل إنشاء أمر البيع');
    }
  };

  const openEdit = async (order: Order) => {
    try {
      const items = await api.fetchWithAuth(`/sales/orders/${order.id}/items`);
      setEditingOrderId(order.id);
      setNewOrder({
        customer_id: order.customer_id.toString(),
        date: (order.order_date || order.created_at || '').split('T')[0],
        // Hide the sync key prefix in the editor; the backend re-attaches it on save.
        notes: (order.notes || '').replace(/^\[PQ-[^\]]+\]\s*/, ''),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: items.map((item: any) => ({
          product_id: item.product_id.toString(),
          quantity: item.quantity,
          unit_price: item.price,
        })),
        discount_type: (order.discount_type as NewOrderData['discount_type']) || 'none',
        discount_value: Number(order.discount_value) || 0,
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error opening edit:', error);
      toast.error('فشل فتح التعديل');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrderId) return;
    if (newOrder.items.length === 0) {
      toast.error('أضف صنفاً واحداً على الأقل');
      return;
    }
    for (let i = 0; i < newOrder.items.length; i++) {
      const item = newOrder.items[i];
      if (!item.product_id) {
        toast.error(`اختر المنتج في السطر ${i + 1}`);
        return;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast.error(`الكمية في السطر ${i + 1} يجب أن تكون أكبر من صفر`);
        return;
      }
    }
    try {
      await api.fetchWithAuth(`/sales/orders/${editingOrderId}`, {
        method: 'PUT',
        body: JSON.stringify({
          notes: newOrder.notes,
          discount_type: newOrder.discount_type,
          discount_value: Number(newOrder.discount_value) || 0,
          items: newOrder.items.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: Number(item.quantity),
            price: Number(item.unit_price),
            total: Number(item.quantity) * Number(item.unit_price),
            ...(item.warehouse_id ? { warehouse_id: parseInt(item.warehouse_id) } : {}),
          })),
        }),
      });
      setShowModal(false);
      resetOrderForm();
      loadData();
      toast.success('تم تعديل الطلب بنجاح');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('فشل تعديل الطلب');
    }
  };

  const resetOrderForm = () => {
    setEditingOrderId(null);
    setNewOrder({
      customer_id: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      items: [],
      discount_type: 'none',
      discount_value: 0,
    });
  };

  const closeCreateModal = () => {
    setShowModal(false);
    resetOrderForm();
  };

  const handleDuplicateOrder = async (order: Order) => {
    try {
      const items = await api.fetchWithAuth(`/sales/orders/${order.id}/items`);
      setEditingOrderId(null);
      setNewOrder({
        customer_id: order.customer_id.toString(),
        date: new Date().toISOString().split('T')[0],
        notes: `نسخة من الطلب رقم ${order.id}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: items.map((item: any) => ({
          product_id: item.product_id.toString(),
          quantity: item.quantity,
          unit_price: item.price,
        })),
        discount_type: 'none',
        discount_value: 0,
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error duplicating order:', error);
      toast.error('حدث خطأ أثناء نسخ الطلب');
    }
  };

  const handleDeliver = async (order: Order) => {
    try {
      await api.fetchWithAuth(`/sales/orders/${order.id}/deliver`, { method: 'POST' });
      toast.success(`تم تسليم الطلب #${order.id}`);
      loadData();
    } catch (error) {
      console.error('Error delivering order:', error);
      toast.error('فشل تسليم الطلب');
    }
  };

  const handleCancel = async (order: Order) => {
    try {
      await api.fetchWithAuth(`/sales/orders/${order.id}/cancel`, { method: 'POST' });
      toast.success(`تم إلغاء الطلب #${order.id} وإرجاع المخزون`);
      loadData();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('فشل إلغاء الطلب');
    }
  };

  const handleDelete = async (order: Order) => {
    try {
      await api.fetchWithAuth(`/sales/orders/${order.id}`, { method: 'DELETE' });
      toast.success(`تم حذف الطلب #${order.id} وعكس قيوده`);
      loadData();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('فشل حذف الطلب');
    }
  };

  const handleExport = async () => {
    try {
      await api.exportSalesOrders();
      toast.success('تم تصدير أوامر البيع');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('فشل تصدير أوامر البيع');
    }
  };

  const openPayment = (order: Order) => {
    const remaining = Number(order.remaining ?? order.total_amount);
    setSelectedOrderForPayment(order);
    setPaymentData({ amount: remaining, payment_date: new Date().toISOString().split('T')[0], notes: '', method: 'cash' });
    setShowPaymentModal(true);
  };

  const openDetails = async (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    try {
      const payments = await api.fetchWithAuth(`/sales/orders/${order.id}/payments`);
      setOrderPayments(Array.isArray(payments) ? payments : []);
    } catch {
      setOrderPayments([]);
    }
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
    setOrderPayments([]);
  };

  // Print with line items: list rows carry no items, so fetch them first.
  const preparePrintable = async (order: Order) => {
    const items = await api.fetchWithAuth(`/sales/orders/${order.id}/items`);
    const summary = await api.fetchWithAuth(`/sales/orders/${order.id}/payment-summary`);
    return {
      ...order,
      items: Array.isArray(items) ? items : [],
      paid_amount: summary?.paid ?? order.paid_amount ?? 0,
      remaining: summary?.remaining ?? order.remaining ?? Number(order.total_amount),
    };
  };

  const openPrint = async (order: Order) => {
    try {
      setPrintKind('invoice');
      setOrderToPrint(await preparePrintable(order));
    } catch (error) {
      console.error('Error preparing print:', error);
      toast.error('فشل تجهيز الطباعة');
    }
  };

  const openReceipt = async (order: Order) => {
    try {
      setPrintKind('receipt');
      setOrderToPrint(await preparePrintable(order));
    } catch (error) {
      console.error('Error preparing receipt:', error);
      toast.error('فشل تجهيز الإيصال');
    }
  };

  const shareWhatsApp = async (order: Order) => {
    try {
      const full = await preparePrintable(order);
      const lines = (full.items || []).map(
        (it, i) => `${i + 1}) ${it.product?.name || 'صنف'} - ${it.quantity} × ${Number(it.price).toLocaleString()} = ${Number(it.total).toLocaleString()}`,
      );
      const text = [
        'المصطفى للإنتاج - فاتورة مبيعات',
        `رقم: ${full.invoice_number || '#' + full.id}`,
        `التاريخ: ${new Date(full.order_date || full.created_at).toLocaleDateString('ar-EG')}`,
        `العميل: ${full.customer?.name || ''}`,
        '——————',
        ...lines,
        '——————',
        `الإجمالي: ${Number(full.total_amount).toLocaleString()} ج.م`,
        `مدفوع: ${Number(full.paid_amount ?? 0).toLocaleString()} - متبقي: ${Number(full.remaining ?? full.total_amount).toLocaleString()}`,
      ].join('\n');
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } catch (error) {
      console.error('Error sharing order:', error);
      toast.error('فشل تجهيز المشاركة');
    }
  };

  const openReturn = (order: Order) => {
    router.push(`/sales/returns?orderId=${order.id}`);
  };

  return {
    // State
    orders, loading, customers, products, warehouses,
    filters, setFilters, totalPages, totalItems,
    showModal, setShowModal, closeCreateModal,
    editingOrderId,
    showPaymentModal, setShowPaymentModal,
    showDetailsModal,
    selectedOrder, selectedOrderForPayment, setSelectedOrderForPayment,
    orderPayments,
    showQuickCustomerModal, setShowQuickCustomerModal,
    quickCustomerData, setQuickCustomerData,
    newOrder, setNewOrder,
    paymentData, setPaymentData,
    componentRef, receiptRef, orderToPrint, printKind, setOrderToPrint,

    // Handlers
    resetFilters, loadData,
    handleAddItem, handleRemoveItem, handleItemChange,
    calculateTotal, calculateSubtotal,
    handleQuickCustomerSubmit,
    handlePaymentSubmit,
    handleSubmit, handleUpdate,
    handleDuplicateOrder,
    openEdit,
    handleDeliver, handleCancel, handleDelete,
    handleExport,
    openPayment, openDetails, closeDetails, openPrint, openReceipt,
    shareWhatsApp, openReturn,
  };
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import type { Order, Customer, Product, NewOrderData, PaymentData, Filters } from '@/components/sales/orders/types';

export function useSalesOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 20,
  });
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
  });

  const componentRef = useRef<HTMLDivElement>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Sales_Order_${orderToPrint?.id}`,
    onAfterPrint: () => setOrderToPrint(null),
  });

  useEffect(() => {
    if (orderToPrint && componentRef.current) {
      handlePrint();
    }
  }, [orderToPrint, handlePrint]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
      });

      const [ordersData, customersData, productsData] = await Promise.all([
        api.fetchWithAuth(`/sales/orders?${queryParams}`),
        api.fetchWithAuth('/sales/customers'),
        api.fetchWithAuth('/inventory/products'),
      ]);

      setOrders(ordersData.items || []);
      setTotalPages(ordersData.totalPages || 1);
      setTotalItems(ordersData.total || 0);

      setCustomers(sortAlphabetically(customersData || [], 'name'));
      setProducts(sortAlphabetically((productsData || []).filter((p: Product) => p.type === 'FINISHED' || p.type === 'SEMI'), 'name'));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل أوامر البيع');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router, loadData]);

  const resetFilters = () => {
    setFilters({ search: '', fromDate: '', toDate: '', page: 1, limit: 20 });
  };

  const handleAddItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_id: '', quantity: 1, unit_price: 0, discount: 0 }]
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
      }
    }

    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const calculateTotal = () => {
    const subtotal = newOrder.items.reduce((sum, item) => {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemDiscount = Number(item.discount) || 0;
      return sum + (itemTotal - itemDiscount);
    }, 0);

    let discount = 0;
    if (newOrder.discount_type === 'percentage') {
      discount = subtotal * (Number(newOrder.discount_value) / 100);
    } else if (newOrder.discount_type === 'fixed') {
      discount = Number(newOrder.discount_value);
    }

    return Math.max(0, subtotal - discount);
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
    try {
      await api.fetchWithAuth(`/sales/customers/${selectedOrderForPayment.customer_id}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
      setShowPaymentModal(false);
      setSelectedOrderForPayment(null);
      setPaymentData({ amount: 0, payment_date: new Date().toISOString().split('T')[0], notes: '' });
      toast.success('تم تسجيل الدفعة بنجاح');
      loadData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('فشل تسجيل الدفعة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total_amount = calculateTotal();
    try {
      await api.fetchWithAuth('/sales/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: parseInt(newOrder.customer_id),
          total_amount,
          order_date: newOrder.date,
          notes: newOrder.notes,
          items: newOrder.items.map(item => ({
            product_id: parseInt(item.product_id),
            quantity: item.quantity.toString(),
            price: item.unit_price.toString(),
            total: (item.quantity * item.unit_price).toString()
          })),
        }),
      });
      setShowModal(false);
      setNewOrder({
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [],
        discount_type: 'none',
        discount_value: 0,
      });
      loadData();
      toast.success('تم إنشاء أمر البيع بنجاح');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('فشل إنشاء أمر البيع');
    }
  };

  const handleDuplicateOrder = async (order: Order) => {
    try {
      const items = await api.fetchWithAuth(`/sales/orders/${order.id}/items`);
      setNewOrder({
        customer_id: order.customer_id.toString(),
        date: new Date().toISOString().split('T')[0],
        notes: `نسخة من الطلب رقم ${order.id}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: items.map((item: any) => ({
          product_id: item.product_id.toString(),
          quantity: item.quantity,
          unit_price: item.price,
          discount: 0
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

  const handleExport = () => {
    api.exportSalesOrders();
  };

  const openPayment = (order: Order) => {
    setSelectedOrderForPayment(order);
    setPaymentData({ ...paymentData, amount: Number(order.total_amount) });
    setShowPaymentModal(true);
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  return {
    // State
    orders, loading, customers, products,
    filters, setFilters, totalPages, totalItems,
    showModal, setShowModal,
    showPaymentModal, setShowPaymentModal,
    showDetailsModal,
    selectedOrder, selectedOrderForPayment, setSelectedOrderForPayment,
    showQuickCustomerModal, setShowQuickCustomerModal,
    quickCustomerData, setQuickCustomerData,
    newOrder, setNewOrder,
    paymentData, setPaymentData,
    componentRef, orderToPrint, setOrderToPrint,

    // Handlers
    resetFilters, loadData,
    handleAddItem, handleRemoveItem, handleItemChange,
    calculateTotal,
    handleQuickCustomerSubmit,
    handlePaymentSubmit,
    handleSubmit,
    handleDuplicateOrder,
    handleExport,
    openPayment, openDetails, closeDetails,
  };
}

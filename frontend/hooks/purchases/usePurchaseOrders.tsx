'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import type {
  Supplier, Product, Order, OrderItem, NewOrderItem,
  LandedCostData, PackingListForm,
} from '@/components/purchases/types';
import { exportToExcel, handleExportItems, handleImportItems } from './usePurchaseOrderExcel';

export function usePurchaseOrders() {
  const ready = useAuthCheck();
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);

  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [quickProductData, setQuickProductData] = useState({
    name: '', unit: 'kg', weight_grams: '',
  });

  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);

  const [filters, setFilters] = useState({
    search: '', fromDate: '', toDate: '', page: 1, limit: 20,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [typingValues, setTypingValues] = useState<{ [key: string]: string }>({});

  const [newOrder, setNewOrder] = useState({
    supplier_id: '',
    date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    notes: '',
    items: [] as NewOrderItem[],
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [showLandedCostModal, setShowLandedCostModal] = useState(false);
  const [landedCostOrderId, setLandedCostOrderId] = useState<number | null>(null);
  const [landedCostData, setLandedCostData] = useState<LandedCostData | null>(null);
  const [landedCostForm, setLandedCostForm] = useState({
    freight_cost: 0, customs_percent: 0, commission_percent: 0, total_weight_kg: 0,
  });
  const [calculatingLandedCost, setCalculatingLandedCost] = useState(false);

  const [showPackingListModal, setShowPackingListModal] = useState(false);
  const [packingListOrderId, setPackingListOrderId] = useState<number | null>(null);
  const [packingListForm, setPackingListForm] = useState<PackingListForm>({
    carton_length_cm: '', carton_width_cm: '', carton_height_cm: '',
    cartons_count: '1', actual_net_weight_kg: '', actual_gross_weight_kg: '',
    deviation_threshold_percent: '5', notes: '',
  });
  const [packingListResult, setPackingListResult] = useState<Record<string, unknown> | null>(null);
  const [savingPackingList, setSavingPackingList] = useState(false);

  const componentRef = useRef<HTMLDivElement>(null);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Purchase_Order_${orderToPrint?.id}`,
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

      const [ordersData, suppliersData, productsData] = await Promise.all([
        api.fetchWithAuth(`/purchases/orders?${queryParams}`),
        api.fetchWithAuth('/purchases/suppliers'),
        api.fetchWithAuth('/inventory/products'),
      ]);

      const sortedOrders = (ordersData.items || []).sort(
        (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(sortedOrders);
      setTotalPages(ordersData.totalPages || 1);
      setTotalItems(ordersData.total || 0);

      setSuppliers(sortAlphabetically(suppliersData || [], 'name'));
      setProducts(sortAlphabetically(productsData || [], 'name'));

      const lowStockData = await api.fetchWithAuth('/inventory/products?lowStock=true&type=RAW');
      const lowStockList = lowStockData?.data || lowStockData || [];
      setLowStockProducts(lowStockList.slice(0, 5));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل تحميل أوامر الشراء');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready, loadData]);

  const handleAddItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_id: '', quantity: 1, price: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value } as NewOrderItem;
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const handleItemTotalChange = (index: number, totalValue: string) => {
    const updatedItems = [...newOrder.items];
    const item = updatedItems[index];
    const quantity = Number(item.quantity) || 1;
    const total = totalValue === '' ? 0 : Number(totalValue);
    updatedItems[index] = { ...item, price: total / quantity };
    setNewOrder({ ...newOrder, items: updatedItems });
    const newTyping = { ...typingValues };
    delete newTyping[`${index}-total`];
    setTypingValues(newTyping);
  };

  const handleTypedChange = (index: number, field: string, value: string) => {
    setTypingValues({ ...typingValues, [`${index}-${field}`]: value });
    if (field === 'quantity' || field === 'price') {
      const updatedItems = [...newOrder.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      setNewOrder({ ...newOrder, items: updatedItems });
    }
  };

  const calculateTotal = () => {
    return newOrder.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalAmount = calculateTotal();
      const formattedItems = newOrder.items.map(item => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity),
        total: Number(item.price) * Number(item.quantity),
      }));

      const payload = {
        supplier_id: Number(newOrder.supplier_id),
        total_amount: totalAmount,
        notes: newOrder.notes,
        invoice_number: newOrder.invoice_number,
        order_date: newOrder.date,
        items: formattedItems,
      };

      if (editingOrder) {
        await api.fetchWithAuth(`/purchases/orders/${editingOrder.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('تم تحديث أمر الشراء بنجاح');
      } else {
        await api.fetchWithAuth('/purchases/orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('تم حفظ أمر الشراء بنجاح');
      }

      setShowModal(false);
      setEditingOrder(null);
      setNewOrder({
        supplier_id: '', date: new Date().toISOString().split('T')[0],
        invoice_number: '', notes: '', items: [],
      });
      loadData();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('حدث خطأ أثناء حفظ الأمر. تأكد من ملء جميع البيانات.');
    }
  };

  const handleEditOrder = async (order: Order) => {
    try {
      const items = await api.fetchWithAuth(`/purchases/orders/${order.id}/items`);
      setEditingOrder(order);
      setNewOrder({
        supplier_id: order.supplier_id.toString(),
        date: order.order_date
          ? new Date(order.order_date).toISOString().split('T')[0]
          : new Date(order.created_at).toISOString().split('T')[0],
        invoice_number: order.invoice_number || '',
        notes: order.notes || '',
        items: items.map((item: OrderItem) => ({
          product_id: item.product_id.toString(),
          quantity: item.quantity,
          price: item.price,
          weight_kg: item.weight_kg != null ? String(item.weight_kg) : undefined,
        })),
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('حدث خطأ أثناء تحميل بيانات الأمر');
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    toast.custom((t) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-4">
          هل أنت متأكد من حذف أمر الشراء رقم {order.id}؟ سيتم عكس جميع الحركات المخزنية.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-4 py-2 bg-gray-500/20 text-gray-200 rounded-lg hover:bg-gray-500/30 transition"
          >
            إلغاء
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                await api.fetchWithAuth(`/purchases/orders/${order.id}`, { method: 'DELETE' });
                await api.createNotification({
                  title: 'طلب حذف أمر شراء',
                  message: `تم طلب حذف أمر الشراء رقم ${order.id} بمبلغ ${order.total_amount} جنيه`,
                });
                toast.success('تم حذف أمر الشراء بنجاح');
                loadData();
              } catch (error) {
                console.error('Error deleting order:', error);
                toast.error('حدث خطأ أثناء حذف الأمر');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            حذف
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;
    try {
      await api.fetchWithAuth(`/purchases/suppliers/${selectedOrderForPayment.supplier_id}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
      toast.success('تم تسجيل الدفعة بنجاح');
      setShowPaymentModal(false);
      setSelectedOrderForPayment(null);
      setPaymentData({
        amount: 0, payment_date: new Date().toISOString().split('T')[0], notes: '',
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  const openPaymentModal = (order: Order) => {
    setSelectedOrderForPayment(order);
    setPaymentData({
      ...paymentData,
      amount: Number(order.total_amount),
      notes: `سداد عن أمر شراء رقم ${order.id}${order.invoice_number ? ' - فاتورة رقم ' + order.invoice_number : ''}`,
    });
    setShowPaymentModal(true);
  };

  const openPackingList = async (order: Order) => {
    setPackingListOrderId(order.id);
    setPackingListForm({
      carton_length_cm: '', carton_width_cm: '', carton_height_cm: '',
      cartons_count: '1', actual_net_weight_kg: '', actual_gross_weight_kg: '',
      deviation_threshold_percent: '5', notes: '',
    });
    setPackingListResult(null);
    try {
      const data = await api.getPackingList(order.id);
      if (data) {
        setPackingListForm({
          carton_length_cm: String(data.carton_length_cm || ''),
          carton_width_cm: String(data.carton_width_cm || ''),
          carton_height_cm: String(data.carton_height_cm || ''),
          cartons_count: String(data.cartons_count || '1'),
          actual_net_weight_kg: String(data.actual_net_weight_kg || ''),
          actual_gross_weight_kg: String(data.actual_gross_weight_kg || ''),
          deviation_threshold_percent: String(data.deviation_threshold_percent || '5'),
          notes: data.notes || '',
        });
      }
    } catch (e) {
      console.error('Failed to load packing list:', e);
    }
    setShowPackingListModal(true);
  };

  const handleSavePackingList = async () => {
    if (!packingListOrderId) return;
    setSavingPackingList(true);
    try {
      const result = await api.savePackingList(packingListOrderId, {
        carton_length_cm: Number(packingListForm.carton_length_cm),
        carton_width_cm: Number(packingListForm.carton_width_cm),
        carton_height_cm: Number(packingListForm.carton_height_cm),
        cartons_count: Number(packingListForm.cartons_count),
        actual_net_weight_kg: packingListForm.actual_net_weight_kg
          ? Number(packingListForm.actual_net_weight_kg) : undefined,
        actual_gross_weight_kg: packingListForm.actual_gross_weight_kg
          ? Number(packingListForm.actual_gross_weight_kg) : undefined,
        deviation_threshold_percent: Number(packingListForm.deviation_threshold_percent),
        notes: packingListForm.notes || undefined,
      });
      setPackingListResult(result);
    } catch (error) {
      console.error('Failed to save packing list:', error);
    } finally {
      setSavingPackingList(false);
    }
  };

  const openLandedCost = async (order: Order) => {
    setLandedCostOrderId(order.id);
    setLandedCostForm({
      freight_cost: 0, customs_percent: 0, commission_percent: 0, total_weight_kg: 0,
    });
    setLandedCostData(null);
    try {
      const data = await api.getLandedCost(order.id);
      setLandedCostData(data);
      setLandedCostForm({
        freight_cost: data.freight_cost || 0,
        customs_percent: data.customs_percent || 0,
        commission_percent: data.commission_percent || 0,
        total_weight_kg: data.total_weight_kg || 0,
      });
    } catch (e) {
      console.error('Failed to load landed cost:', e);
    }
    setShowLandedCostModal(true);
  };

  const handleUpdateLandedCost = async () => {
    if (!landedCostOrderId) return;
    setCalculatingLandedCost(true);
    try {
      const result = await api.updateLandedCost(landedCostOrderId, landedCostForm);
      setLandedCostData(result);
    } catch (error) {
      console.error('Failed to update landed cost:', error);
    } finally {
      setCalculatingLandedCost(false);
    }
  };

  const preparePrint = async (order: Order) => {
    try {
      const items = await api.fetchWithAuth(`/purchases/orders/${order.id}/items`);
      setOrderToPrint({ ...order, items });
    } catch (error) {
      console.error('Error fetching items for print:', error);
      toast.error('حدث خطأ أثناء تجهيز الطباعة');
    }
  };

  const handleQuickProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProduct = await api.fetchWithAuth('/inventory/products', {
        method: 'POST',
        body: JSON.stringify({
          name: quickProductData.name,
          unit: quickProductData.unit,
          type: 'RAW',
          cost_price: 0,
          selling_price: 0,
          weight_grams: quickProductData.weight_grams ? Number(quickProductData.weight_grams) : undefined,
        }),
      });

      const productsData = await api.fetchWithAuth('/inventory/products') as Product[];
      const sortedProducts = sortAlphabetically<Product>(productsData, 'name');
      setProducts(sortedProducts);

      if (activeItemIndex !== null) {
        handleItemChange(activeItemIndex, 'product_id', newProduct.id.toString());
      }

      setShowQuickProductModal(false);
      setQuickProductData({ name: '', unit: 'kg', weight_grams: '' });
      setActiveItemIndex(null);
    } catch (error) {
      console.error('Error creating quick product:', error);
      toast.error('حدث خطأ أثناء إضافة الصنف');
    }
  };

  const resetForm = () => {
    setEditingOrder(null);
    setNewOrder({
      supplier_id: '', date: new Date().toISOString().split('T')[0],
      invoice_number: '', notes: '', items: [],
    });
    setShowModal(false);
  };

  return {
    orders, suppliers, products, loading,
    showModal, editingOrder, newOrder,
    showPaymentModal, selectedOrderForPayment, paymentData,
    showQuickProductModal, quickProductData, activeItemIndex,
    showLandedCostModal, landedCostOrderId, landedCostData, landedCostForm,
    calculatingLandedCost,
    showPackingListModal, packingListOrderId, packingListForm, packingListResult,
    savingPackingList,
    lowStockProducts, showLowStockAlert,
    filters, totalPages, totalItems, typingValues, orderToPrint,
    componentRef, fileInputRef,

    setShowModal, setEditingOrder, setNewOrder,
    setShowPaymentModal, setSelectedOrderForPayment, setPaymentData,
    setShowQuickProductModal, setQuickProductData, setActiveItemIndex,
    setShowLandedCostModal, setLandedCostForm,
    setShowPackingListModal, setPackingListForm,
    setShowLowStockAlert, setFilters, setTypingValues,

    handleAddItem, handleRemoveItem, handleItemChange,
    handleItemTotalChange, handleTypedChange, calculateTotal,
    handleSubmit, handleEditOrder, handleDeleteOrder,
    handlePaymentSubmit, openPaymentModal,
    openPackingList, handleSavePackingList,
    openLandedCost, handleUpdateLandedCost,
    preparePrint, handleQuickProductSubmit,
    exportToExcel: () => exportToExcel(orders),
    handleExportItems: () => handleExportItems(editingOrder, newOrder.items, products),
    handleImportItems: (e: React.ChangeEvent<HTMLInputElement>) => handleImportItems(e, products, setNewOrder, fileInputRef),
    resetForm, loadData,
  };
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { SalesReturn, Customer, Order, ReturnItem, NewReturnForm } from '@/components/sales/returns/types';

const emptyForm = (): NewReturnForm => ({
  customer_id: '',
  order_id: '',
  reason: '',
  return_date: new Date().toISOString().split('T')[0],
  items: [],
});

export function useSalesReturns() {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newReturn, setNewReturn] = useState<NewReturnForm>(emptyForm());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [returnsData, customersData] = await Promise.all([
        api.fetchWithAuth('/sales/returns'),
        api.fetchWithAuth('/sales/customers'),
      ]);
      setReturns(returnsData || []);
      setCustomers(customersData || []);
    } catch (err) {
      console.error('Error loading returns data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = () => {
    setNewReturn(emptyForm());
    setOrders([]);
    setShowNewModal(true);
  };

  const handleCustomerChange = async (customerId: string) => {
    setNewReturn({ ...newReturn, customer_id: customerId, order_id: '', items: [] });
    if (customerId) {
      try {
        const ordersData = await api.fetchWithAuth(`/sales/orders?customer_id=${customerId}`);
        setOrders(ordersData.items || []);
      } catch (err) {
        console.error('Error loading customer orders:', err);
      }
    } else {
      setOrders([]);
    }
  };

  const handleOrderChange = async (orderId: string) => {
    setNewReturn({ ...newReturn, order_id: orderId, items: [] });
    if (orderId) {
      try {
        interface OrderItemRaw { product_id: number; product: { name: string }; quantity: number; price: number }
        const raw: OrderItemRaw[] = await api.fetchWithAuth(`/sales/orders/${orderId}/items`);
        setNewReturn(prev => ({
          ...prev,
          items: raw.map(it => ({
            product_id: it.product_id,
            name: it.product?.name ?? '',
            original_qty: it.quantity,
            quantity: 0,
            unit_price: it.price,
            total: 0,
          })),
        }));
      } catch (err) {
        console.error('Error loading order items:', err);
      }
    }
  };

  const updateItemQty = (index: number, qty: number) => {
    const items = [...newReturn.items];
    items[index].quantity = Math.min(qty, items[index].original_qty);
    items[index].total = items[index].quantity * items[index].unit_price;
    setNewReturn({ ...newReturn, items });
  };

  const calculateTotal = () => newReturn.items.reduce((sum, it) => sum + it.total, 0);

  const handleSubmit = async () => {
    if (!newReturn.customer_id || newReturn.items.filter(it => it.quantity > 0).length === 0) {
      toast.error('يرجى اختيار العميل وتحديد المنتجات المرتجعة');
      return;
    }
    try {
      const returnData = {
        ...newReturn,
        customer_id: +newReturn.customer_id,
        order_id: newReturn.order_id ? +newReturn.order_id : undefined,
        total_amount: calculateTotal(),
        items: newReturn.items.filter(it => it.quantity > 0),
      };
      await api.fetchWithAuth('/sales/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      });
      toast.success('تم تسجيل المرتجع بنجاح');
      setShowNewModal(false);
      loadData();
    } catch {
      toast.error('حدث خطأ أثناء حفظ المرتجع');
    }
  };

  return {
    returns, customers, orders, loading,
    showNewModal, setShowNewModal,
    newReturn, setNewReturn,
    openModal,
    handleCustomerChange, handleOrderChange,
    updateItemQty, calculateTotal, handleSubmit,
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Supplier, PurchaseOrder, ReturnItem, PurchaseReturn } from '@/components/purchases/returns/types';

export function usePurchaseReturns() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newReturn, setNewReturn] = useState({
    supplier_id: '',
    order_id: '',
    reason: '',
    return_date: new Date().toISOString().split('T')[0],
    items: [] as ReturnItem[],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [returnsData, suppliersData] = await Promise.all([
        api.fetchWithAuth('/purchases/returns'),
        api.fetchWithAuth('/purchases/suppliers'),
      ]);
      setReturns(returnsData || []);
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error loading returns data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSupplierChange = async (supplierId: string) => {
    setNewReturn({ ...newReturn, supplier_id: supplierId, order_id: '', items: [] });
    if (supplierId) {
      try {
        const ordersData = await api.fetchWithAuth(`/purchases/orders?supplier_id=${supplierId}`);
        setOrders(ordersData.items || []);
      } catch (error) {
        console.error('Error loading supplier orders:', error);
      }
    } else {
      setOrders([]);
    }
  };

  const handleOrderChange = async (orderId: string) => {
    setNewReturn({ ...newReturn, order_id: orderId, items: [] });
    if (orderId) {
      try {
        const items = await api.fetchWithAuth(`/purchases/orders/${orderId}/items`);
        setNewReturn(prev => ({
          ...prev,
          items: items.map((it: { product_id: number; product?: { name: string }; price: number; quantity: number }) => ({
            product_id: it.product_id,
            name: it.product?.name || 'صنف غير معروف',
            original_qty: it.quantity,
            quantity: 0,
            unit_price: it.price,
            total: 0,
          })),
        }));
      } catch (error) {
        console.error('Error loading order items:', error);
      }
    }
  };

  const updateItemQty = (index: number, qty: number) => {
    const items = [...newReturn.items];
    items[index].quantity = Math.min(qty, items[index].original_qty);
    items[index].total = items[index].quantity * items[index].unit_price;
    setNewReturn({ ...newReturn, items });
  };

  const calculateTotal = () => {
    return newReturn.items.reduce((sum, it) => sum + it.total, 0);
  };

  const handleSubmit = async () => {
    if (!newReturn.supplier_id || newReturn.items.filter(it => it.quantity > 0).length === 0) {
      toast.error('يرجى اختيار المورد وتحديد المنتجات المرتجعة');
      return;
    }
    try {
      const returnData = {
        ...newReturn,
        supplier_id: +newReturn.supplier_id,
        order_id: newReturn.order_id ? +newReturn.order_id : undefined,
        total_amount: calculateTotal(),
        items: newReturn.items.filter(it => it.quantity > 0),
      };
      await api.fetchWithAuth('/purchases/returns', {
        method: 'POST',
        body: JSON.stringify(returnData),
      });
      setShowNewModal(false);
      toast.success('تم تسجيل المرتجع بنجاح');
      loadData();
    } catch {
      toast.error('فشل حفظ المرتجع');
    }
  };

  return {
    returns, suppliers, orders, loading, showNewModal, setShowNewModal,
    newReturn, setNewReturn,
    handleSupplierChange, handleOrderChange, updateItemQty, calculateTotal, handleSubmit,
  };
}

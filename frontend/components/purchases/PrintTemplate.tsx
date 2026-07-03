'use client';

import React from 'react';
import type { Order, OrderItem } from '@/components/purchases/types';

interface PrintTemplateProps {
  order: Order | null;
  componentRef: React.RefObject<HTMLDivElement | null>;
}

export default function PrintTemplate({ order, componentRef }: PrintTemplateProps) {
  return (
    <div style={{ display: 'none' }}>
      <div ref={componentRef} className="p-8 bg-white text-black" dir="rtl">
        {order && (
          <div>
            <div className="text-center mb-8 border-b pb-4">
              <h1 className="text-3xl font-bold mb-2">أمر شراء</h1>
              <p className="text-gray-600">رقم: #{order.id}</p>
              {order.invoice_number && <p className="text-gray-600">مرجع المورد: {order.invoice_number}</p>}
              <p className="text-gray-600">
                التاريخ: {new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG')}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">بيانات المورد:</h3>
              <p>الاسم: {order.supplier?.name}</p>
              <p>الهاتف: {order.supplier?.phone || '-'}</p>
              <p>العنوان: {order.supplier?.address || '-'}</p>
            </div>

            <table className="w-full border-collapse border border-gray-300 mb-8">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 p-2 text-right">م</th>
                  <th className="border border-gray-300 p-2 text-right">الصنف</th>
                  <th className="border border-gray-300 p-2 text-center">الكمية</th>
                  <th className="border border-gray-300 p-2 text-center">السعر</th>
                  <th className="border border-gray-300 p-2 text-center">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: OrderItem, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                    <td className="border border-gray-300 p-2">{item.product?.name || item.product_id}</td>
                    <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                    <td className="border border-gray-300 p-2 text-center">{Number(item.price).toLocaleString()}</td>
                    <td className="border border-gray-300 p-2 text-center">{Number(item.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="border border-gray-300 p-2 text-left font-bold">الإجمالي</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">
                    {Number(order.total_amount).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-12 pt-8 border-t flex justify-between">
              <div>
                <p className="font-bold mb-2">توقيع المستلم</p>
                <p>..................</p>
              </div>
              <div>
                <p className="font-bold mb-2">توقيع المدير</p>
                <p>..................</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

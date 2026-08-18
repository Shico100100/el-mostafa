import type { Order, NewOrderItem, Product } from '@/components/purchases/types';
import { toast } from 'sonner';

export const exportToExcel = async (orders: Order[]) => {
  const ExcelJS = await import('exceljs');
  const exportData = orders.map(order => ({
    'رقم الأمر': order.id,
    'رقم الفاتورة': order.invoice_number || '-',
    'التاريخ': new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG'),
    'المورد': order.supplier?.name || 'غير معروف',
    'الإجمالي': Number(order.total_amount),
    'ملاحظات': order.notes || '',
  }));

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Purchase Orders');
  const headers = Object.keys(exportData[0] || {});
  worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
  worksheet.addRows(exportData);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Purchase_Orders_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const handleExportItems = async (
  editingOrder: Order | null,
  newOrderItems: NewOrderItem[],
  products: Product[]
) => {
  const ExcelJS = await import('exceljs');
  const exportData = newOrderItems.map(item => {
    const product = products.find(p => p.id === Number(item.product_id));
    const hasWeight = product?.weight_grams && Number(product.weight_grams) > 0;
    return {
      'المنتج': product?.name || 'غير معروف',
      'الوزن (كجم)': hasWeight && item.weight_kg ? Number(item.weight_kg) : '',
      'الكمية': Number(item.quantity),
      'سعر الوحدة': Number(item.price),
      'الإجمالي': Number(item.quantity) * Number(item.price),
    };
  });
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('الأصناف');
  const headers = Object.keys(exportData[0] || {});
  worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
  worksheet.addRows(exportData);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const label = editingOrder ? `تعديل_أمر_${editingOrder.id}` : 'أمر_شراء_جديد';
  a.download = `${label}_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const handleImportItems = (
  e: React.ChangeEvent<HTMLInputElement>,
  products: Product[],
  setNewOrder: React.Dispatch<React.SetStateAction<{
    supplier_id: string;
    date: string;
    invoice_number: string;
    notes: string;
    items: NewOrderItem[];
  }>>,
  fileInputRef: React.RefObject<HTMLInputElement | null>
) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const ExcelJS = await import('exceljs');
      const data = evt.target?.result as ArrayBuffer;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      const worksheet = workbook.worksheets[0];

      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell((cell) => {
        headers.push(String(cell.value || ''));
      });

      const rows: Record<string, string>[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj: Record<string, string> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) obj[header] = String(cell.value ?? '');
        });
        rows.push(obj);
      });

      const imported: NewOrderItem[] = rows.map(row => {
        const name = (row['المنتج'] || row['product'] || '').trim();
        const product = products.find(p => p.name.trim() === name);
        const weightKg = row['الوزن (كجم)'] ? Number(row['الوزن (كجم)']) : 0;
        const hasWeight = product?.weight_grams && Number(product.weight_grams) > 0;
        let quantity = Number(row['الكمية'] || row['quantity'] || 1);
        if (weightKg > 0 && hasWeight) {
          quantity = Math.round((weightKg * 1000) / Number(product!.weight_grams));
        }
        return {
          product_id: product ? String(product.id) : '',
          weight_kg: weightKg > 0 ? String(weightKg) : undefined,
          quantity,
          price: Number(row['سعر الوحدة'] || row['price'] || 0),
        };
      }).filter(item => item.product_id);
      if (imported.length > 0) {
        setNewOrder(prev => ({ ...prev, items: imported }));
      } else {
        toast.error('لم يتم العثور على منتجات مطابقة في الملف');
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error('حدث خطأ أثناء استيراد الملف');
    }
  };
  reader.readAsArrayBuffer(file);
  if (fileInputRef.current) fileInputRef.current.value = '';
};
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import * as ExcelJS from 'exceljs';
import type { ReportData, AnalyticsData, ShipmentProfit, TabId, Sale, Purchase, ProductReportItem } from '@/components/reports/types';

export function useReports() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('SALES');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({ inventory: [], sales: [] });
  const [shipmentProfit, setShipmentProfit] = useState<{ shipments: ShipmentProfit[]; summary: Record<string, unknown> } | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      let result: ReportData | null = null;
      switch (activeTab) {
        case 'SALES':
          result = await api.getSalesReport({ startDate, endDate });
          break;
        case 'PURCHASES':
          result = await api.getPurchaseOrders();
          break;
        case 'STOCK':
          result = await api.getStockReport();
          break;
        case 'PROFIT_LOSS':
          result = await api.getProfitLossReport({ startDate, endDate });
          break;
        case 'ANALYTICS':
          const [inventory, sales] = await Promise.all([
            api.getInventoryValueReport(),
            api.getSalesByCategoryReport({ startDate, endDate })
          ]);
          setAnalytics({ inventory: inventory || [], sales: sales || [] });
          break;
        case 'SHIPMENT_PROFIT':
          const sp = await api.getShipmentProfitability(startDate, endDate);
          setShipmentProfit(sp || []);
          break;
      }
      setData((result as ReportData) || null);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadReport();
  }, [router, loadReport]);

  const exportToExcel = async () => {
    if (!data && activeTab !== 'ANALYTICS' && activeTab !== 'SHIPMENT_PROFIT') return;

    let exportData: Array<Record<string, string | number | undefined>> = [];
    let fileName = `Report_${activeTab}_${startDate}_to_${endDate}.xlsx`;

    switch (activeTab) {
      case 'SALES':
        exportData = (data?.sales || []).map((s: Sale) => ({
          'التاريخ': new Date(s.order_date || s.created_at).toLocaleDateString('ar-EG'),
          'العميل': s.customer?.name,
          'المبلغ': Number(s.total_amount),
          'الحالة': s.status
        }));
        break;
      case 'PURCHASES':
        exportData = (data?.purchases || []).map((p: Purchase) => ({
          'التاريخ': new Date(p.order_date || p.created_at).toLocaleDateString('ar-EG'),
          'المورد': p.supplier?.name,
          'المبلغ': Number(p.total_amount),
          'الحالة': p.status
        }));
        break;
      case 'STOCK':
        exportData = (data?.allProducts || []).map((p: ProductReportItem) => ({
          'المنتج': p.name,
          'الكمية الحالية': p.quantity,
          'الوحدة': p.unit,
          'التصنيف': p.type,
          'سعر البيع': p.selling_price,
          'تكلفة الوحدة': p.cost_price,
          'إجمالي القيمة': Number(p.quantity) * Number(p.selling_price)
        }));
        fileName = `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        break;
      case 'PROFIT_LOSS':
        if (data) {
          exportData = [
            { 'البند': 'إجمالي الإيرادات', 'القيمة': data.totalSales },
            { 'البند': 'تكلفة البضاعة المباعة (COGS)', 'القيمة': data.totalCOGS },
            { 'البند': 'إجمالي الربح', 'القيمة': data.grossProfit },
            { 'البند': 'المصاريف التشغيلية', 'القيمة': data.totalFixedCosts },
            { 'البند': 'صافي الربح', 'القيمة': data.netProfit },
          ];
        }
        break;
      case 'ANALYTICS':
        exportData = analytics.sales.map((s) => ({ 'القسم': s.name, 'المبيعات': s.value }));
        break;
      case 'SHIPMENT_PROFIT':
        if (shipmentProfit) {
          exportData = shipmentProfit.shipments.map((s) => ({
            'الشحنة #': s.purchase_order_id,
            'المورد': s.supplier_name,
            'التاريخ': s.order_date ? new Date(s.order_date).toLocaleDateString('ar-EG') : '',
            'إيرادات': s.sales_revenue,
            'تكلفة البضاعة': s.total_cogs,
            'التكلفة الإجمالية': s.total_landed_cost,
            'الربح الإجمالي': s.gross_profit,
            'صافي الربح': s.net_profit,
            'هامش الربح %': s.margin_percent,
          }));
        }
        break;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(activeTab);
    const headers = exportData.length > 0 ? Object.keys(exportData[0]) : [];
    worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
    worksheet.addRows(exportData);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return {
    activeTab, setActiveTab, loading, startDate, setStartDate, endDate, setEndDate,
    data, analytics, shipmentProfit, loadReport, exportToExcel,
  };
}

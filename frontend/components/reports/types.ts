export interface Sale {
  id: number;
  order_date?: string;
  created_at: string;
  customer?: { name: string };
  total_amount: number;
  status: string;
  items: { quantity: number; product: { cost_price: number } }[];
}

export interface Purchase {
  id: number;
  order_date?: string;
  created_at: string;
  supplier?: { name: string };
  total_amount: number;
  status: string;
}

export interface ProductReportItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  type: string;
  selling_price: number;
  cost_price: number;
  min_stock: number;
}

export interface ReportData {
  sales?: Sale[];
  purchases?: Purchase[];
  allProducts?: ProductReportItem[];
  totalSales?: number;
  salesCount?: number;
  totalPurchases?: number;
  purchasesCount?: number;
  totalValue?: number;
  productCount?: number;
  lowStockItems?: ProductReportItem[];
  totalCOGS?: number;
  grossProfit?: number;
  totalFixedCosts?: number;
  netProfit?: number;
}

export interface AnalyticsData {
  inventory: { name: string; value: number }[];
  sales: { name: string; value: number }[];
}

export interface ShipmentProfitItem {
  product_id: number;
  product_name: string;
  quantity_purchased: number;
  quantity_sold: number;
  unit_cost: number;
  total_cogs: number;
  landed_cost_allocated: number;
  revenue: number;
  profit: number;
  margin_percent: number;
}

export interface ShipmentProfit {
  purchase_order_id: number;
  supplier_name: string;
  order_date: string;
  total_amount: number;
  total_landed_cost: number;
  exchange_rate: number;
  total_weight_kg: number;
  total_items_purchased: number;
  total_items_sold: number;
  scrap_qty: number;
  sales_revenue: number;
  total_cogs: number;
  gross_profit: number;
  net_profit: number;
  margin_percent: number;
  items: ShipmentProfitItem[];
}

export type TabId = 'SALES' | 'PURCHASES' | 'STOCK' | 'PROFIT_LOSS' | 'ANALYTICS' | 'SHIPMENT_PROFIT';

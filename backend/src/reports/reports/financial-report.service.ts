import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class FinancialReportService {
  constructor(private readonly dataSource: DataSource) {}

  async getSalesReport(
    startDate: string,
    endDate: string,
    page?: number,
    limit?: number,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const summary = await this.dataSource.query(
      `SELECT COALESCE(SUM(so.total_amount), 0) AS total_sales,
              COUNT(*) AS sales_count
       FROM sales_orders so
       WHERE so.order_date BETWEEN $1 AND $2`,
      [start, end],
    );

    const effectiveLimit = limit && limit > 0 ? Math.min(limit, 500) : 0;
    const effectivePage = page && page > 0 ? page : 1;
    const offset =
      effectiveLimit > 0 ? (effectivePage - 1) * effectiveLimit : 0;

    const sales = await this.dataSource.query(
      `SELECT so.id, so.order_date, so.created_at, so.total_amount, so.status,
              c.name AS customer_name
       FROM sales_orders so
       LEFT JOIN customers c ON c.id = so.customer_id
       WHERE so.order_date BETWEEN $1 AND $2
       ORDER BY so.order_date ASC${effectiveLimit > 0 ? ` LIMIT ${effectiveLimit} OFFSET ${offset}` : ''}`,
      [start, end],
    );

    return {
      totalSales: Number(summary[0]?.total_sales) || 0,
      salesCount: Number(summary[0]?.sales_count) || 0,
      sales: sales.map((row: any) => ({
        id: row.id,
        order_date: row.order_date,
        created_at: row.created_at,
        total_amount: Number(row.total_amount),
        status: row.status,
        customer: row.customer_name ? { name: row.customer_name } : undefined,
        items: [],
      })),
      page: effectivePage,
      limit: effectiveLimit,
      totalPages:
        effectiveLimit > 0
          ? Math.max(
              1,
              Math.ceil(
                (Number(summary[0]?.sales_count) || 0) / effectiveLimit,
              ),
            )
          : 1,
    };
  }

  async getPurchasesReport(
    startDate: string,
    endDate: string,
    page?: number,
    limit?: number,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const summary = await this.dataSource.query(
      `SELECT COALESCE(SUM(po.total_amount), 0) AS total_purchases,
              COUNT(*) AS purchases_count
       FROM purchase_orders po
       WHERE po.order_date BETWEEN $1 AND $2`,
      [start, end],
    );

    const effectiveLimit = limit && limit > 0 ? Math.min(limit, 500) : 0;
    const effectivePage = page && page > 0 ? page : 1;
    const offset =
      effectiveLimit > 0 ? (effectivePage - 1) * effectiveLimit : 0;

    const purchases = await this.dataSource.query(
      `SELECT po.id, po.order_date, po.created_at, po.total_amount, po.status,
              s.name AS supplier_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       WHERE po.order_date BETWEEN $1 AND $2
       ORDER BY po.order_date ASC${effectiveLimit > 0 ? ` LIMIT ${effectiveLimit} OFFSET ${offset}` : ''}`,
      [start, end],
    );

    return {
      totalPurchases: Number(summary[0]?.total_purchases) || 0,
      purchasesCount: Number(summary[0]?.purchases_count) || 0,
      purchases: purchases.map((row: any) => ({
        id: row.id,
        order_date: row.order_date,
        created_at: row.created_at,
        total_amount: Number(row.total_amount),
        status: row.status,
        supplier: row.supplier_name ? { name: row.supplier_name } : undefined,
      })),
      page: effectivePage,
      limit: effectiveLimit,
      totalPages:
        effectiveLimit > 0
          ? Math.max(
              1,
              Math.ceil(
                (Number(summary[0]?.purchases_count) || 0) / effectiveLimit,
              ),
            )
          : 1,
    };
  }

  async getProfitLossReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const endMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;

    const summary = await this.dataSource.query(
      `SELECT
        COALESCE(SUM(so.total_amount), 0) AS total_sales,
        COALESCE((
          SELECT SUM(soi.quantity * COALESCE(p.cost_price, 0))
          FROM sales_order_items soi
          JOIN sales_orders so2 ON so2.id = soi.order_id
          LEFT JOIN products p ON p.id = soi.product_id
          WHERE so2.order_date BETWEEN $1 AND $2
        ), 0) AS total_cogs,
        (SELECT COUNT(*) FROM sales_orders so3 WHERE so3.order_date BETWEEN $1 AND $2) AS sales_count
       FROM sales_orders so
       WHERE so.order_date BETWEEN $1 AND $2`,
      [start, end],
    );

    const purchases = await this.dataSource.query(
      `SELECT COALESCE(SUM(po.total_amount), 0) AS total_purchases,
              COUNT(*) AS purchases_count
       FROM purchase_orders po
       WHERE po.order_date BETWEEN $1 AND $2`,
      [start, end],
    );

    const fixedCosts = await this.dataSource.query(
      `SELECT COALESCE(SUM(fc.amount), 0) AS total_fixed_costs
       FROM fixed_costs fc
       WHERE fc.month BETWEEN $1 AND $2`,
      [startMonth, endMonth],
    );

    const saleItems = await this.dataSource.query(
      `SELECT soi.order_id, soi.quantity, COALESCE(p.cost_price, 0) AS cost_price
       FROM sales_order_items soi
       JOIN sales_orders so ON so.id = soi.order_id
       LEFT JOIN products p ON p.id = soi.product_id
       WHERE so.order_date BETWEEN $1 AND $2
       ORDER BY soi.order_id`,
      [start, end],
    );

    const itemsByOrder = new Map<
      number,
      Array<{ quantity: number; product: { cost_price: number } }>
    >();
    for (const item of saleItems) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id)!.push({
        quantity: Number(item.quantity),
        product: { cost_price: Number(item.cost_price) },
      });
    }

    const sales = await this.dataSource.query(
      `SELECT so.id, so.order_date, so.created_at, so.total_amount, so.status,
              c.name AS customer_name
       FROM sales_orders so
       LEFT JOIN customers c ON c.id = so.customer_id
       WHERE so.order_date BETWEEN $1 AND $2
       ORDER BY so.order_date ASC`,
      [start, end],
    );

    const totalSales = Number(summary[0]?.total_sales) || 0;
    const totalCOGS = Number(summary[0]?.total_cogs) || 0;
    const totalFixedCosts = Number(fixedCosts[0]?.total_fixed_costs) || 0;
    const totalPurchases = Number(purchases[0]?.total_purchases) || 0;
    const salesCount = Number(summary[0]?.sales_count) || 0;
    const purchasesCount = Number(purchases[0]?.purchases_count) || 0;

    const grossProfit = totalSales - totalCOGS;
    const totalExpenses = totalCOGS + totalFixedCosts;
    const netProfit = totalSales - totalExpenses;

    return {
      totalSales,
      totalCOGS,
      grossProfit,
      totalFixedCosts,
      totalPurchases,
      totalExpenses,
      netProfit,
      salesCount,
      purchasesCount,
      sales: sales.map((row: any) => ({
        id: row.id,
        order_date: row.order_date,
        created_at: row.created_at,
        total_amount: Number(row.total_amount),
        status: row.status,
        customer: row.customer_name ? { name: row.customer_name } : undefined,
        items: itemsByOrder.get(row.id) || [],
      })),
    };
  }

  async getDashboardTrends() {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      );
    }

    const firstMonth = `${months[0]}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toISOString()
      .slice(0, 10);

    const [sales, purchases, production] = await Promise.all([
      this.dataSource.query(
        `SELECT TO_CHAR(date_trunc('month', so.order_date), 'YYYY-MM') AS month,
                COALESCE(SUM(so.total_amount), 0) AS total
         FROM sales_orders so
         WHERE so.order_date >= $1 AND so.order_date < $2
         GROUP BY 1`,
        [firstMonth, nextMonth],
      ),
      this.dataSource.query(
        `SELECT TO_CHAR(date_trunc('month', po.order_date), 'YYYY-MM') AS month,
                COALESCE(SUM(po.total_amount), 0) AS total
         FROM purchase_orders po
         WHERE po.order_date >= $1 AND po.order_date < $2
         GROUP BY 1`,
        [firstMonth, nextMonth],
      ),
      this.dataSource.query(
        `SELECT TO_CHAR(date_trunc('month', dp.date), 'YYYY-MM') AS month,
                COALESCE(SUM(dp.pieces_produced), 0) AS total
         FROM daily_production dp
         WHERE dp.date >= $1 AND dp.date < $2
         GROUP BY 1`,
        [firstMonth, nextMonth],
      ),
    ]);

    const toMap = (rows: Array<{ month: string; total: string }>) =>
      new Map(rows.map((r) => [r.month, Number(r.total) || 0]));
    const salesMap = toMap(sales);
    const purchasesMap = toMap(purchases);
    const productionMap = toMap(production);

    return months.map((month) => ({
      month,
      sales: salesMap.get(month) || 0,
      purchases: purchasesMap.get(month) || 0,
      production: productionMap.get(month) || 0,
    }));
  }
}

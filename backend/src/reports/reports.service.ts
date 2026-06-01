import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { FixedCost } from '../manufacturing/entities/fixed-cost.entity';
import { DailyProduction } from '../manufacturing/entities/daily-production.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(FixedCost)
    private fixedCostRepo: Repository<FixedCost>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async getSalesReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const sales = await this.salesOrderRepo.find({
      where: {
        order_date: Between(start, end),
      },
      relations: ['items', 'items.product'],
      order: { order_date: 'ASC' },
    });

    let totalSales = 0;
    sales.forEach((sale) => {
      totalSales += Number(sale.total_amount);
    });

    return {
      totalSales,
      salesCount: sales.length,
      sales,
    };
  }

  async getPurchasesReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const purchases = await this.purchaseOrderRepo.find({
      where: {
        order_date: Between(start, end),
      },
      relations: ['items', 'items.product'],
      order: { order_date: 'ASC' },
    });

    let totalPurchases = 0;
    purchases.forEach((purchase) => {
      totalPurchases += Number(purchase.total_amount);
    });

    return {
      totalPurchases,
      purchasesCount: purchases.length,
      purchases,
    };
  }

  async getStockReport() {
    try {
      const products = await this.productRepo.find();
      const stocks = await this.stockRepo.find();

      const productsWithStock = products.map((product) => {
        const productStocks = stocks.filter((s) => s.product_id === product.id);
        const totalQuantity = productStocks.reduce(
          (sum, s) => sum + Number(s.quantity),
          0,
        );
        return {
          ...product,
          quantity: totalQuantity,
        };
      });

      const totalValue = productsWithStock.reduce(
        (sum, p) => sum + Number(p.quantity) * Number(p.selling_price),
        0,
      );

      const lowStockItems = productsWithStock.filter((p) => {
        const qty = Number(p.quantity);
        const min = Number(p.min_stock || 0);
        return qty <= min;
      });

      if (lowStockItems.length > 0) {
        await this.notificationsService.create(
          'تنبيه نقص مخزون',
          `يوجد ${lowStockItems.length} منتجات وصلت للحد الأدنى للمخزون.`,
        );
      }

      return {
        totalValue,
        productCount: products.length,
        lowStockItems,
        allProducts: productsWithStock,
      };
    } catch (error) {
      console.error('Error in getStockReport:', error);
      throw error;
    }
  }

  async getProfitLossReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Calculate Total Sales and COGS
    const sales = await this.salesOrderRepo.find({
      where: { order_date: Between(start, end) },
      relations: ['items', 'items.product'],
    });

    let totalSales = 0;
    let totalCOGS = 0;

    sales.forEach((order) => {
      totalSales += Number(order.total_amount);
      order.items.forEach((item) => {
        totalCOGS +=
          Number(item.quantity) * Number(item.product.cost_price || 0);
      });
    });

    // 2. Calculate Total Purchases (for reference/cashflow)
    const purchases = await this.purchaseOrderRepo.find({
      where: { order_date: Between(start, end) },
    });
    const totalPurchases = purchases.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );

    // 3. Calculate Operating Expenses (Fixed Costs)
    // We match by month in the format YYYY-MM
    const startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const endMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;

    const fixedCosts = await this.fixedCostRepo.find({
      where: {
        month: Between(startMonth, endMonth),
      },
    });
    const totalFixedCosts = fixedCosts.reduce(
      (sum, cost) => sum + Number(cost.amount),
      0,
    );

    // 4. Detailed Financial Metrics
    const grossProfit = totalSales - totalCOGS;
    const totalExpenses = totalCOGS + totalFixedCosts;
    const netProfit = totalSales - totalExpenses;

    return {
      totalSales,
      totalCOGS,
      grossProfit,
      totalFixedCosts,
      totalPurchases, // Added for context
      totalExpenses,
      netProfit,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      sales, // Include detailed sales for breakdown
    };
  }

  async getInventoryValueByCategory() {
    const stocks = await this.stockRepo.find({
      relations: ['product', 'product.category'],
    });
    const data = stocks.reduce((acc, stock) => {
      const categoryName = stock.product?.category?.name || 'غير محدد';
      const value =
        Number(stock.quantity) * Number(stock.product?.cost_price || 0);
      acc[categoryName] = (acc[categoryName] || 0) + value;
      return acc;
    }, {});

    return Object.keys(data).map((name) => ({
      name,
      value: Math.round(data[name] * 100) / 100,
    }));
  }

  async getSalesByCategory(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const sales = await this.salesOrderRepo.find({
      where: { order_date: Between(start, end) },
      relations: ['items', 'items.product', 'items.product.category'],
    });

    const data = sales.reduce((acc, order) => {
      order.items.forEach((item) => {
        const categoryName = item.product?.category?.name || 'غير محدد';
        const amount = Number(item.total);
        acc[categoryName] = (acc[categoryName] || 0) + amount;
      });
      return acc;
    }, {});

    return Object.keys(data).map((name) => ({
      name,
      value: Math.round(data[name] * 100) / 100,
    }));
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

    const trends = await Promise.all(
      months.map(async (month) => {
        const [year, m] = month.split('-').map(Number);
        const start = new Date(year, m - 1, 1);
        const end = new Date(year, m, 0, 23, 59, 59, 999);

        // Sales
        const sales = await this.salesOrderRepo.find({
          where: { order_date: Between(start, end) },
        });
        const totalSales = sales.reduce(
          (sum, o) => sum + Number(o.total_amount),
          0,
        );

        // Purchases
        const purchases = await this.purchaseOrderRepo.find({
          where: { order_date: Between(start, end) },
        });
        const totalPurchases = purchases.reduce(
          (sum, o) => sum + Number(o.total_amount),
          0,
        );

        // Production (Pieces)
        const formations = await this.productionRepo.find({
          where: { date: Between(start, end) },
        });
        const totalProduction = formations.reduce(
          (sum, p) => sum + Number(p.pieces_produced || 0),
          0,
        );

        return {
          month,
          sales: totalSales,
          purchases: totalPurchases,
          production: totalProduction,
        };
      }),
    );

    return trends;
  }

  async getShipmentProfitability(startDate?: string, endDate?: string) {
    const shipments = await this.purchaseOrderRepo.find({
      where: startDate && endDate
        ? { order_date: Between(new Date(startDate), new Date(endDate)) }
        : {},
      relations: ['items', 'items.product', 'supplier'],
    });

    const result = await Promise.all(
      shipments.map(async (po) => {
        const landedCost = Number(po.total_landed_cost) || Number(po.total_amount) || 0;
        const exchangeRate = Number(po.exchange_rate) || 1;
        const totalWeight = Number(po.total_weight_kg) || 0;

        // Find sales of same products
        const productIds = po.items.map((i) => i.product_id);
        let soldQty = 0;
        let salesRevenue = 0;
        let totalCOGS = 0;
        let scrapQty = 0;

        if (productIds.length > 0) {
          const salesResult = await this.dataSource.query(
            `SELECT
              soi.product_id,
              SUM(soi.quantity) AS total_sold_qty,
              SUM(soi.total) AS total_revenue,
              p.cost_price,
              p.name
            FROM sales_order_items soi
            JOIN products p ON p.id = soi.product_id
            WHERE soi.product_id IN (${productIds.join(',')})
            GROUP BY soi.product_id, p.cost_price, p.name`,
          );

          for (const row of salesResult) {
            const qty = Number(row.total_sold_qty) || 0;
            soldQty += qty;
            salesRevenue += Number(row.total_revenue) || 0;
            totalCOGS += (Number(row.cost_price) || 0) * qty;
          }
        }

        // Scrap from daily production during period
        if (startDate && endDate) {
          const scrapResult = await this.dataSource.query(
            `SELECT COALESCE(SUM(pieces_defective), 0) AS scrap
             FROM daily_production
             WHERE date BETWEEN $1 AND $2`,
            [startDate, endDate],
          );
          scrapQty = Number(scrapResult[0]?.scrap || 0);
        }

        // Allocate landed cost per item proportionally
        const poTotalQty = po.items.reduce((s, i) => s + Number(i.quantity), 0);
        const landedCostPerUnit = poTotalQty > 0 ? landedCost / poTotalQty : 0;
        const totalLandedOnSold = landedCostPerUnit * soldQty;

        const grossProfit = salesRevenue - totalCOGS;
        const netProfit = salesRevenue - (totalCOGS + totalLandedOnSold);
        const margin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0;

        // Item-level margin breakdown
        const itemMargins = await Promise.all(
          po.items.map(async (item) => {
            const itemSold = await this.dataSource.query(
              `SELECT COALESCE(SUM(quantity), 0) AS qty, COALESCE(SUM(total), 0) AS revenue
               FROM sales_order_items WHERE product_id = $1`,
              [item.product_id],
            );
            const sq = Number(itemSold[0]?.qty || 0);
            const rev = Number(itemSold[0]?.revenue || 0);
            const cogs = (Number(item.product?.cost_price) || 0) * sq;
            const landed = landedCostPerUnit * sq;
            return {
              product_id: item.product_id,
              product_name: item.product?.name || '',
              quantity_purchased: Number(item.quantity),
              quantity_sold: sq,
              unit_cost: Number(item.product?.cost_price) || 0,
              total_cogs: cogs,
              landed_cost_allocated: landed,
              revenue: rev,
              profit: rev - cogs - landed,
              margin_percent: rev > 0 ? ((rev - cogs - landed) / rev) * 100 : 0,
            };
          }),
        );

        return {
          purchase_order_id: po.id,
          supplier_name: po.supplier?.name || '',
          order_date: po.order_date,
          total_amount: Number(po.total_amount),
          total_landed_cost: landedCost,
          exchange_rate: exchangeRate,
          total_weight_kg: totalWeight,
          total_items_purchased: poTotalQty,
          total_items_sold: soldQty,
          scrap_qty: scrapQty,
          sales_revenue: salesRevenue,
          total_cogs: totalCOGS,
          gross_profit: grossProfit,
          net_profit: netProfit,
          margin_percent: Math.round(margin * 100) / 100,
          items: itemMargins,
        };
      }),
    );

    const totalRevenue = result.reduce((s, r) => s + r.sales_revenue, 0);
    const totalProfit = result.reduce((s, r) => s + r.net_profit, 0);
    const totalCOGSAll = result.reduce((s, r) => s + r.total_cogs, 0);

    return {
      shipments: result,
      summary: {
        total_shipments: result.length,
        total_revenue: totalRevenue,
        total_cogs: totalCOGSAll,
        total_profit: totalProfit,
        overall_margin_percent:
          totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0,
        highest_margin_shipment: result.reduce(
          (best, r) => (r.margin_percent > (best?.margin_percent || -Infinity) ? r : best),
          null as any,
        ),
        highest_margin_items: result
          .flatMap((r) => r.items)
          .sort((a, b) => b.margin_percent - a.margin_percent)
          .slice(0, 5),
      },
    };
  }
}

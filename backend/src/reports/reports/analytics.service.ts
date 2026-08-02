import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Product } from '../../inventory/entities/product.entity';
import { Stock } from '../../inventory/entities/stock.entity';
import { PurchaseOrder } from '../../purchases/entities/purchase-order.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { Account } from '../../accounting/entities/account.entity';
import {
  SalesOrder,
  OrderStatus,
} from '../../sales/entities/sales-order.entity';
import { PurchaseOrderStatus } from '../../purchases/entities/purchase-order.entity';
import { Not } from 'typeorm';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async getStockReport() {
    try {
      const productsWithStock = await this.dataSource.query(`
        SELECT
          p.*,
          COALESCE(mov.current_stock, 0) AS quantity
        FROM products p
        LEFT JOIN (
          SELECT product_id,
            COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS current_stock
          FROM stock_movements
          GROUP BY product_id
        ) mov ON mov.product_id = p.id
        WHERE p.deleted_at IS NULL
        ORDER BY p.name ASC
      `);

      const totalValue = productsWithStock.reduce(
        (sum: number, p: Record<string, any>) => sum + Number(p.quantity) * Number(p.cost_price || 0),
        0,
      );

      const lowStockItems = productsWithStock.filter((p: Record<string, any>) => {
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
        productCount: productsWithStock.length,
        lowStockItems,
        allProducts: productsWithStock,
      };
    } catch (error) {
      this.logger.error('Error in getStockReport:', error);
      throw error;
    }
  }

  async getInventoryValueByCategory() {
    const rows = await this.dataSource.query(`
      SELECT
        p.name AS product_name,
        COALESCE(cat.name, 'غير محدد') AS category_name,
        p.cost_price,
        COALESCE(mov.current_stock, 0) AS quantity
      FROM products p
      LEFT JOIN categories cat ON cat.id = p.category_id
      LEFT JOIN (
        SELECT product_id,
          COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END), 0) AS current_stock
        FROM stock_movements
        GROUP BY product_id
      ) mov ON mov.product_id = p.id
      WHERE p.deleted_at IS NULL
    `);

    const data = rows.reduce(
      (acc: Record<string, unknown>, row: any) => {
        const categoryName = row.category_name || 'غير محدد';
        const value = Number(row.quantity) * Number(row.cost_price || 0);
        acc[categoryName] = ((acc[categoryName] as number) || 0) + value;
        return acc;
      },
      {} as Record<string, unknown>,
    );

    return Object.keys(data).map((name) => ({
      name,
      value: Math.round((data[name] as number) * 100) / 100,
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

    const data = sales.reduce(
      (acc: Record<string, unknown>, order) => {
        order.items.forEach((item) => {
          const categoryName = item.product?.category?.name || 'غير محدد';
          const amount = Number(item.total);
          acc[categoryName] = ((acc[categoryName] as number) || 0) + amount;
        });
        return acc;
      },
      {} as Record<string, unknown>,
    );

    return Object.keys(data).map((name) => ({
      name,
      value: Math.round((data[name] as number) * 100) / 100,
    }));
  }

  async getCashFlowProjection(
    days?: number,
    startDate?: string,
    endDate?: string,
  ) {
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      const numDays = days || 30;
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setDate(end.getDate() + numDays);
      end.setHours(23, 59, 59, 999);
    }

    const treasuryAccount = await this.accountRepo.findOne({
      where: { code: '1103' },
    });
    const startingCash = treasuryAccount ? Number(treasuryAccount.balance) : 0;

    const openSales = await this.salesOrderRepo.find({
      where: {
        status: Not(OrderStatus.CANCELLED),
        order_date: Between(start, end),
      },
    });

    const openPurchases = await this.purchaseOrderRepo.find({
      where: {
        status: Not(PurchaseOrderStatus.CANCELLED),
        order_date: Between(start, end),
      },
    });

    const expectedInflows = openSales.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );
    const expectedOutflows = openPurchases.reduce(
      (sum, order) => sum + Number(order.total_amount),
      0,
    );
    const netCashFlow = expectedInflows - expectedOutflows;
    const projectedBalance = startingCash + netCashFlow;

    const netChanges = new Map<string, number>();
    for (const order of openSales) {
      const dateStr = new Date(order.order_date).toISOString().split('T')[0];
      netChanges.set(
        dateStr,
        (netChanges.get(dateStr) || 0) + Number(order.total_amount),
      );
    }
    for (const order of openPurchases) {
      const dateStr = new Date(order.order_date).toISOString().split('T')[0];
      netChanges.set(
        dateStr,
        (netChanges.get(dateStr) || 0) - Number(order.total_amount),
      );
    }

    let running = startingCash;
    const dailyProjection: { date: string; balance: number }[] = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const netChange = netChanges.get(dateStr) || 0;
      running += netChange;
      dailyProjection.push({
        date: dateStr,
        balance: Math.round(running * 100) / 100,
      });
      current.setDate(current.getDate() + 1);
    }

    return {
      startingCash: Math.round(startingCash * 100) / 100,
      expectedInflows: Math.round(expectedInflows * 100) / 100,
      expectedOutflows: Math.round(expectedOutflows * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      projectedBalance: Math.round(projectedBalance * 100) / 100,
      dailyProjection,
    };
  }

  async getShipmentProfitability(startDate?: string, endDate?: string) {
    const shipments = await this.purchaseOrderRepo.find({
      where:
        startDate && endDate
          ? { order_date: Between(new Date(startDate), new Date(endDate + 'T23:59:59.999Z')) }
          : {},
      relations: ['items', 'items.product', 'supplier'],
    });

    // Batch-query: collect all product IDs across all shipments
    const allProductIds = new Set<number>();
    for (const po of shipments) {
      for (const item of po.items) {
        allProductIds.add(item.product_id);
      }
    }

    // Batch-query: get all sales data for all products in one query
    let salesByProduct = new Map<number, { qty: number; revenue: number }>();
    let itemSalesByProduct = new Map<number, { qty: number; revenue: number }>();
    if (allProductIds.size > 0) {
      const ids = [...allProductIds];
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');

      const salesResult = await this.dataSource.query(
        `SELECT soi.product_id, SUM(soi.quantity) AS total_sold_qty, SUM(soi.total) AS total_revenue
         FROM sales_order_items soi
         JOIN sales_orders so ON so.id = soi.order_id
         WHERE soi.product_id IN (${placeholders})${startDate && endDate ? ` AND so.order_date BETWEEN $${ids.length + 1} AND $${ids.length + 2}` : ''}
         GROUP BY soi.product_id`,
        startDate && endDate ? [...ids, startDate, endDate + 'T23:59:59.999Z'] : ids,
      );
      for (const row of salesResult) {
        salesByProduct.set(row.product_id, {
          qty: Number(row.total_sold_qty) || 0,
          revenue: Number(row.total_revenue) || 0,
        });
      }

      // Per-item sales (same data, different shape for itemMargins)
      const itemSalesResult = await this.dataSource.query(
        `SELECT soi.product_id, COALESCE(SUM(quantity), 0) AS qty, COALESCE(SUM(total), 0) AS revenue
         FROM sales_order_items soi
         JOIN sales_orders so ON so.id = soi.order_id
         WHERE soi.product_id IN (${placeholders})${startDate && endDate ? ` AND so.order_date BETWEEN $${ids.length + 1} AND $${ids.length + 2}` : ''}
         GROUP BY soi.product_id`,
        startDate && endDate ? [...ids, startDate, endDate + 'T23:59:59.999Z'] : ids,
      );
      for (const row of itemSalesResult) {
        itemSalesByProduct.set(row.product_id, {
          qty: Number(row.qty) || 0,
          revenue: Number(row.revenue) || 0,
        });
      }
    }

    // Batch-query: get scrap data once
    let scrapQty = 0;
    if (startDate && endDate) {
      const scrapResult = await this.dataSource.query(
        `SELECT COALESCE(SUM(pieces_defective), 0) AS scrap FROM daily_production WHERE date BETWEEN $1 AND $2`,
        [startDate, endDate],
      );
      scrapQty = Number(scrapResult[0]?.scrap || 0);
    }

    const result = shipments.map((po) => {
      const landedCost =
        Number(po.total_landed_cost) || Number(po.total_amount) || 0;
      const exchangeRate = Number(po.exchange_rate) || 1;
      const totalWeight = Number(po.total_weight_kg) || 0;

      let soldQty = 0;
      let salesRevenue = 0;
      let totalCOGS = 0;

      for (const item of po.items) {
        const sales = salesByProduct.get(item.product_id);
        if (sales) {
          soldQty += sales.qty;
          salesRevenue += sales.revenue;
          totalCOGS += (Number(item.product?.cost_price) || 0) * sales.qty;
        }
      }

      const poTotalQty = po.items.reduce((s, i) => s + Number(i.quantity), 0);
      const landedCostPerUnit = poTotalQty > 0 ? landedCost / poTotalQty : 0;
      const totalLandedOnSold = landedCostPerUnit * soldQty;

      const grossProfit = salesRevenue - totalCOGS;
      const netProfit = salesRevenue - (totalCOGS + totalLandedOnSold);
      const margin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0;

      const itemMargins = po.items.map((item) => {
        const itemSale = itemSalesByProduct.get(item.product_id) || { qty: 0, revenue: 0 };
        const sq = itemSale.qty;
        const rev = itemSale.revenue;
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
      });

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
        sales_revenue: salesRevenue,
        total_cogs: totalCOGS,
        gross_profit: grossProfit,
        net_profit: netProfit,
        margin_percent: Math.round(margin * 100) / 100,
        items: itemMargins,
      };
    });

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
        scrap_qty: scrapQty,
        overall_margin_percent:
          totalRevenue > 0
            ? Math.round((totalProfit / totalRevenue) * 10000) / 100
            : 0,
        highest_margin_shipment: result.reduce<(typeof result)[number] | null>(
          (best, r) =>
            r.margin_percent > (best?.margin_percent || -Infinity) ? r : best,
          null,
        ),
        highest_margin_items: result
          .flatMap((r) => r.items)
          .sort((a, b) => b.margin_percent - a.margin_percent)
          .slice(0, 5),
      },
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { PeachtreeConnectionService } from './peachtree-connection.service';
import { PeachtreeMappingService } from './peachtree-mapping.service';
import { PeachtreeReviewService } from './peachtree-review.service';
import {
  SyncEntity,
  SyncResultDto,
  SyncStatus,
} from './dto/sync-status.dto';
import { Customer } from '../sales/entities/customer.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { Product } from '../inventory/entities/product.entity';
import { SalesOrder, OrderStatus } from '../sales/entities/sales-order.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../purchases/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';
import { SyncLogAction } from './entities/peachtree-sync-log.entity';

const BATCH_SIZE = 500;

const normalizeArabic = (text: string): string => {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const STRIP_PREFIXES = ['علب', 'علبه', 'كرتون', 'كرتونة'];

const stripPrefix = (text: string): string => {
  let t = normalizeArabic(text);
  for (const prefix of STRIP_PREFIXES) {
    if (t.startsWith(prefix + ' ')) {
      t = t.substring(prefix.length).trim();
      break;
    }
  }
  return t;
};

@Injectable()
export class PeachtreeSyncInvoiceService {
  private readonly logger = new Logger(PeachtreeSyncInvoiceService.name);

  constructor(
    private connectionService: PeachtreeConnectionService,
    private mappingService: PeachtreeMappingService,
    private reviewService: PeachtreeReviewService,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private salesOrderItemRepo: Repository<SalesOrderItem>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepo: Repository<PurchaseOrderItem>,
  ) {}

  async syncSalesInvoices(
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(SyncEntity.SALES_INVOICES);

    const rows = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'JrnlKey_Partner, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, TransactionDate, Description, MainAmount, Reference, TrxIsPosted, CustVendId, PaymentMethod, AmountPaid, CustomerInvoiceNo, TrxName',
        "Module = 'R'",
      )
      .catch((e) => {
        this.logger.warn(`JrnlHdr sales query: ${e.message}`);
        return [];
      });

    if (rows.length === 0) {
      this.logger.log('No sales invoices found');
      return;
    }

    const customers = await this.customerRepo.find({
      select: ['id', 'name'],
    });
    const customerByName = new Map<string, number>();
    for (const c of customers) customerByName.set(c.name, c.id);

    const ptCustomers = await this.connectionService
      .query(
        'Customers',
        0,
        'CustomerRecordNumber, Customer_Bill_Name, CustomerID',
      )
      .catch((e) => {
        this.logger.warn(`Customers query: ${e.message}`);
        return [];
      });
    const custVendToCustomer = new Map<number, number>();
    for (const ptCust of ptCustomers) {
      const recNo = parseInt(ptCust.CustomerRecordNumber, 10);
      const name = ptCust.Customer_Bill_Name || ptCust.CustomerID || '';
      const dbId = customerByName.get(name) || 0;
      if (recNo > 0 && dbId > 0) custVendToCustomer.set(recNo, dbId);
    }
    this.logger.log(
      `Customer mapping: ${custVendToCustomer.size} Peachtree→DB links, ${rows.length} sales headers`,
    );

    const toCompare: {
      key: string;
      invNum: string;
      data: any;
    }[] = [];
    const seen = new Set<string>();
    for (const hdr of rows) {
      const mapped = this.mappingService.mapSalesInvoice(hdr);
      const custRecNo = mapped.customer_vend_id;
      let customerId = custVendToCustomer.get(custRecNo) || 0;
      if (!customerId) {
        const custName = hdr.Description || hdr.TrxName || '';
        if (custName) customerId = customerByName.get(custName) || 0;
      }
      if (!customerId) {
        result.recordsSkipped++;
        continue;
      }

      const uniqueKey = `${hdr.JrnlKey_TrxNumber}_${hdr.JrnlKey_Per}_${hdr.JrnlKey_Journal}`;
      const invNum = String(
        mapped.invoice_number || hdr.JrnlKey_TrxNumber || '',
      );
      if (seen.has(uniqueKey)) {
        result.recordsSkipped++;
        continue;
      }
      seen.add(uniqueKey);
      toCompare.push({
        key: uniqueKey,
        invNum,
        data: {
          customer_id: customerId,
          total_amount: mapped.total_amount,
          status:
            mapped.status === 'COMPLETED'
              ? OrderStatus.COMPLETED
              : OrderStatus.PENDING,
          order_date: mapped.order_date || undefined,
          notes: `[PQ-${uniqueKey}] ${mapped.notes}`,
          invoice_number: invNum,
        },
      });
    }

    const invNumbers = toCompare.map((c) => c.invNum).filter(Boolean);
    const existingByInv = new Map<string, SalesOrder>();
    if (invNumbers.length > 0) {
      const existing = await this.salesOrderRepo.find({
        where: { invoice_number: In(invNumbers) },
        select: [
          'id',
          'invoice_number',
          'total_amount',
          'status',
          'order_date',
          'notes',
        ],
      });
      for (const o of existing) existingByInv.set(o.invoice_number!, o);
    }
    const pqOrders = await this.salesOrderRepo.find({
      where: { notes: Like('[PQ-%') },
      select: [
        'id',
        'invoice_number',
        'notes',
        'total_amount',
        'status',
        'order_date',
      ],
    });
    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const existingByPq = new Map<string, SalesOrder>();
    for (const o of pqOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) existingByPq.set(`${m[1]}_${m[2]}_${m[3]}`, o);
    }

    const toInsert: any[] = [];
    for (const c of toCompare) {
      const existing = existingByInv.get(c.invNum) || existingByPq.get(c.key);
      if (!existing) {
        toInsert.push(c.data);
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.SALES_INVOICES,
          action: SyncLogAction.INSERTED,
          recordKey: c.invNum || c.key,
        });
        result.recordsProcessed++;
      } else {
        await this.compareOrderToReview(
          SyncEntity.SALES_INVOICES,
          existing,
          c.data,
          c.invNum || c.key,
          result,
          runId,
        );
      }
    }

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const chunk = toInsert.slice(i, i + BATCH_SIZE);
      await this.salesOrderRepo
        .createQueryBuilder()
        .insert()
        .into(SalesOrder)
        .values(chunk)
        .orIgnore()
        .execute();
    }
    result.recordsCreated = toInsert.length;

    await this.flagMissingOrders(SyncEntity.SALES_INVOICES, 'R', result, runId);

    this.logger.log(
      `Sales invoices: ${result.recordsCreated} created, ${result.recordsUpdated} differences, ${result.recordsSkipped} skipped`,
    );
  }

  async syncPurchaseInvoices(
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(
      SyncEntity.PURCHASE_INVOICES,
    );

    const rows = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'JrnlKey_Partner, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, TransactionDate, Description, MainAmount, Reference, TrxIsPosted, CustVendId, PaymentMethod, AmountPaid, TrxName',
        "Module = 'P'",
      )
      .catch((e) => {
        this.logger.warn(`JrnlHdr purchase query: ${e.message}`);
        return [];
      });

    if (rows.length === 0) {
      this.logger.log('No purchase invoices found');
      return;
    }

    const suppliers = await this.supplierRepo.find({
      select: ['id', 'name'],
    });
    const supplierByName = new Map<string, number>();
    for (const s of suppliers) supplierByName.set(s.name, s.id);

    const ptVendors = await this.connectionService
      .query('Vendors', 0, 'VendorRecordNumber, Name, VendorID')
      .catch((e) => {
        this.logger.warn(`Vendors query: ${e.message}`);
        return [];
      });
    const custVendToSupplier = new Map<number, number>();
    for (const ptVend of ptVendors) {
      const recNo = parseInt(ptVend.VendorRecordNumber, 10);
      const name = ptVend.Name || ptVend.VendorID || '';
      const dbId = supplierByName.get(name) || 0;
      if (recNo > 0 && dbId > 0) custVendToSupplier.set(recNo, dbId);
    }
    this.logger.log(
      `Supplier mapping: ${custVendToSupplier.size} Peachtree→DB links, ${rows.length} purchase headers`,
    );

    const toCompare: {
      key: string;
      invNum: string;
      data: any;
    }[] = [];
    const seen = new Set<string>();
    for (const hdr of rows) {
      const mapped = this.mappingService.mapPurchaseInvoice(hdr);
      const vendRecNo = mapped.customer_vend_id;
      let supplierId = custVendToSupplier.get(vendRecNo) || 0;
      if (!supplierId) {
        const vendName = hdr.Description || hdr.TrxName || '';
        if (vendName) supplierId = supplierByName.get(vendName) || 0;
      }
      if (!supplierId) {
        result.recordsSkipped++;
        continue;
      }

      const uniqueKey = `${hdr.JrnlKey_TrxNumber}_${hdr.JrnlKey_Per}_${hdr.JrnlKey_Journal}`;
      const invNum = String(
        mapped.invoice_number || hdr.JrnlKey_TrxNumber || '',
      );
      if (seen.has(uniqueKey)) {
        result.recordsSkipped++;
        continue;
      }
      seen.add(uniqueKey);
      toCompare.push({
        key: uniqueKey,
        invNum,
        data: {
          supplier_id: supplierId,
          total_amount: mapped.total_amount,
          status:
            mapped.status === 'COMPLETED'
              ? PurchaseOrderStatus.COMPLETED
              : PurchaseOrderStatus.PENDING,
          order_date: mapped.order_date || undefined,
          notes: `[PQ-${uniqueKey}] ${mapped.notes}`,
          invoice_number: invNum,
        },
      });
    }

    const invNumbers = toCompare.map((c) => c.invNum).filter(Boolean);
    const existingByInv = new Map<string, PurchaseOrder>();
    if (invNumbers.length > 0) {
      const existing = await this.purchaseOrderRepo.find({
        where: { invoice_number: In(invNumbers) },
        select: [
          'id',
          'invoice_number',
          'total_amount',
          'status',
          'order_date',
          'notes',
        ],
      });
      for (const o of existing) existingByInv.set(o.invoice_number!, o);
    }
    const pqOrders = await this.purchaseOrderRepo.find({
      where: { notes: Like('[PQ-%') },
      select: [
        'id',
        'invoice_number',
        'notes',
        'total_amount',
        'status',
        'order_date',
      ],
    });
    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const existingByPq = new Map<string, PurchaseOrder>();
    for (const o of pqOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) existingByPq.set(`${m[1]}_${m[2]}_${m[3]}`, o);
    }

    const toInsert: any[] = [];
    for (const c of toCompare) {
      const existing = existingByInv.get(c.invNum) || existingByPq.get(c.key);
      if (!existing) {
        toInsert.push(c.data);
        await this.reviewService.log({
          runId,
          triggeredBy: 'manual',
          entity: SyncEntity.PURCHASE_INVOICES,
          action: SyncLogAction.INSERTED,
          recordKey: c.invNum || c.key,
        });
        result.recordsProcessed++;
      } else {
        await this.compareOrderToReview(
          SyncEntity.PURCHASE_INVOICES,
          existing,
          c.data,
          c.invNum || c.key,
          result,
          runId,
        );
      }
    }

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const chunk = toInsert.slice(i, i + BATCH_SIZE);
      await this.purchaseOrderRepo
        .createQueryBuilder()
        .insert()
        .into(PurchaseOrder)
        .values(chunk)
        .orIgnore()
        .execute();
    }
    result.recordsCreated = toInsert.length;

    await this.flagMissingOrders(
      SyncEntity.PURCHASE_INVOICES,
      'P',
      result,
      runId,
    );

    this.logger.log(
      `Purchase invoices: ${result.recordsCreated} created, ${result.recordsUpdated} differences, ${result.recordsSkipped} skipped`,
    );
  }

  async syncInvoiceLineItems(
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    await this.reviewService.clearPendingForEntity(
      SyncEntity.INVOICE_LINE_ITEMS,
    );

    const jrnlRowFields =
      'PostOrder, CustomerRecordNumber, VendorRecordNumber, ItemRecordNumber, Quantity, UnitCost, Amount, GLAcntNumber, RowDescription';

    const products = await this.productRepo.find({
      select: ['id', 'name', 'sku'],
    });
    const productByName = new Map<string, number>();
    const productBySku = new Map<string, number>();
    const productByFuzzy = new Map<string, number>();

    for (const p of products) {
      productByName.set(normalizeArabic(p.name), p.id);
      if (p.sku) productBySku.set(normalizeArabic(p.sku), p.id);
      const stripped = stripPrefix(p.name);
      if (stripped && !productByFuzzy.has(stripped)) {
        productByFuzzy.set(stripped, p.id);
      }
    }

    const recordToProduct = new Map<number, number>();
    const lineItems = await this.connectionService
      .query('LineItem')
      .catch((e) => {
        this.logger.warn(`LineItem query: ${e.message}`);
        return [];
      });
    let matchedCount = 0;

    for (const li of lineItems) {
      const recNo = parseInt(li.ItemRecordNumber, 10);
      if (isNaN(recNo) || recNo <= 0) continue;
      const desc = li.ItemDescription || '';
      const itemId = li.ItemID || '';

      let pid = li.UPC_SKU
        ? productBySku.get(normalizeArabic(li.UPC_SKU)) || 0
        : 0;
      if (!pid && desc) pid = productByName.get(normalizeArabic(desc)) || 0;
      if (!pid && desc) {
        const stripped = stripPrefix(desc);
        pid = productByFuzzy.get(stripped) || 0;
      }
      if (!pid && desc) {
        const normDesc = normalizeArabic(desc);
        for (const [normName, pId] of productByName) {
          if (
            normName.length > 3 &&
            (normDesc.includes(normName) || normName.includes(normDesc))
          ) {
            pid = pId;
            break;
          }
        }
      }
      if (!pid && itemId) {
        pid = productByName.get(normalizeArabic(itemId)) || 0;
      }
      if (!pid && itemId) {
        const stripped = stripPrefix(itemId);
        pid = productByFuzzy.get(stripped) || 0;
      }
      if (!pid && itemId) {
        const normItemId = normalizeArabic(itemId);
        for (const [normName, pId] of productByName) {
          if (
            normName.length > 3 &&
            (normItemId.includes(normName) || normName.includes(normItemId))
          ) {
            pid = pId;
            break;
          }
        }
      }
      if (pid) {
        recordToProduct.set(recNo, pid);
        matchedCount++;
      }
    }

    this.logger.log(
      `Product mapping: ${matchedCount} matched from ${lineItems.length} LineItems`,
    );

    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const salesOrders = await this.salesOrderRepo.find({
      select: ['id', 'notes'],
    });
    const purchaseOrders = await this.purchaseOrderRepo.find({
      select: ['id', 'notes'],
    });

    const salesOrderPqKeys = new Map<string, number>();
    const purchaseOrderPqKeys = new Map<string, number>();
    for (const o of salesOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) salesOrderPqKeys.set(`${m[1]}_${m[2]}_${m[3]}`, o.id);
    }
    for (const o of purchaseOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) purchaseOrderPqKeys.set(`${m[1]}_${m[2]}_${m[3]}`, o.id);
    }

    this.logger.log(
      `Orders: ${salesOrders.length} sales (${salesOrderPqKeys.size} with PQ keys), ${purchaseOrders.length} purchase (${purchaseOrderPqKeys.size} with PQ keys)`,
    );

    const allHeaders = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'PostOrder, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, Module',
      )
      .catch((e) => {
        this.logger.warn(`JrnlHdr all: ${e.message}`);
        return [];
      });

    const postOrderToSalesOrderId = new Map<number, number>();
    const postOrderToPurchaseOrderId = new Map<number, number>();
    let salesHeadersMatched = 0;
    let purchaseHeadersMatched = 0;

    for (const hdr of allHeaders) {
      const postOrder = parseInt(hdr.PostOrder, 10);
      if (isNaN(postOrder) || postOrder <= 0) continue;
      const trxNum = hdr.JrnlKey_TrxNumber;
      const per = hdr.JrnlKey_Per;
      const journal = hdr.JrnlKey_Journal;
      const module = String(hdr.Module || '').trim();
      const pqKey = `${trxNum}_${per}_${journal}`;

      if (module === 'R') {
        const orderId = salesOrderPqKeys.get(pqKey);
        if (orderId) {
          postOrderToSalesOrderId.set(postOrder, orderId);
          salesHeadersMatched++;
        }
      } else if (module === 'P') {
        const orderId = purchaseOrderPqKeys.get(pqKey);
        if (orderId) {
          postOrderToPurchaseOrderId.set(postOrder, orderId);
          purchaseHeadersMatched++;
        }
      }
    }

    this.logger.log(
      `PostOrder mapping: ${salesHeadersMatched} sales headers, ${purchaseHeadersMatched} purchase headers matched to DB orders`,
    );

    const existingSalesItems = await this.salesOrderItemRepo.find({
      select: ['order_id', 'product_id', 'quantity', 'price', 'total'],
    });
    const existingPurchaseItems = await this.purchaseOrderItemRepo.find({
      select: ['order_id', 'product_id', 'quantity', 'price', 'total'],
    });
    const salesOrderHasItems = new Set<number>(
      existingSalesItems.map((i) => i.order_id),
    );
    const purchaseOrderHasItems = new Set<number>(
      existingPurchaseItems.map((i) => i.order_id),
    );

    const allRawRows = await this.connectionService
      .query('JrnlRow', 0, jrnlRowFields)
      .catch((e) => {
        this.logger.warn(`JrnlRow query: ${e.message}`);
        return [];
      });

    const glAccountSet = new Set([0, 1, 2, 3, 5, 7, 11, 23, 27, 33, 55]);
    const allRows = allRawRows.filter((r: any) => {
      const itemRec = parseInt(r.ItemRecordNumber, 10);
      const glAcnt = parseInt(r.GLAcntNumber, 10);
      return itemRec > 0 && glAccountSet.has(glAcnt);
    });
    this.logger.log(
      `JrnlRow: ${allRawRows.length} total, ${allRows.length} with items + valid GL accounts`,
    );

    const rowsByPostOrder = new Map<number, any[]>();
    for (const row of allRows) {
      const po = parseInt(row.PostOrder, 10);
      if (isNaN(po) || po <= 0) continue;
      if (!rowsByPostOrder.has(po)) rowsByPostOrder.set(po, []);
      rowsByPostOrder.get(po)!.push(row);
    }

    this.logger.log(
      `JrnlRow grouped: ${rowsByPostOrder.size} unique PostOrders from ${allRows.length} rows`,
    );

    const salesBatch: any[] = [];
    const purchaseBatch: any[] = [];

    for (const [postOrder, rows] of rowsByPostOrder) {
      const salesOrderId = postOrderToSalesOrderId.get(postOrder);
      if (salesOrderId) {
        const expected = this.buildExpectedItems(
          rows,
          salesOrderId,
          recordToProduct,
        );
        if (salesOrderHasItems.has(salesOrderId)) {
          const existing = existingSalesItems.filter(
            (i) => i.order_id === salesOrderId,
          );
          if (!this.itemsEqual(existing, expected)) {
            await this.reviewService.createReview({
              entity: SyncEntity.INVOICE_LINE_ITEMS,
              recordKey: `sales-order-${salesOrderId}`,
              changeType: 'update',
              dbRecordId: salesOrderId,
              oldValues: { kind: 'sales', items: existing },
              newValues: { kind: 'sales', items: expected },
            });
            await this.reviewService.log({
              runId,
              triggeredBy: 'manual',
              entity: SyncEntity.INVOICE_LINE_ITEMS,
              action: SyncLogAction.DIFFERENT,
              recordKey: `sales-order-${salesOrderId}`,
            });
            result.recordsUpdated++;
          } else {
            result.recordsSkipped++;
          }
        } else {
          salesBatch.push(...expected);
          result.recordsProcessed += expected.length;
          salesOrderHasItems.add(salesOrderId);
        }
        continue;
      }

      const purchaseOrderId = postOrderToPurchaseOrderId.get(postOrder);
      if (purchaseOrderId) {
        const expected = this.buildExpectedItems(
          rows,
          purchaseOrderId,
          recordToProduct,
        );
        if (purchaseOrderHasItems.has(purchaseOrderId)) {
          const existing = existingPurchaseItems.filter(
            (i) => i.order_id === purchaseOrderId,
          );
          if (!this.itemsEqual(existing, expected)) {
            await this.reviewService.createReview({
              entity: SyncEntity.INVOICE_LINE_ITEMS,
              recordKey: `purchase-order-${purchaseOrderId}`,
              changeType: 'update',
              dbRecordId: purchaseOrderId,
              oldValues: { kind: 'purchase', items: existing },
              newValues: { kind: 'purchase', items: expected },
            });
            await this.reviewService.log({
              runId,
              triggeredBy: 'manual',
              entity: SyncEntity.INVOICE_LINE_ITEMS,
              action: SyncLogAction.DIFFERENT,
              recordKey: `purchase-order-${purchaseOrderId}`,
            });
            result.recordsUpdated++;
          } else {
            result.recordsSkipped++;
          }
        } else {
          purchaseBatch.push(...expected);
          result.recordsProcessed += expected.length;
          purchaseOrderHasItems.add(purchaseOrderId);
        }
      }
    }

    for (let i = 0; i < salesBatch.length; i += BATCH_SIZE) {
      const chunk = salesBatch.slice(i, i + BATCH_SIZE);
      await this.salesOrderItemRepo
        .createQueryBuilder()
        .insert()
        .into(SalesOrderItem)
        .values(chunk)
        .orIgnore()
        .execute();
    }
    for (let i = 0; i < purchaseBatch.length; i += BATCH_SIZE) {
      const chunk = purchaseBatch.slice(i, i + BATCH_SIZE);
      await this.purchaseOrderItemRepo
        .createQueryBuilder()
        .insert()
        .into(PurchaseOrderItem)
        .values(chunk)
        .orIgnore()
        .execute();
    }

    result.recordsCreated = salesBatch.length + purchaseBatch.length;
    this.logger.log(
      `Line items: ${salesBatch.length} sales + ${purchaseBatch.length} purchase created`,
    );

    const finalSalesWithItems = await this.salesOrderItemRepo
      .createQueryBuilder('item')
      .select('COUNT(DISTINCT item.order_id)', 'cnt')
      .getRawOne();
    const finalPurchaseWithItems = await this.purchaseOrderItemRepo
      .createQueryBuilder('item')
      .select('COUNT(DISTINCT item.order_id)', 'cnt')
      .getRawOne();
    this.logger.log(
      `After item sync: ${finalSalesWithItems?.cnt || 0} sales orders with items, ${finalPurchaseWithItems?.cnt || 0} purchase orders with items`,
    );
  }

  private async compareOrderToReview(
    entity: SyncEntity,
    existing: {
      id: number;
      total_amount: number;
      status: string;
      order_date: Date | null;
      notes?: string | null;
    },
    newOrder: {
      total_amount: number;
      status: string;
      order_date?: Date | null;
      notes?: string;
    },
    recordKey: string,
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    const oldObj = {
      total_amount: Number(existing.total_amount) || 0,
      status: existing.status,
      order_date: existing.order_date
        ? existing.order_date instanceof Date
          ? existing.order_date.toISOString()
          : String(existing.order_date)
        : '',
      notes: existing.notes || '',
    };
    const newObj = {
      total_amount: newOrder.total_amount,
      status: newOrder.status,
      order_date: newOrder.order_date
        ? newOrder.order_date instanceof Date
          ? newOrder.order_date.toISOString()
          : String(newOrder.order_date)
        : '',
      notes: newOrder.notes || '',
    };
    const changes = this.reviewService.computeDiff(oldObj, newObj);
    if (changes.length === 0) {
      await this.reviewService.log({
        runId,
        triggeredBy: 'manual',
        entity,
        action: SyncLogAction.SKIPPED,
        recordKey,
      });
      result.recordsSkipped++;
    } else {
      await this.reviewService.createReview({
        entity,
        recordKey,
        changeType: 'update',
        dbRecordId: existing.id,
        oldValues: oldObj,
        newValues: newObj,
      });
      await this.reviewService.log({
        runId,
        triggeredBy: 'manual',
        entity,
        action: SyncLogAction.DIFFERENT,
        recordKey,
        changes,
      });
      result.recordsUpdated++;
    }
  }

  private async flagMissingOrders(
    entity: SyncEntity,
    module: string,
    result: SyncResultDto,
    runId: string,
  ): Promise<void> {
    const repo =
      entity === SyncEntity.SALES_INVOICES
        ? this.salesOrderRepo
        : this.purchaseOrderRepo;
    const pqOrders = await repo.find({
      where: { notes: Like('[PQ-%') },
      select: ['id', 'notes'],
    });
    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const headers = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, Module',
      )
      .catch((e) => {
        this.logger.warn(`JrnlHdr missing-check (${module}): ${e.message}`);
        return [];
      });
    const keys = new Set<string>();
    for (const h of headers) {
      if (String(h.Module).trim() === module) {
        keys.add(
          `${h.JrnlKey_TrxNumber}_${h.JrnlKey_Per}_${h.JrnlKey_Journal}`,
        );
      }
    }
    for (const o of pqOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (!m) continue;
      const key = `${m[1]}_${m[2]}_${m[3]}`;
      if (keys.has(key)) continue;
      await this.reviewService.createReview({
        entity,
        recordKey: o.notes,
        changeType: 'missing',
        dbRecordId: o.id,
        oldValues: { notes: o.notes },
        newValues: {},
      });
      await this.reviewService.log({
        runId,
        triggeredBy: 'manual',
        entity,
        action: SyncLogAction.MISSING,
        recordKey: o.notes,
      });
      result.recordsSkipped++;
    }
  }

  private buildExpectedItems(
    rows: any[],
    orderId: number,
    recordToProduct: Map<number, number>,
  ): any[] {
    const items: any[] = [];
    for (const row of rows) {
      const recNo = parseInt(row.ItemRecordNumber, 10);
      const productId = recordToProduct.get(recNo) || 0;
      if (!productId) continue;
      const qty = Math.abs(parseFloat(row.Quantity || '0') || 1);
      const price = Math.abs(parseFloat(row.UnitCost || '0') || 0);
      const amt = Math.abs(parseFloat(row.Amount || '0') || 0);
      if (qty <= 0 && price <= 0 && amt <= 0) continue;
      items.push({
        order_id: orderId,
        product_id: productId,
        quantity: qty || 1,
        price: price || 0,
        total: amt || qty * price,
      });
    }
    return items;
  }

  private itemsEqual(a: any[], b: any[]): boolean {
    const norm = (list: any[]) =>
      list
        .map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity) || 0,
          price: Number(i.price) || 0,
          total: Number(i.total) || 0,
        }))
        .sort(
          (x, y) =>
            x.product_id - y.product_id ||
            x.quantity - y.quantity ||
            x.price - y.price,
        );
    return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
  }
}

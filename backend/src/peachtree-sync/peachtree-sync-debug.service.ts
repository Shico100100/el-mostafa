import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeachtreeConnectionService } from './peachtree-connection.service';
import { Customer } from '../sales/entities/customer.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { Product } from '../inventory/entities/product.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';

type PeachtreeRow = Record<string, string>;

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
export class PeachtreeSyncDebugService {
  private readonly logger = new Logger(PeachtreeSyncDebugService.name);

  constructor(
    private connectionService: PeachtreeConnectionService,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
  ) {}

  async debugInvoiceLink(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

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
    result.jrnlHdr_count = allHeaders.length;

    const salesHeaders = allHeaders.filter(
      (h: PeachtreeRow) => String(h.Module).trim() === 'R',
    );
    result.salesHeaders_count = salesHeaders.length;

    const hdrPqKeyToPostOrder = new Map<string, number>();
    for (const h of salesHeaders) {
      const pqKey = `${h.JrnlKey_TrxNumber}_${h.JrnlKey_Per}_${h.JrnlKey_Journal}`;
      if (!hdrPqKeyToPostOrder.has(pqKey))
        hdrPqKeyToPostOrder.set(pqKey, parseInt(h.PostOrder, 10));
    }
    result.hdrPqKey_count = hdrPqKeyToPostOrder.size;

    const pqNoteRegex = /^\[PQ-(\d+)_(\d+)_(\d+)\]/;
    const salesOrders = await this.salesOrderRepo.find({
      select: ['id', 'notes'],
    });
    const dbPqKeys = new Map<string, number>();
    for (const o of salesOrders) {
      const m = (o.notes || '').match(pqNoteRegex);
      if (m) dbPqKeys.set(`${m[1]}_${m[2]}_${m[3]}`, o.id);
    }
    result.dbOrderCount = salesOrders.length;
    result.dbPqKey_count = dbPqKeys.size;

    let matches = 0;
    const sampleMatches: Array<{
      pqKey: string;
      orderId: number;
      postOrder: number;
    }> = [];
    for (const [pqKey, orderId] of dbPqKeys) {
      if (hdrPqKeyToPostOrder.has(pqKey)) {
        matches++;
        if (sampleMatches.length < 3) {
          sampleMatches.push({
            pqKey,
            orderId,
            postOrder: hdrPqKeyToPostOrder.get(pqKey)!,
          });
        }
      }
    }
    result.matches = matches;
    result.sampleMatches = sampleMatches;

    const unmatchedKeys = [...dbPqKeys.keys()].filter(
      (k) => !hdrPqKeyToPostOrder.has(k),
    );
    result.unmatched_count = unmatchedKeys.length;
    result.unmatched_sample = unmatchedKeys.slice(0, 5);

    result.hdr_sampleKeys = [...hdrPqKeyToPostOrder.keys()].slice(0, 5);

    const lineItems = await this.connectionService
      .query('LineItem')
      .catch((e) => {
        this.logger.warn(`LineItem: ${e.message}`);
        return [];
      });
    result.lineItemCount = lineItems.length;
    result.lineItemSample =
      lineItems.length > 0 ? Object.keys(lineItems[0]) : [];

    const allJrnlRows = await this.connectionService
      .query(
        'JrnlRow',
        0,
        'PostOrder, ItemRecordNumber, Quantity, UnitCost, Amount, GLAcntNumber',
      )
      .catch(() => []);
    result.jrnlRowCount = allJrnlRows.length;
    const itemRows = allJrnlRows.filter(
      (r: PeachtreeRow) => parseInt(r.ItemRecordNumber, 10) > 0,
    );
    result.jrnlRowWithItems = itemRows.length;

    if (sampleMatches.length > 0) {
      const allPOs = sampleMatches.map((m) => m.postOrder);
      const matchedJORows = allJrnlRows.filter((r: PeachtreeRow) =>
        allPOs.includes(parseInt(r.PostOrder, 10)),
      );
      result.matchedPO_jrnlRows_total = matchedJORows.length;
      result.matchedPO_jrnlRows_withItems = matchedJORows.filter(
        (r: PeachtreeRow) => parseInt(r.ItemRecordNumber, 10) > 0,
      ).length;
      result.matchedPO_jrnlRows_sample = matchedJORows
        .filter((r: PeachtreeRow) => parseInt(r.ItemRecordNumber, 10) > 0)
        .slice(0, 3);

      const headerPostOrders = new Set(
        salesHeaders.map((h: PeachtreeRow) => parseInt(h.PostOrder, 10)),
      );
      const jrnlRowsInHeaderPO = allJrnlRows.filter((r: PeachtreeRow) =>
        headerPostOrders.has(parseInt(r.PostOrder, 10)),
      );
      result.jrnlRows_matchingHeaderPO = jrnlRowsInHeaderPO.length;
      result.jrnlRows_matchingHeaderPO_withItems = jrnlRowsInHeaderPO.filter(
        (r: PeachtreeRow) => parseInt(r.ItemRecordNumber, 10) > 0,
      ).length;

      const jrnlRowPOs = new Set(
        allJrnlRows
          .filter((r: PeachtreeRow) => parseInt(r.ItemRecordNumber, 10) > 0)
          .map((r: PeachtreeRow) => parseInt(r.PostOrder, 10)),
      );
      const matchedPOSet = new Set(sampleMatches.map((m) => m.postOrder));
      const poOverlap = [...jrnlRowPOs].filter((po) => matchedPOSet.has(po));
      result.poOverlapCount = poOverlap.length;
      result.poOverlapSample = poOverlap.slice(0, 5);
    }

    return result;
  }

  async debugDryRunItems(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    const jrnlRowFields =
      'PostOrder, CustomerRecordNumber, VendorRecordNumber, ItemRecordNumber, Quantity, UnitCost, Amount, GLAcntNumber, RowDescription';

    const products = await this.productRepo.find({
      select: ['id', 'name', 'sku'],
    });
    result.productCount = products.length;

    const productByName = new Map<string, number>();
    const productBySku = new Map<string, number>();
    const productByFuzzy = new Map<string, number>();
    for (const p of products) {
      productByName.set(normalizeArabic(p.name), p.id);
      if (p.sku) productBySku.set(normalizeArabic(p.sku), p.id);
      const stripped = stripPrefix(p.name);
      if (stripped && !productByFuzzy.has(stripped))
        productByFuzzy.set(stripped, p.id);
    }

    const lineItems = await this.connectionService
      .query('LineItem')
      .catch(() => []);
    result.lineItemCount = lineItems.length;

    const recordToProduct = new Map<number, number>();
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
    result.productMappingCount = matchedCount;

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
    result.salesPqKeys = salesOrderPqKeys.size;
    result.purchasePqKeys = purchaseOrderPqKeys.size;

    const allHeaders = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'PostOrder, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal, Module',
      )
      .catch(() => []);
    result.totalHeaders = allHeaders.length;

    const postOrderToSalesOrderId = new Map<number, number>();
    const postOrderToPurchaseOrderId = new Map<number, number>();
    for (const hdr of allHeaders) {
      const postOrder = parseInt(hdr.PostOrder, 10);
      if (isNaN(postOrder) || postOrder <= 0) continue;
      const pqKey = `${hdr.JrnlKey_TrxNumber}_${hdr.JrnlKey_Per}_${hdr.JrnlKey_Journal}`;
      const module = String(hdr.Module || '').trim();
      if (module === 'R') {
        const oid = salesOrderPqKeys.get(pqKey);
        if (oid) postOrderToSalesOrderId.set(postOrder, oid);
      } else if (module === 'P') {
        const oid = purchaseOrderPqKeys.get(pqKey);
        if (oid) postOrderToPurchaseOrderId.set(postOrder, oid);
      }
    }
    result.salesPostOrderMapSize = postOrderToSalesOrderId.size;
    result.purchasePostOrderMapSize = postOrderToPurchaseOrderId.size;

    const allRawRows = await this.connectionService
      .query('JrnlRow', 0, jrnlRowFields)
      .catch(() => []);
    result.totalJrnlRows = allRawRows.length;

    const glAccountSet = new Set([0, 1, 2, 3, 5, 7, 11, 23, 27, 33, 55]);
    const allRows = allRawRows.filter((r: PeachtreeRow) => {
      const itemRec = parseInt(r.ItemRecordNumber, 10);
      const glAcnt = parseInt(r.GLAcntNumber, 10);
      return itemRec > 0 && glAccountSet.has(glAcnt);
    });
    result.filteredJrnlRows = allRows.length;

    const rowsByPostOrder = new Map<number, PeachtreeRow[]>();
    for (const row of allRows) {
      const po = parseInt(row.PostOrder, 10);
      if (isNaN(po) || po <= 0) continue;
      if (!rowsByPostOrder.has(po)) rowsByPostOrder.set(po, []);
      rowsByPostOrder.get(po)!.push(row);
    }
    result.uniquePostOrders = rowsByPostOrder.size;

    let salesMatchedPOs = 0;
    let purchaseMatchedPOs = 0;
    let unmatchedPOs = 0;
    let salesCandidateItems = 0;
    let purchaseCandidateItems = 0;
    let salesProductHits = 0;
    let salesProductMisses = 0;
    const sampleSalesItems: Array<{
      postOrder: number;
      salesOrderId: number;
      recNo: number;
      productId: number;
      qty: string;
      price: string;
      amount: string;
    }> = [];
    const missedProductRecNos = new Set<number>();

    for (const [postOrder, rows] of rowsByPostOrder) {
      const salesOrderId = postOrderToSalesOrderId.get(postOrder);
      if (salesOrderId) {
        salesMatchedPOs++;
        for (const row of rows) {
          const recNo = parseInt(row.ItemRecordNumber, 10);
          const productId = recordToProduct.get(recNo) || 0;
          if (!productId) {
            salesProductMisses++;
            if (missedProductRecNos.size < 10) missedProductRecNos.add(recNo);
            continue;
          }
          salesProductHits++;
          salesCandidateItems++;
          if (sampleSalesItems.length < 3) {
            sampleSalesItems.push({
              postOrder,
              salesOrderId,
              recNo,
              productId,
              qty: row.Quantity,
              price: row.UnitCost,
              amount: row.Amount,
            });
          }
        }
        continue;
      }
      const purchaseOrderId = postOrderToPurchaseOrderId.get(postOrder);
      if (purchaseOrderId) {
        purchaseMatchedPOs++;
        for (const row of rows) {
          const recNo = parseInt(row.ItemRecordNumber, 10);
          const productId = recordToProduct.get(recNo) || 0;
          if (!productId) continue;
          purchaseCandidateItems++;
        }
      } else {
        unmatchedPOs++;
      }
    }

    result.salesMatchedPOs = salesMatchedPOs;
    result.purchaseMatchedPOs = purchaseMatchedPOs;
    result.unmatchedPOs = unmatchedPOs;
    result.salesProductHits = salesProductHits;
    result.salesProductMisses = salesProductMisses;
    result.salesCandidateItems = salesCandidateItems;
    result.purchaseCandidateItems = purchaseCandidateItems;
    result.sampleSalesItems = sampleSalesItems;
    result.missedProductRecNos = [...missedProductRecNos];
    result.productMappingSample = [...recordToProduct.entries()].slice(0, 10);

    return result;
  }

  async debugLineItemMapping(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    const lineItems = await this.connectionService
      .query(
        'LineItem',
        0,
        'ItemRecordNumber, ItemID, ItemDescription, UPC_SKU, SalesDescription, PartNumber, MasterItemID',
      )
      .catch(() => []);
    result.totalLineItems = lineItems.length;

    const targetRecNos = [
      247, 77, 252, 283, 282, 231, 128, 255, 253, 280, 1, 3, 5, 10,
    ];
    const matched = lineItems.filter((li: PeachtreeRow) =>
      targetRecNos.includes(parseInt(li.ItemRecordNumber, 10)),
    );
    result.matchedLineItems = matched.map((li: PeachtreeRow) => ({
      recNo: li.ItemRecordNumber,
      itemID: li.ItemID,
      description: li.ItemDescription,
      sku: li.UPC_SKU,
      salesDesc: li.SalesDescription,
      partNumber: li.PartNumber,
      masterID: li.MasterItemID,
    }));

    const products = await this.productRepo.find({
      select: ['id', 'name', 'sku'],
    });
    result.sampleProducts = products
      .slice(0, 15)
      .map((p) => ({ id: p.id, name: p.name, sku: p.sku }));

    const productByName = new Map<string, number>();
    const productBySku = new Map<string, number>();
    for (const p of products) {
      productByName.set(normalizeArabic(p.name), p.id);
      if (p.sku) productBySku.set(normalizeArabic(p.sku), p.id);
    }

    const matchResults = matched.map((li: PeachtreeRow) => {
      const desc = li.ItemDescription || '';
      const sku = li.UPC_SKU || '';
      const byName = productByName.get(normalizeArabic(desc));
      const bySku = productBySku.get(normalizeArabic(sku));
      return {
        recNo: li.ItemRecordNumber,
        desc: desc,
        sku: sku,
        matchedByName: byName || null,
        matchedBySku: bySku || null,
        normDesc: normalizeArabic(desc),
      };
    });
    result.matchResults = matchResults;

    return result;
  }

  async debugGlAccounts(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    const allHeaders = await this.connectionService
      .query(
        'JrnlHdr',
        0,
        'PostOrder, Module, JrnlKey_TrxNumber, JrnlKey_Per, JrnlKey_Journal',
      )
      .catch(() => []);

    const salesPostOrders = new Set<number>();
    const purchasePostOrders = new Set<number>();
    for (const h of allHeaders) {
      const po = parseInt(h.PostOrder, 10);
      if (isNaN(po) || po <= 0) continue;
      const mod = String(h.Module || '').trim();
      if (mod === 'R') salesPostOrders.add(po);
      else if (mod === 'P') purchasePostOrders.add(po);
    }

    const allRows = await this.connectionService
      .query(
        'JrnlRow',
        0,
        'PostOrder, ItemRecordNumber, GLAcntNumber, Quantity, UnitCost, Amount',
      )
      .catch(() => []);

    const salesRows = allRows.filter((r: PeachtreeRow) =>
      salesPostOrders.has(parseInt(r.PostOrder, 10)),
    );
    const purchaseRows = allRows.filter((r: PeachtreeRow) =>
      purchasePostOrders.has(parseInt(r.PostOrder, 10)),
    );

    result.totalJrnlRows = allRows.length;
    result.salesJrnlRows = salesRows.length;
    result.purchaseJrnlRows = purchaseRows.length;

    const glSet = [0, 1, 2, 3, 5, 7, 11, 23, 27, 33, 55];

    const salesWithItems = salesRows.filter(
      (r: PeachtreeRow) => parseInt(r.ItemRecordNumber, 10) > 0,
    );
    const salesWithItemsFiltered = salesWithItems.filter((r: PeachtreeRow) =>
      glSet.includes(parseInt(r.GLAcntNumber, 10)),
    );
    result.salesWithItems = salesWithItems.length;
    result.salesWithItemsAfterGLFilter = salesWithItemsFiltered.length;

    const purchaseWithItems = purchaseRows.filter(
      (r: PeachtreeRow) => parseInt(r.ItemRecordNumber, 10) > 0,
    );
    const purchaseWithItemsFiltered = purchaseWithItems.filter(
      (r: PeachtreeRow) => glSet.includes(parseInt(r.GLAcntNumber, 10)),
    );
    result.purchaseWithItems = purchaseWithItems.length;
    result.purchaseWithItemsAfterGLFilter = purchaseWithItemsFiltered.length;

    const salesGlDist: Record<string, number> = {};
    for (const r of salesWithItems) {
      const gl = String(r.GLAcntNumber);
      salesGlDist[gl] = (salesGlDist[gl] || 0) + 1;
    }
    const sortedSalesGl = Object.entries(salesGlDist)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 20);
    result.salesGlDistribution = sortedSalesGl;

    const purchaseGlDist: Record<string, number> = {};
    for (const r of purchaseWithItems) {
      const gl = String(r.GLAcntNumber);
      purchaseGlDist[gl] = (purchaseGlDist[gl] || 0) + 1;
    }
    const sortedPurchaseGl = Object.entries(purchaseGlDist)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 20);
    result.purchaseGlDistribution = sortedPurchaseGl;

    result.allowedGLSet = glSet;

    return result;
  }
}

import { Injectable } from '@nestjs/common';
import { PurchaseReportsService } from './purchase-reports/purchase-reports.service';
import { PurchaseOrderService } from './purchase-orders/purchase-order.service';
import { PurchaseReturnService } from './purchase-returns/purchase-return.service';
import { PaymentService } from './supplier-payments/payment.service';
import { LandedCostService } from './landed-cost/landed-cost.service';
import { PackingListService } from './packing-lists/packing-list.service';

@Injectable()
export class PurchasesService {
  constructor(
    private reportsService: PurchaseReportsService,
    private orderService: PurchaseOrderService,
    private returnService: PurchaseReturnService,
    private paymentService: PaymentService,
    private landedCostService: LandedCostService,
    private packingListService: PackingListService,
  ) {}

  // ---- Reports / Analytics ----

  getSupplierAging() {
    return this.reportsService.getSupplierAging();
  }

  getSupplierBalance(supplierId: number) {
    return this.reportsService.getSupplierBalance(supplierId);
  }

  getStatementOfAccount(supplierId: number) {
    return this.reportsService.getStatementOfAccount(supplierId);
  }

  getLatestPurchasePrice(productId: number) {
    return this.reportsService.getLatestPurchasePrice(productId);
  }

  getLatestPurchasePrices(productIds: number[]) {
    return this.reportsService.getLatestPurchasePrices(productIds);
  }

  // ---- Purchase Orders ----

  createOrder(data: Parameters<PurchaseOrderService['createOrder']>[0]) {
    return this.orderService.createOrder(data);
  }

  updateOrder(
    id: number,
    data: Parameters<PurchaseOrderService['updateOrder']>[1],
  ) {
    return this.orderService.updateOrder(id, data);
  }

  deleteOrder(id: number) {
    return this.orderService.deleteOrder(id);
  }

  // ---- Supplier Payments ----

  addPayment(data: Parameters<PaymentService['addPayment']>[0]) {
    return this.paymentService.addPayment(data);
  }

  // ---- Purchase Returns ----

  createReturn(data: Parameters<PurchaseReturnService['createReturn']>[0]) {
    return this.returnService.createReturn(data);
  }

  // ---- Landed Cost ----

  calculateLandedCost(orderId: number) {
    return this.landedCostService.calculateLandedCost(orderId);
  }

  updateLandedCost(
    orderId: number,
    data: Parameters<LandedCostService['updateLandedCost']>[1],
  ) {
    return this.landedCostService.updateLandedCost(orderId, data);
  }

  // ---- Packing List ----

  createOrUpdatePackingList(
    orderId: number,
    data: Parameters<PackingListService['createOrUpdatePackingList']>[1],
  ) {
    return this.packingListService.createOrUpdatePackingList(orderId, data);
  }
}

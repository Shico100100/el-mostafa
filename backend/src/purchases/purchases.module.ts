import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { SupplierPayment } from './entities/supplier-payment.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';

import { PurchaseReturn } from './entities/purchase-return.entity';
import { PurchaseReturnItem } from './entities/purchase-return-item.entity';
import { PackingList } from './entities/packing-list.entity';
import { PurchaseCreditMemo } from './entities/purchase-credit-memo.entity';
import { PurchaseCreditMemoItem } from './entities/purchase-credit-memo-item.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { SupplierService } from './suppliers/supplier.service';
import { PurchaseOrderService } from './purchase-orders/purchase-order.service';
import { PaymentService } from './supplier-payments/payment.service';
import { PurchaseReturnService } from './purchase-returns/purchase-return.service';
import { PackingListService } from './packing-lists/packing-list.service';
import { PurchaseReportsService } from './purchase-reports/purchase-reports.service';
import { LandedCostService } from './landed-cost/landed-cost.service';
import { PurchaseCreditMemoController } from './credit-memos/purchase-credit-memo.controller';
import { PurchaseCreditMemoService } from './credit-memos/purchase-credit-memo.service';
import { PriceHistoryController } from './price-history/price-history.controller';
import { PriceHistoryService } from './price-history/price-history.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      PurchaseOrder,
      PurchaseOrderItem,
      SupplierPayment,
      PurchaseReturn,
      PurchaseReturnItem,
      PackingList,
      PurchaseCreditMemo,
      PurchaseCreditMemoItem,
      Product,
      Stock,
    ]),
    InventoryModule,
    AccountingModule,
  ],
  providers: [
    PurchasesService,
    SupplierService,
    PurchaseOrderService,
    PaymentService,
    PurchaseReturnService,
    PackingListService,
    PurchaseReportsService,
    LandedCostService,
    PurchaseCreditMemoService,
    PriceHistoryService,
  ],
  controllers: [
    PurchasesController,
    PurchaseCreditMemoController,
    PriceHistoryController,
  ],
  exports: [PurchasesService, TypeOrmModule],
})
export class PurchasesModule {}

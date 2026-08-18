import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeachtreeConnectionService } from './peachtree-connection.service';
import { PeachtreeMappingService } from './peachtree-mapping.service';
import { PeachtreeSyncService } from './peachtree-sync.service';
import { PeachtreeSyncDebugService } from './peachtree-sync-debug.service';
import { PeachtreeSyncMasterService } from './peachtree-sync-master.service';
import { PeachtreeSyncInvoiceService } from './peachtree-sync-invoice.service';
import { PeachtreeSyncScheduler } from './peachtree-sync.scheduler';
import { PeachtreeSyncController } from './peachtree-sync.controller';
import { PeachtreeReviewService } from './peachtree-review.service';
import { PeachtreeSyncReview } from './entities/peachtree-sync-review.entity';
import { PeachtreeSyncLog } from './entities/peachtree-sync-log.entity';
import { Customer } from '../sales/entities/customer.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { Product } from '../inventory/entities/product.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { StockService } from '../inventory/stock.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Supplier,
      Product,
      SalesOrder,
      SalesOrderItem,
      PurchaseOrder,
      PurchaseOrderItem,
      PeachtreeSyncReview,
      PeachtreeSyncLog,
      Stock,
      StockMovement,
      Warehouse,
    ]),
  ],
  controllers: [PeachtreeSyncController],
  providers: [
    PeachtreeConnectionService,
    PeachtreeMappingService,
    PeachtreeSyncService,
    PeachtreeSyncDebugService,
    PeachtreeSyncMasterService,
    PeachtreeSyncInvoiceService,
    PeachtreeSyncScheduler,
    PeachtreeReviewService,
    StockService,
  ],
  exports: [PeachtreeSyncService],
})
export class PeachtreeSyncModule {}

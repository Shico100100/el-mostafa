import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeachtreeConnectionService } from './peachtree-connection.service';
import { PeachtreeMappingService } from './peachtree-mapping.service';
import { PeachtreeSyncService } from './peachtree-sync.service';
import { PeachtreeSyncScheduler } from './peachtree-sync.scheduler';
import { PeachtreeSyncController } from './peachtree-sync.controller';
import { Customer } from '../sales/entities/customer.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { Product } from '../inventory/entities/product.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { SalesOrderItem } from '../sales/entities/sales-order-item.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';

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
    ]),
  ],
  controllers: [PeachtreeSyncController],
  providers: [
    PeachtreeConnectionService,
    PeachtreeMappingService,
    PeachtreeSyncService,
    PeachtreeSyncScheduler,
  ],
  exports: [PeachtreeSyncService],
})
export class PeachtreeSyncModule {}

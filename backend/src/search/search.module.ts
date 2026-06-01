import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Product } from '../inventory/entities/product.entity';
import { Customer } from '../sales/entities/customer.entity';
import { Supplier } from '../purchases/entities/supplier.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../purchases/entities/purchase-order.entity';
import { Machine } from '../manufacturing/entities/machine.entity';
import { Mold } from '../manufacturing/entities/mold.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Customer,
      Supplier,
      SalesOrder,
      PurchaseOrder,
      Machine,
      Mold,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

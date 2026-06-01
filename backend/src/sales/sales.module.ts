import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { Quote } from './entities/quote.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';

import { SalesReturn } from './entities/sales-return.entity';
import { SalesReturnItem } from './entities/sales-return-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      SalesOrder,
      SalesOrderItem,
      Quote,
      CustomerPayment,
      SalesReturn,
      SalesReturnItem,
    ]),
    InventoryModule,
    AccountingModule,
  ],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}

import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { Quote } from './entities/quote.entity';
import { QuoteItem } from './entities/quote-item.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';

import { SalesReturn } from './entities/sales-return.entity';
import { SalesReturnItem } from './entities/sales-return-item.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { CustomerService } from './customers/customer.service';
import { SalesOrderService } from './sales-orders/sales-order.service';
import { QuoteService } from './quotes/quote.service';
import { CustomerPaymentService } from './customer-payments/customer-payment.service';
import { SalesReturnService } from './sales-returns/sales-return.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      SalesOrder,
      SalesOrderItem,
      Quote,
      QuoteItem,
      CustomerPayment,
      SalesReturn,
      SalesReturnItem,
      Stock,
    ]),
    InventoryModule,
    AccountingModule,
  ],
  providers: [
    SalesService,
    CustomerService,
    SalesOrderService,
    QuoteService,
    CustomerPaymentService,
    SalesReturnService,
  ],
  controllers: [SalesController],
  exports: [SalesService, TypeOrmModule],
})
export class SalesModule {}

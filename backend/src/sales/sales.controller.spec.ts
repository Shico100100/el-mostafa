import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { CustomerService } from './customers/customer.service';
import { SalesOrderService } from './sales-orders/sales-order.service';
import { CustomerPaymentService } from './customer-payments/customer-payment.service';
import { SalesReturnService } from './sales-returns/sales-return.service';

describe('SalesController', () => {
  let controller: SalesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        { provide: SalesService, useValue: {} },
        { provide: CustomerService, useValue: {} },
        { provide: SalesOrderService, useValue: {} },
        { provide: CustomerPaymentService, useValue: {} },
        { provide: SalesReturnService, useValue: {} },
      ],
    }).compile();

    controller = module.get<SalesController>(SalesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

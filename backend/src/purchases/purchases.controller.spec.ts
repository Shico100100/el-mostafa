import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { SupplierService } from './suppliers/supplier.service';
import { PurchaseOrderService } from './purchase-orders/purchase-order.service';
import { PackingListService } from './packing-lists/packing-list.service';
import { PurchaseReturnService } from './purchase-returns/purchase-return.service';
import { PaymentService } from './supplier-payments/payment.service';

describe('PurchasesController', () => {
  let controller: PurchasesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchasesController],
      providers: [
        { provide: PurchasesService, useValue: {} },
        { provide: SupplierService, useValue: {} },
        { provide: PurchaseOrderService, useValue: {} },
        { provide: PackingListService, useValue: {} },
        { provide: PurchaseReturnService, useValue: {} },
        { provide: PaymentService, useValue: {} },
      ],
    }).compile();

    controller = module.get<PurchasesController>(PurchasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

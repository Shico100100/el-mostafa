import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierPayment } from '../entities/supplier-payment.entity';
import { Supplier } from '../entities/supplier.entity';
import { AccountingService } from '../../accounting/accounting.service';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(SupplierPayment)
    private paymentRepo: Repository<SupplierPayment>,
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    private accountingService: AccountingService,
    private cache: CacheService,
  ) {}

  async addPayment(data: {
    supplier_id: number;
    amount: number;
    payment_date: string;
    notes?: string;
  }) {
    const payment = this.paymentRepo.create({
      ...data,
      payment_date: new Date(data.payment_date),
    });
    const savedPayment = await this.paymentRepo.save(payment);

    const supplier = await this.supplierRepo.findOne({
      where: { id: data.supplier_id },
    });
    await this.accountingService.postAutomaticEntry({
      type: 'PAYMENT',
      amount: data.amount,
      reference: `PAY-SUPP-${savedPayment.id}`,
      description: `دفع لمورد: ${supplier?.name || data.supplier_id}`,
    });

    await this.cache.delByPattern('reports:*');

    return savedPayment;
  }

  async getSupplierPayments(supplierId: number) {
    return this.paymentRepo.find({
      where: { supplier_id: supplierId },
      order: { payment_date: 'DESC' },
    });
  }
}

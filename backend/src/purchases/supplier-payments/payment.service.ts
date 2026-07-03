import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierPayment } from '../entities/supplier-payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(SupplierPayment)
    private paymentRepo: Repository<SupplierPayment>,
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
    return this.paymentRepo.save(payment);
  }

  async getSupplierPayments(supplierId: number) {
    return this.paymentRepo.find({
      where: { supplier_id: supplierId },
      order: { payment_date: 'DESC' },
    });
  }
}

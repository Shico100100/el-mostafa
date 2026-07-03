import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerPayment } from '../entities/customer-payment.entity';

@Injectable()
export class CustomerPaymentService {
  constructor(
    @InjectRepository(CustomerPayment)
    private paymentRepo: Repository<CustomerPayment>,
  ) {}

  async getCustomerPayments(customerId: number) {
    return this.paymentRepo.find({
      where: { customer: { id: customerId } },
      order: { payment_date: 'DESC' },
    });
  }
}

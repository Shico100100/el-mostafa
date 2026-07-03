import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { jsonToSheetBuffer } from '../../utils/excel-export';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async getAllCustomers() {
    return this.customerRepo.find();
  }

  async getCustomer(id: number) {
    return this.customerRepo.findOne({ where: { id } });
  }

  async createCustomer(data: Partial<Customer>) {
    const customer = this.customerRepo.create(data);
    return this.customerRepo.save(customer);
  }

  async updateCustomer(id: number, data: Partial<Customer>) {
    await this.customerRepo.update(id, data);
    return this.customerRepo.findOne({ where: { id } });
  }

  async deleteCustomer(id: number) {
    return this.customerRepo.delete(id);
  }

  async exportCustomersToExcel() {
    const customers = await this.customerRepo.find({
      order: { name: 'ASC' },
    });
    const data = customers.map((c) => ({
      ID: c.id,
      Name: c.name,
      Phone: c.phone || '',
      Email: c.email || '',
      Address: c.address || '',
      Balance: c.balance || 0,
    }));
    return jsonToSheetBuffer(data, 'Customers');
  }
}

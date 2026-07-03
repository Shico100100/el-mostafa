import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
  ) {}

  async getAllSuppliers() {
    return this.supplierRepo.find();
  }

  async getSupplier(id: number) {
    return this.supplierRepo.findOne({ where: { id } });
  }

  async createSupplier(data: Partial<Supplier>) {
    const supplier = this.supplierRepo.create(data);
    return this.supplierRepo.save(supplier);
  }

  async updateSupplier(id: number, data: Partial<Supplier>) {
    await this.supplierRepo.update(id, data);
    return this.supplierRepo.findOne({ where: { id } });
  }

  async deleteSupplier(id: number) {
    return this.supplierRepo.delete(id);
  }
}

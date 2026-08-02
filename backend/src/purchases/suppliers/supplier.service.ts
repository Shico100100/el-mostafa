import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepo: Repository<Supplier>,
    @Inject(CacheService) private cacheService: CacheService,
  ) {}

  async getAllSuppliers() {
    const cached = await this.cacheService.get<any[]>('suppliers_all');
    if (cached) return cached;
    const suppliers = await this.supplierRepo.find();
    await this.cacheService.set('suppliers_all', suppliers, 1800);
    return suppliers;
  }

  async getSupplier(id: number) {
    return this.supplierRepo.findOne({ where: { id } });
  }

  async createSupplier(data: Partial<Supplier>) {
    const supplier = this.supplierRepo.create(data);
    const saved = await this.supplierRepo.save(supplier);
    await this.cacheService.del('suppliers_all');
    return saved;
  }

  async updateSupplier(id: number, data: Partial<Supplier>) {
    await this.supplierRepo.update(id, data);
    await this.cacheService.del('suppliers_all');
    return this.supplierRepo.findOne({ where: { id } });
  }

  async deleteSupplier(id: number) {
    await this.supplierRepo.delete(id);
    await this.cacheService.del('suppliers_all');
  }
}

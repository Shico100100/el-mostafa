import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SerialNumber } from '../entities/serial-number.entity';

@Injectable()
export class SerialNumberService {
  constructor(
    @InjectRepository(SerialNumber) private snRepo: Repository<SerialNumber>,
  ) {}

  async findAll(filters?: {
    product_id?: number;
    status?: string;
  }): Promise<SerialNumber[]> {
    const where: any = {};
    if (filters?.product_id) where.product_id = filters.product_id;
    if (filters?.status) where.status = filters.status;
    return this.snRepo.find({
      where,
      relations: ['product'],
      order: { created_at: 'DESC' },
    });
  }

  async create(data: {
    product_id: number;
    serial_number: string;
    batch_number?: string;
    warehouse_id?: number;
  }): Promise<SerialNumber> {
    return this.snRepo.save(this.snRepo.create(data));
  }

  async updateStatus(
    id: number,
    status: string,
    reference_type?: string,
    reference_id?: number,
  ): Promise<SerialNumber> {
    const sn = await this.snRepo.findOne({ where: { id } });
    if (!sn) throw new NotFoundException(`Serial number #${id} not found`);
    sn.status = status;
    if (reference_type) sn.reference_type = reference_type;
    if (reference_id) sn.reference_id = reference_id;
    return this.snRepo.save(sn);
  }

  async remove(id: number): Promise<void> {
    const sn = await this.snRepo.findOne({ where: { id } });
    if (!sn) throw new NotFoundException(`Serial number #${id} not found`);
    await this.snRepo.remove(sn);
  }
}

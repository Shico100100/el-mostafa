import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesReturn } from '../entities/sales-return.entity';
import { SalesReturnItem } from '../entities/sales-return-item.entity';

@Injectable()
export class SalesReturnService {
  constructor(
    @InjectRepository(SalesReturn)
    private returnRepo: Repository<SalesReturn>,
    @InjectRepository(SalesReturnItem)
    private returnItemRepo: Repository<SalesReturnItem>,
  ) {}

  async getAllReturns() {
    return this.returnRepo.find({ relations: ['customer'] });
  }

  async getReturn(id: number) {
    return this.returnRepo.findOne({
      where: { id },
      relations: ['customer', 'items', 'items.product'],
    });
  }
}

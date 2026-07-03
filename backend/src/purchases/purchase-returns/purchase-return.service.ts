import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseReturn } from '../entities/purchase-return.entity';
import { PurchaseReturnItem } from '../entities/purchase-return-item.entity';

@Injectable()
export class PurchaseReturnService {
  constructor(
    @InjectRepository(PurchaseReturn)
    private returnRepo: Repository<PurchaseReturn>,
    @InjectRepository(PurchaseReturnItem)
    private returnItemRepo: Repository<PurchaseReturnItem>,
  ) {}

  async getAllReturns() {
    return this.returnRepo.find({ relations: ['supplier'] });
  }

  async getReturn(id: number) {
    return this.returnRepo.findOne({
      where: { id },
      relations: ['supplier', 'items', 'items.product'],
    });
  }
}

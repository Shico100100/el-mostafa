import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackingList } from '../entities/packing-list.entity';

@Injectable()
export class PackingListService {
  constructor(
    @InjectRepository(PackingList)
    private packingListRepo: Repository<PackingList>,
  ) {}

  async getPackingList(orderId: number) {
    return this.packingListRepo.findOne({ where: { order_id: orderId } });
  }
}

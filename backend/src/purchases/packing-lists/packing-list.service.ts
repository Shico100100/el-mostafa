import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackingList } from '../entities/packing-list.entity';
import { CreatePackingListDto } from '../dto/create-packing-list.dto';

@Injectable()
export class PackingListService {
  constructor(
    @InjectRepository(PackingList)
    private packingListRepo: Repository<PackingList>,
  ) {}

  async getPackingList(orderId: number) {
    return this.packingListRepo.findOne({ where: { order_id: orderId } });
  }

  async savePackingList(orderId: number, dto: CreatePackingListDto) {
    const {
      carton_length_cm,
      carton_width_cm,
      carton_height_cm,
      cartons_count,
      total_cbm,
      actual_net_weight_kg,
      actual_gross_weight_kg,
      deviation_threshold_percent,
      notes,
    } = dto;

    const existing = await this.packingListRepo.findOne({
      where: { order_id: orderId },
    });

    const payload = {
      order_id: orderId,
      carton_length_cm,
      carton_width_cm,
      carton_height_cm,
      cartons_count,
      total_cbm: total_cbm ?? 0,
      actual_net_weight_kg: actual_net_weight_kg ?? null,
      actual_gross_weight_kg: actual_gross_weight_kg ?? null,
      deviation_threshold_percent: deviation_threshold_percent ?? 5,
      notes: notes ?? null,
    };

    if (existing) {
      await this.packingListRepo.update(existing.id, payload);
      return this.packingListRepo.findOne({ where: { id: existing.id } });
    }

    return this.packingListRepo.save(this.packingListRepo.create(payload));
  }
}

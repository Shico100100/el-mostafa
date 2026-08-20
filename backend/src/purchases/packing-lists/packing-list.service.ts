import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackingList } from '../entities/packing-list.entity';
import { PurchaseOrder } from '../entities/purchase-order.entity';
import { CreatePackingListDto } from '../dto/create-packing-list.dto';

@Injectable()
export class PackingListService {
  constructor(
    @InjectRepository(PackingList)
    private packingListRepo: Repository<PackingList>,
    @InjectRepository(PurchaseOrder)
    private orderRepo: Repository<PurchaseOrder>,
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

  async createOrUpdatePackingList(
    orderId: number,
    data: {
      carton_length_cm: number;
      carton_width_cm: number;
      carton_height_cm: number;
      cartons_count: number;
      actual_net_weight_kg?: number;
      actual_gross_weight_kg?: number;
      deviation_threshold_percent?: number;
      notes?: string;
    },
  ) {
    const totalCbm =
      (Number(data.carton_length_cm) *
        Number(data.carton_width_cm) *
        Number(data.carton_height_cm) *
        Number(data.cartons_count)) /
      1_000_000;

    let weightDeviation: number | undefined;
    if (data.actual_gross_weight_kg && data.actual_net_weight_kg) {
      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (order?.total_weight_kg && Number(order.total_weight_kg) > 0) {
        weightDeviation =
          ((Number(data.actual_gross_weight_kg) -
            Number(order.total_weight_kg)) /
            Number(order.total_weight_kg)) *
          100;
      }
    }

    const existing = await this.packingListRepo.findOne({
      where: { order_id: orderId },
    });

    if (existing) {
      await this.packingListRepo.update(existing.id, {
        carton_length_cm: data.carton_length_cm,
        carton_width_cm: data.carton_width_cm,
        cartons_count: data.cartons_count,
        total_cbm: totalCbm,
        actual_net_weight_kg: data.actual_net_weight_kg ?? null,
        actual_gross_weight_kg: data.actual_gross_weight_kg ?? null,
        deviation_threshold_percent: data.deviation_threshold_percent ?? 5,
        notes: data.notes ?? null,
        weight_deviation_percent: weightDeviation ?? null,
      });
    } else {
      await this.packingListRepo.save(
        this.packingListRepo.create({
          order_id: orderId,
          carton_length_cm: data.carton_length_cm,
          carton_width_cm: data.carton_width_cm,
          cartons_count: data.cartons_count,
          total_cbm: totalCbm,
          actual_net_weight_kg: data.actual_net_weight_kg ?? null,
          actual_gross_weight_kg: data.actual_gross_weight_kg ?? null,
          deviation_threshold_percent: data.deviation_threshold_percent ?? 5,
          notes: data.notes ?? null,
          weight_deviation_percent: weightDeviation ?? null,
        }),
      );
    }

    const packingList = await this.packingListRepo.findOne({
      where: { order_id: orderId },
    });

    const threshold = data.deviation_threshold_percent ?? 5;
    const alert =
      weightDeviation !== undefined && Math.abs(weightDeviation) > threshold
        ? {
            type: 'WEIGHT_DEVIATION',
            message: `انحراف الوزن بنسبة ${weightDeviation.toFixed(1)}% (الحد المسموح: ${threshold}%)`,
            severity:
              Math.abs(weightDeviation) > threshold * 2
                ? ('HIGH' as const)
                : ('MEDIUM' as const),
            deviation_pct: weightDeviation,
          }
        : null;

    const cbmResult = {
      total_cbm: totalCbm,
      cartons: Number(data.cartons_count),
      length_cm: Number(data.carton_length_cm),
      width_cm: Number(data.carton_width_cm),
      height_cm: Number(data.carton_height_cm),
    };

    return {
      packing_list: packingList,
      cbm_analysis: cbmResult,
      deviation_alert: alert,
    };
  }
}

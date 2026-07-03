import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProductionSchedule,
  ScheduleStatus,
} from './entities/production-schedule.entity';

@Injectable()
export class PlanningService {
  constructor(
    @InjectRepository(ProductionSchedule)
    private scheduleRepo: Repository<ProductionSchedule>,
  ) {}

  async getAllSchedules(
    options: {
      fromDate?: string;
      toDate?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;

    const query = this.scheduleRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.machine', 'machine')
      .leftJoinAndSelect('s.mold', 'mold')
      .leftJoinAndSelect('s.product', 'product')
      .orderBy('s.planned_date', 'ASC')
      .addOrderBy('s.shift', 'ASC');

    if (options.fromDate) {
      query.andWhere('s.planned_date >= :fromDate', {
        fromDate: options.fromDate,
      });
    }
    if (options.toDate) {
      query.andWhere('s.planned_date <= :toDate', { toDate: options.toDate });
    }

    const [items, total] = await query
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async createSchedule(data: Partial<ProductionSchedule>) {
    const schedule = this.scheduleRepo.create(data);
    return this.scheduleRepo.save(schedule);
  }

  async updateSchedule(id: number, data: Partial<ProductionSchedule>) {
    await this.scheduleRepo.update(id, data);
    const updated = await this.scheduleRepo.findOne({
      where: { id },
      relations: ['machine', 'mold', 'product'],
    });
    if (!updated) throw new NotFoundException('الجدول غير موجود');
    return updated;
  }

  async deleteSchedule(id: number) {
    return this.scheduleRepo.delete(id);
  }

  async updateStatus(id: number, status: ScheduleStatus) {
    await this.scheduleRepo.update(id, { status });
    const updated = await this.scheduleRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('الجدول غير موجود');
    return updated;
  }
}

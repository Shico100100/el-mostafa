import { Injectable } from '@nestjs/common';
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

  async getAllSchedules(options: { fromDate?: string; toDate?: string } = {}) {
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

    return query.getMany();
  }

  async createSchedule(data: Partial<ProductionSchedule>) {
    const schedule = this.scheduleRepo.create(data);
    return this.scheduleRepo.save(schedule);
  }

  async updateSchedule(id: number, data: Partial<ProductionSchedule>) {
    await this.scheduleRepo.update(id, data);
    return this.scheduleRepo.findOne({
      where: { id },
      relations: ['machine', 'mold', 'product'],
    });
  }

  async deleteSchedule(id: number) {
    return this.scheduleRepo.delete(id);
  }

  async updateStatus(id: number, status: ScheduleStatus) {
    await this.scheduleRepo.update(id, { status });
    return this.scheduleRepo.findOne({ where: { id } });
  }
}

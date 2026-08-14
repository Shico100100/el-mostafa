import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodClose } from './entities/period-close.entity';

@Injectable()
export class PeriodCloseService {
  constructor(
    @InjectRepository(PeriodClose) private periodRepo: Repository<PeriodClose>,
  ) {}

  async findAll(): Promise<PeriodClose[]> {
    return this.periodRepo.find({ order: { period: 'DESC' } });
  }

  async findByPeriod(period: string): Promise<PeriodClose | null> {
    return this.periodRepo.findOne({ where: { period } });
  }

  async closePeriod(period: string, closedBy: string): Promise<PeriodClose> {
    const existing = await this.findByPeriod(period);
    if (existing && existing.status === 'CLOSED') {
      throw new BadRequestException(`Period ${period} is already closed`);
    }

    const closeRecord = existing || this.periodRepo.create({ period });
    closeRecord.status = 'CLOSED';
    closeRecord.closed_by = closedBy;
    closeRecord.closed_at = new Date();
    return this.periodRepo.save(closeRecord);
  }

  async reopenPeriod(period: string): Promise<PeriodClose> {
    const existing = await this.findByPeriod(period);
    if (!existing) throw new NotFoundException(`Period ${period} not found`);
    if (existing.status === 'OPEN')
      throw new BadRequestException(`Period ${period} is already open`);

    existing.status = 'OPEN';
    existing.closed_by = null;
    existing.closed_at = null;
    return this.periodRepo.save(existing);
  }

  async isPeriodClosed(period: string): Promise<boolean> {
    const record = await this.findByPeriod(period);
    return record?.status === 'CLOSED';
  }
}

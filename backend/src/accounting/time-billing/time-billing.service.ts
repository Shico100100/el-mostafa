import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';

@Injectable()
export class TimeBillingService {
  constructor(
    @InjectRepository(TimeEntry) private timeRepo: Repository<TimeEntry>,
  ) {}

  async findAll(filters?: {
    job_id?: number;
    user_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<TimeEntry[]> {
    const where: any = {};
    if (filters?.job_id) where.job_id = filters.job_id;
    if (filters?.user_id) where.user_id = filters.user_id;
    return this.timeRepo.find({
      where,
      relations: ['job', 'phase', 'user'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: number): Promise<TimeEntry> {
    const entry = await this.timeRepo.findOne({
      where: { id },
      relations: ['job', 'phase', 'user'],
    });
    if (!entry) throw new NotFoundException(`Time entry #${id} not found`);
    return entry;
  }

  async create(dto: CreateTimeEntryDto): Promise<TimeEntry> {
    return this.timeRepo.save(
      this.timeRepo.create({
        ...dto,
        date: new Date(dto.date),
        is_billable: dto.is_billable ?? true,
      }),
    );
  }

  async update(
    id: number,
    dto: Partial<CreateTimeEntryDto>,
  ): Promise<TimeEntry> {
    const entry = await this.findOne(id);
    if (dto.date) entry.date = new Date(dto.date);
    if (dto.hours !== undefined) entry.hours = dto.hours;
    if (dto.description !== undefined) entry.description = dto.description;
    if (dto.is_billable !== undefined) entry.is_billable = dto.is_billable;
    if (dto.billing_rate !== undefined) entry.billing_rate = dto.billing_rate;
    if (dto.job_id !== undefined) entry.job_id = dto.job_id;
    if (dto.phase_id !== undefined) entry.phase_id = dto.phase_id;
    return this.timeRepo.save(entry);
  }

  async remove(id: number): Promise<void> {
    const entry = await this.findOne(id);
    await this.timeRepo.remove(entry);
  }

  async getUnbilled(): Promise<TimeEntry[]> {
    return this.timeRepo.find({
      where: { is_billed: false, is_billable: true },
      relations: ['job', 'phase', 'user'],
      order: { date: 'ASC' },
    });
  }

  async markBilled(ids: number[]): Promise<void> {
    await this.timeRepo.update(ids, { is_billed: true });
  }

  async getSummaryByJob(jobId: number): Promise<any> {
    const entries = await this.timeRepo.find({
      where: { job_id: jobId },
      relations: ['phase'],
    });
    const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0);
    const billableHours = entries
      .filter((e) => e.is_billable)
      .reduce((s, e) => s + Number(e.hours), 0);
    const totalBillable = entries
      .filter((e) => e.is_billable)
      .reduce((s, e) => s + Number(e.hours) * Number(e.billing_rate), 0);

    const byPhase = entries.reduce(
      (acc, e) => {
        const key = e.phase?.name || 'Unassigned';
        if (!acc[key]) acc[key] = { hours: 0, billable: 0 };
        acc[key].hours += Number(e.hours);
        if (e.is_billable)
          acc[key].billable += Number(e.hours) * Number(e.billing_rate);
        return acc;
      },
      {} as Record<string, { hours: number; billable: number }>,
    );

    return {
      job_id: jobId,
      totalHours,
      billableHours,
      totalBillable,
      byPhase,
      entryCount: entries.length,
    };
  }
}

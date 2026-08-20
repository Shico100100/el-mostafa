import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { JobPhase } from './entities/job-phase.entity';
import { JobCost } from './entities/job-cost.entity';
import { CreateJobDto, CreateJobCostDto } from './dto/create-job.dto';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    @InjectRepository(JobPhase) private phaseRepo: Repository<JobPhase>,
    @InjectRepository(JobCost) private costRepo: Repository<JobCost>,
  ) {}

  async findAll(): Promise<Job[]> {
    return this.jobRepo.find({
      relations: ['customer', 'phases', 'costs'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Job> {
    const job = await this.jobRepo.findOne({
      where: { id },
      relations: ['customer', 'phases', 'phases.costs', 'costs'],
    });
    if (!job) throw new NotFoundException(`Job #${id} not found`);
    return job;
  }

  async create(dto: CreateJobDto): Promise<Job> {
    const job = this.jobRepo.create({
      name: dto.name,
      code: dto.code,
      customer_id: dto.customer_id,
      start_date: dto.start_date ? new Date(dto.start_date) : undefined,
      end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      estimated_cost: dto.estimated_cost || 0,
      estimated_revenue: dto.estimated_revenue || 0,
      status: dto.status || JobStatus.ACTIVE,
      description: dto.description,
    });
    const saved = (await this.jobRepo.save(job)) as Job;

    if (dto.phases) {
      for (const phase of dto.phases) {
        await this.phaseRepo.save(
          this.phaseRepo.create({ job_id: saved.id, ...phase }),
        );
      }
    }
    return this.findOne(saved.id);
  }

  async update(id: number, dto: Partial<CreateJobDto>): Promise<Job> {
    const job = await this.findOne(id);
    if (dto.name) job.name = dto.name;
    if (dto.code) job.code = dto.code;
    if (dto.customer_id !== undefined) job.customer_id = dto.customer_id;
    if (dto.start_date) job.start_date = new Date(dto.start_date);
    if (dto.end_date) job.end_date = new Date(dto.end_date);
    if (dto.estimated_cost !== undefined)
      job.estimated_cost = dto.estimated_cost;
    if (dto.estimated_revenue !== undefined)
      job.estimated_revenue = dto.estimated_revenue;
    if (dto.status) job.status = dto.status;
    if (dto.description !== undefined) job.description = dto.description;
    return this.jobRepo.save(job);
  }

  async addCost(dto: CreateJobCostDto): Promise<JobCost> {
    const cost = this.costRepo.create({
      ...dto,
      date: dto.date ? new Date(dto.date) : new Date(),
    });
    const saved = await this.costRepo.save(cost);

    const allCosts = await this.costRepo.find({
      where: { job_id: dto.job_id },
    });
    const totalCost = allCosts.reduce((sum, c) => sum + Number(c.amount), 0);
    await this.jobRepo.update(dto.job_id, { actual_cost: totalCost });

    return saved;
  }

  async getProfitability(
    id: number,
  ): Promise<{
    job_id: number;
    job_name: string;
    estimated_cost: number;
    actual_cost: number;
    estimated_revenue: number;
    estimated_profit: number;
    actual_profit: number;
    cost_breakdown: Record<string, number>;
  }> {
    const job = await this.findOne(id);
    const costs = await this.costRepo.find({ where: { job_id: id } });
    const byType = costs.reduce(
      (acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + Number(c.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      job_id: job.id,
      job_name: job.name,
      estimated_cost: job.estimated_cost,
      actual_cost: job.actual_cost,
      estimated_revenue: job.estimated_revenue,
      estimated_profit:
        Number(job.estimated_revenue) - Number(job.estimated_cost),
      actual_profit: Number(job.estimated_revenue) - Number(job.actual_cost),
      cost_breakdown: byType,
    };
  }

  async getSummary(): Promise<
    Array<{
      id: number;
      name: string;
      code: string;
      status: string;
      estimated_cost: number;
      actual_cost: number;
      estimated_revenue: number;
      profit: number;
    }>
  > {
    const jobs = await this.jobRepo.find({ order: { created_at: 'DESC' } });
    return jobs.map((j) => ({
      id: j.id,
      name: j.name,
      code: j.code,
      status: j.status,
      estimated_cost: j.estimated_cost,
      actual_cost: j.actual_cost,
      estimated_revenue: j.estimated_revenue,
      profit: Number(j.estimated_revenue) - Number(j.actual_cost),
    }));
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>) {
    const entry = this.repo.create(data);
    return this.repo.save(entry);
  }

  async findAll(limit = 100) {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async findByEntity(entity: string, entityId: number) {
    return this.repo.find({ where: { entityId: String(entityId) }, order: { createdAt: 'DESC' } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { DailyProduction } from './entities/daily-production.entity';
import { RangeProductionSession } from './entities/range-production-session.entity';
import { ProductionRecordHistory } from './entities/production-record-history.entity';
import { multiSheetToBuffer } from '../utils/excel-export';

@Injectable()
export class DailyProductionService {
  constructor(
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(RangeProductionSession)
    private sessionRepo: Repository<RangeProductionSession>,
    @InjectRepository(ProductionRecordHistory)
    private recordHistoryRepo: Repository<ProductionRecordHistory>,
  ) {}

  async getRecordHistory(productionId: number) {
    return this.recordHistoryRepo.find({
      where: { production_id: productionId },
      order: { changed_at: 'DESC' },
    });
  }

  async getDailyProduction(
    date?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};
    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    } else if (startDate) {
      where.date = MoreThanOrEqual(startDate);
    }
    return this.productionRepo.find({
      where,
      relations: ['machine', 'mold', 'product'],
      order: { date: 'DESC', id: 'DESC' },
    });
  }

  async getRangeSessions(page = 1, limit = 20) {
    const [sessions, total] = await this.sessionRepo.findAndCount({
      relations: ['machine', 'mold', 'product', 'createdByUser'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { sessions, total, page, limit };
  }

  async getRangeSessionById(id: number) {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['machine', 'mold', 'product', 'createdByUser'],
    });
    if (!session) throw new NotFoundException('الجلسة غير موجودة');
    const records = await this.productionRepo.find({
      where: { session_id: id },
      relations: ['machine', 'mold', 'product'],
      order: { date: 'ASC' },
    });
    return { session, records };
  }

  async exportProductionHistory() {
    const records = await this.productionRepo.find({
      relations: ['machine', 'mold', 'product'],
      order: { date: 'DESC', id: 'DESC' },
    });
    const sessions = await this.sessionRepo.find({
      relations: ['machine', 'mold', 'product', 'createdByUser'],
      order: { created_at: 'DESC' },
    });

    return multiSheetToBuffer([
      {
        name: 'Production Records',
        data: records.map((r) => ({
          ID: r.id,
          Date: r.date,
          'Machine ID': r.machine_id,
          Machine: r.machine?.name || '',
          'Mold ID': r.mold_id,
          Mold: r.mold?.name || '',
          'Raw Material ID': r.product_id,
          'Raw Material': r.product?.name || '',
          'Total KG': Number(r.total_production_kg),
          'Pieces Produced': r.pieces_produced,
          'Hours Worked': r.hours_worked,
          Notes: r.notes || '',
          Status: r.status,
          'Session ID': r.session_id || '',
        })),
      },
      {
        name: 'Range Sessions',
        data: sessions.map((s) => ({
          ID: s.id,
          'Machine ID': s.machine_id,
          Machine: s.machine?.name || '',
          'Mold ID': s.mold_id,
          Mold: s.mold?.name || '',
          'Raw Material ID': s.product_id,
          'Raw Material': s.product?.name || '',
          'Start Date': s.start_date,
          'End Date': s.end_date,
          'Total KG': Number(s.total_production_kg),
          Mode: s.mode,
          'Hours Worked': s.hours_worked,
          Notes: s.notes || '',
          'Created By': s.createdByUser
            ? `${s.createdByUser.firstName || ''} ${s.createdByUser.lastName || ''}`.trim()
            : s.created_by?.toString() || '',
          'Created At': s.created_at,
        })),
      },
      ]);
  }
}

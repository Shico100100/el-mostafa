import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mold } from './entities/mold.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { FeasibilityReportEntity } from './entities/feasibility-report.entity';
import { FeasibilityAnalysisService } from './feasibility/feasibility-analysis.service';

@Injectable()
export class ProductionFeasibilityService {
  constructor(
    private analysisService: FeasibilityAnalysisService,
    @InjectRepository(Mold)
    private moldRepo: Repository<Mold>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(FeasibilityReportEntity)
    private feasibilityReportRepo: Repository<FeasibilityReportEntity>,
  ) {}

  async analyze(items: { productId: number; quantity: number }[]) {
    return this.analysisService.analyze(items);
  }

  async saveReport(
    items: { productId: number; quantity: number }[],
    report: any,
  ): Promise<FeasibilityReportEntity> {
    const saved = this.feasibilityReportRepo.create({ items, report });
    return this.feasibilityReportRepo.save(saved);
  }

  async getSavedReports(): Promise<FeasibilityReportEntity[]> {
    return this.feasibilityReportRepo.find({ order: { created_at: 'DESC' } });
  }

  async getProductionHistory(productId: number) {
    const mold = await this.moldRepo.findOne({
      where: { product: { id: productId } },
    });
    if (!mold) {
      return {
        allDays: [],
        allAverage: 0,
        allTop10: [],
        recentDays: [],
        recentAverage: 0,
      };
    }

    const allRecords = await this.productionRepo.find({
      where: { mold: { id: mold.id } },
      relations: ['machine'],
      order: { date: 'DESC' },
    });

    const buildDaily = (records: typeof allRecords) => {
      const map = new Map<
        string,
        { pieces: number; machineName: string; hours: number }
      >();
      for (const r of records) {
        const key =
          r.date instanceof Date
            ? r.date.toISOString().split('T')[0]
            : String(r.date);
        const existing = map.get(key) || {
          pieces: 0,
          machineName: '',
          hours: 0,
        };
        existing.pieces += Number(r.pieces_produced || 0);
        existing.hours += Number(r.hours_worked || 0);
        if (r.machine?.name) existing.machineName = r.machine.name;
        map.set(key, existing);
      }
      return Array.from(map.entries()).map(([date, data]) => ({
        date,
        pieces: data.pieces,
        machineName: data.machineName,
        hours: data.hours,
      }));
    };

    const allDays = buildDaily(allRecords);
    const totalPiecesAll = allDays.reduce((s, d) => s + d.pieces, 0);
    const allAverage =
      allDays.length > 0 ? Math.round(totalPiecesAll / allDays.length) : 0;
    const allTop10 = [...allDays]
      .sort((a, b) => b.pieces - a.pieces)
      .slice(0, 10);

    const since = new Date();
    since.setDate(since.getDate() - 25);
    const recentRecords = allRecords.filter((r) => {
      const d = r.date instanceof Date ? r.date : new Date(r.date);
      return d >= since;
    });
    const recentDays = buildDaily(recentRecords);
    const totalPiecesRecent = recentDays.reduce((s, d) => s + d.pieces, 0);
    const recentAverage =
      recentDays.length > 0
        ? Math.round(totalPiecesRecent / recentDays.length)
        : 0;

    return { allDays, allAverage, allTop10, recentDays, recentAverage };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine, MachineStatus } from '../entities/machine.entity';
import {
  MachineMaintenance,
  MaintenanceStatus,
} from '../entities/machine-maintenance.entity';
import { DailyProduction } from '../entities/daily-production.entity';
import { jsonToSheetBuffer } from '../../utils/excel-export';

@Injectable()
export class MachineService {
  private readonly logger = new Logger(MachineService.name);

  constructor(
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
    @InjectRepository(MachineMaintenance)
    private maintenanceRepo: Repository<MachineMaintenance>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
  ) {}

  async getAllMachines(page = 1, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await this.machineRepo.findAndCount({
      skip,
      take,
    });
    return {
      items,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async getMachinesOverview(filters?: {
    search?: string;
    status?: MachineStatus;
    sortBy?: 'name' | 'status' | 'next_maintenance';
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }) {
    const qb = this.machineRepo.createQueryBuilder('machine');
    if (filters?.search) {
      qb.andWhere(
        '(machine.name LIKE :search OR machine.serial_number LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters?.status) {
      qb.andWhere('machine.status = :status', { status: filters.status });
    }
    if (filters?.sortBy) {
      const allowedSortCols = [
        'name',
        'status',
        'created_at',
        'purchase_date',
        'maintenance_interval_days',
      ];
      const sortCol = allowedSortCols.includes(filters.sortBy)
        ? filters.sortBy
        : 'name';
      const order = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';
      qb.orderBy(`machine.${sortCol}`, order);
    } else {
      qb.orderBy('machine.name', 'ASC');
    }
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    qb.skip((page - 1) * limit).take(limit);
    const [machines, total] = await qb.getManyAndCount();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allMachines =
      filters?.search || filters?.status
        ? machines
        : await this.machineRepo.find();
    const overdueCount = allMachines.filter((m) => {
      if (!m.next_maintenance) return false;
      const nextDate = new Date(m.next_maintenance);
      nextDate.setHours(0, 0, 0, 0);
      return nextDate < today;
    }).length;
    const statusCounts = {
      ACTIVE: allMachines.reduce(
        (c, m) => c + (m.status === MachineStatus.ACTIVE ? 1 : 0),
        0,
      ),
      INACTIVE: allMachines.reduce(
        (c, m) => c + (m.status === MachineStatus.INACTIVE ? 1 : 0),
        0,
      ),
      MAINTENANCE: allMachines.reduce(
        (c, m) => c + (m.status === MachineStatus.MAINTENANCE ? 1 : 0),
        0,
      ),
      BROKEN: allMachines.reduce(
        (c, m) => c + (m.status === MachineStatus.BROKEN ? 1 : 0),
        0,
      ),
    };
    return {
      machines,
      pagination: { total, page, limit },
      stats: { total: allMachines.length, overdueCount, statusCounts },
    };
  }

  async getMachineHistory(id: number) {
    return this.productionRepo.find({
      where: { machine: { id } },
      relations: ['mold', 'product'],
      order: { date: 'DESC', id: 'DESC' },
      take: 100,
    });
  }

  async createMachine(data: Partial<Machine>) {
    const machine = this.machineRepo.create(data);
    return this.machineRepo.save(machine);
  }

  async updateMachine(id: number, data: Partial<Machine>) {
    await this.machineRepo.update(id, data);
    return this.machineRepo.findOne({ where: { id } });
  }

  async deleteMachine(id: number) {
    return this.machineRepo.delete(id);
  }

  async getMachinesWithStatus() {
    const machines = await this.machineRepo.find();
    return Promise.all(
      machines.map(async (m) => {
        const lastProduction = await this.productionRepo.findOne({
          where: { machine: { id: m.id } },
          order: { date: 'DESC', id: 'DESC' },
          relations: ['mold', 'product'],
        });
        return {
          ...m,
          last_mold_id: lastProduction?.mold?.id || null,
          last_product_id: lastProduction?.product?.id || null,
        };
      }),
    );
  }

  async getMachineMaintenance(machineId?: number) {
    const where: any = {};
    if (machineId) where.machine = { id: machineId };
    return this.maintenanceRepo.find({
      where,
      relations: ['machine'],
      order: { date: 'DESC' },
    });
  }

  async createMaintenance(data: Partial<MachineMaintenance>) {
    const maintenance = this.maintenanceRepo.create(data);
    const saved = await this.maintenanceRepo.save(maintenance);
    if (saved.machine_id && saved.status === MaintenanceStatus.COMPLETED) {
      const machine = await this.machineRepo.findOne({
        where: { id: saved.machine_id },
      });
      if (machine) {
        const lastDate = new Date(saved.date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(
          lastDate.getDate() + (machine.maintenance_interval_days || 30),
        );
        machine.last_maintenance = lastDate;
        machine.next_maintenance = nextDate;
        await this.machineRepo.save(machine);
      }
    }
    return saved;
  }

  async exportMachines() {
    const machines = await this.machineRepo.find();
    const rows = machines.map((m) => ({
      name: m.name,
      serial_number: m.serial_number,
      status: m.status,
      price: m.price,
      purchase_date: m.purchase_date?.toISOString().split('T')[0],
      maintenance_interval_days: m.maintenance_interval_days,
      useful_life_years: m.useful_life_years,
    }));
    return jsonToSheetBuffer(rows, 'Machines');
  }

  async importMachines(data: any[]) {
    let created = 0,
      updated = 0;
    for (const row of data) {
      if (!row.name) continue;
      const existing = await this.machineRepo.findOne({
        where: { name: row.name },
      });
      if (existing) {
        await this.machineRepo.update(existing.id, row);
        updated++;
      } else {
        await this.machineRepo.save(this.machineRepo.create(row));
        created++;
      }
    }
    return { created, updated };
  }
}

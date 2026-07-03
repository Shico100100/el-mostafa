import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { UserEntity as User } from '../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getAttendance(
    date?: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 50,
  ) {
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;
    const where: any = {};
    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    const [items, total] = await this.attendanceRepo.findAndCount({
      where,
      relations: ['user'],
      order: { date: 'DESC', user: { firstName: 'ASC' } },
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

  async createAttendance(data: Partial<Attendance>) {
    const attendance = this.attendanceRepo.create(data);
    return this.attendanceRepo.save(attendance);
  }

  async updateAttendance(id: number, data: Partial<Attendance>) {
    await this.attendanceRepo.update(id, data);
    const updated = await this.attendanceRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!updated) throw new NotFoundException('سجل الحضور غير موجود');
    return updated;
  }

  async deleteAttendance(id: number) {
    return this.attendanceRepo.delete(id);
  }

  async getWorkers() {
    // Fetch only users with WORKER role or all if preferred
    // For now, let's fetch all users who can be workers
    return this.userRepo.find({
      order: { firstName: 'ASC' },
    });
  }
}

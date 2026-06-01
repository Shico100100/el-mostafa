import { Injectable } from '@nestjs/common';
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

  async getAttendance(date?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return this.attendanceRepo.find({
      where,
      relations: ['user'],
      order: { date: 'DESC', user: { firstName: 'ASC' } },
    });
  }

  async createAttendance(data: Partial<Attendance>) {
    const attendance = this.attendanceRepo.create(data);
    return this.attendanceRepo.save(attendance);
  }

  async updateAttendance(id: number, data: Partial<Attendance>) {
    await this.attendanceRepo.update(id, data);
    return this.attendanceRepo.findOne({ where: { id }, relations: ['user'] });
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

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { SalaryPayment } from './entities/salary-payment.entity';
import {
  Attendance,
  AttendanceStatus,
} from '../manufacturing/entities/attendance.entity';
import { UserEntity as User } from '../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(EmployeeProfile)
    private profileRepo: Repository<EmployeeProfile>,
    @InjectRepository(SalaryPayment)
    private paymentRepo: Repository<SalaryPayment>,
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getProfiles() {
    return this.profileRepo.find({ relations: ['user'] });
  }

  async updateProfile(userId: number, data: Partial<EmployeeProfile>) {
    let profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
    });
    if (profile) {
      await this.profileRepo.update(profile.id, data);
    } else {
      profile = this.profileRepo.create({ ...data, user_id: userId });
      await this.profileRepo.save(profile);
    }
    return this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async calculateMonthlyPayroll(month: string) {
    // month format: YYYY-MM
    const [year, mon] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const endDate = new Date(year, mon, 0).toISOString().split('T')[0];

    const users = await this.userRepo.find();
    const profiles = await this.profileRepo.find();
    const attendance = await this.attendanceRepo.find({
      where: { date: Between(startDate, endDate) },
    });

    const payrollResults = users.map((user) => {
      const profile = profiles.find((p) => p.user_id === user.id);
      const userAttendance = attendance.filter((a) => a.user_id === user.id);

      const attendanceDays = userAttendance.filter(
        (a) =>
          a.status === AttendanceStatus.PRESENT ||
          a.status === AttendanceStatus.LATE,
      ).length;
      const absentDays = userAttendance.filter(
        (a) => a.status === AttendanceStatus.ABSENT,
      ).length;
      const lateDays = userAttendance.filter(
        (a) => a.status === AttendanceStatus.LATE,
      ).length;

      const baseSalary = profile?.base_salary || 0;
      // Calculation: deduction per absent day + (late days / 3)
      const dailyRate = baseSalary / 30;
      const deductionDays = absentDays + lateDays / 3;
      const totalDeductions =
        deductionDays * dailyRate * (profile?.deduction_rate || 1);

      const netSalary = Math.max(0, baseSalary - totalDeductions);

      return {
        user,
        profile,
        month,
        baseSalary,
        attendanceDays,
        absentDays,
        deductions: totalDeductions,
        netSalary: Math.round(netSalary * 100) / 100,
      };
    });

    return payrollResults;
  }

  async savePayment(data: Partial<SalaryPayment>) {
    const existing = await this.paymentRepo.findOne({
      where: { user: { id: data.user_id }, month: data.month },
    });

    if (existing) {
      await this.paymentRepo.update(existing.id, data);
      return this.paymentRepo.findOne({
        where: { id: existing.id },
        relations: ['user'],
      });
    } else {
      const payment = this.paymentRepo.create(data);
      return this.paymentRepo.save(payment);
    }
  }

  async getPayments(month?: string) {
    const where: FindOptionsWhere<SalaryPayment> = {};
    if (month) where.month = month;
    return this.paymentRepo.find({
      where,
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { SalaryPayment } from './entities/salary-payment.entity';
import { Attendance } from '../manufacturing/entities/attendance.entity';
import { UserEntity as User } from '../users/infrastructure/persistence/relational/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeProfile,
      SalaryPayment,
      Attendance,
      User,
    ]),
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}

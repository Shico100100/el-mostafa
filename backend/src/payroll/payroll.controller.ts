import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Get('profiles')
  getProfiles() {
    return this.payrollService.getProfiles();
  }

  @Post('profiles/:userId')
  updateProfile(@Param('userId') userId: string, @Body() data: any) {
    return this.payrollService.updateProfile(+userId, data);
  }

  @Get('calculate')
  calculate(@Query('month') month: string) {
    return this.payrollService.calculateMonthlyPayroll(month);
  }

  @Get('payments')
  getPayments(@Query('month') month?: string) {
    return this.payrollService.getPayments(month);
  }

  @Post('payments')
  savePayment(@Body() data: any) {
    return this.payrollService.savePayment(data);
  }
}

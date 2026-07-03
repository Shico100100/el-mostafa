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
import { Public } from '../auth/public.decorator';
import { UpdateEmployeeProfileDto, SaveSalaryPaymentDto } from './dto';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Public()
  @Get('profiles')
  getProfiles() {
    return this.payrollService.getProfiles();
  }

  @Post('profiles/:userId')
  updateProfile(
    @Param('userId') userId: string,
    @Body() data: UpdateEmployeeProfileDto,
  ) {
    return this.payrollService.updateProfile(+userId, data);
  }

  @Public()
  @Get('calculate')
  calculate(@Query('month') month: string) {
    return this.payrollService.calculateMonthlyPayroll(month);
  }

  @Public()
  @Get('payments')
  getPayments(@Query('month') month?: string) {
    return this.payrollService.getPayments(month);
  }

  @Post('payments')
  savePayment(@Body() data: SaveSalaryPaymentDto) {
    return this.payrollService.savePayment(data);
  }
}

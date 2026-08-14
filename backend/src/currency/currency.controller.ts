import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';

@Controller('currencies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin)
export class CurrencyController {
  constructor(private readonly service: CurrencyService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('convert/:amount/:from/:to')
  convert(
    @Param('amount') amount: number,
    @Param('from') from: string,
    @Param('to') to: string,
  ) {
    return this.service.convert(amount, from, to);
  }
}

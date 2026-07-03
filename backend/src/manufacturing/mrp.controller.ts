import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MRPService } from './mrp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

@Controller('manufacturing/mrp')
@UseGuards(JwtAuthGuard)
export class MRPController {
  constructor(private mrpService: MRPService) {}

  @Get('planning')
  getPlanning() {
    return this.mrpService.getMaterialPlanning();
  }

  @Post('adhoc')
  calculateAdhocMRP(
    @Body() body: { items: { productId: number; quantity: number }[] },
  ) {
    return this.mrpService.calculateAdhocMRP(body.items);
  }
}

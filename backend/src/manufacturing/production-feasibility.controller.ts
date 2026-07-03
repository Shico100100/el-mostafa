import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ProductionFeasibilityService } from './production-feasibility.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('manufacturing/feasibility')
@UseGuards(JwtAuthGuard)
export class ProductionFeasibilityController {
  constructor(private service: ProductionFeasibilityService) {}

  @Post('analyze')
  analyze(
    @Body() body: { items: { productId: number; quantity: number }[] },
  ): Promise<any> {
    return this.service.analyze(body.items);
  }

  @Post('save')
  save(
    @Body()
    body: {
      items: { productId: number; quantity: number }[];
      report: any;
    },
  ) {
    return this.service.saveReport(body.items, body.report);
  }

  @Get('saved')
  getSaved() {
    return this.service.getSavedReports();
  }

  @Get('production-history/:productId')
  getProductionHistory(@Param('productId') productId: string) {
    return this.service.getProductionHistory(+productId);
  }
}

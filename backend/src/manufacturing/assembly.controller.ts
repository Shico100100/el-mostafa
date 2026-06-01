import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AssemblyService } from './assembly.service';

@Controller('assembly')
export class AssemblyController {
  constructor(private readonly assemblyService: AssemblyService) {}

  @Get('recipe/:productId')
  async getRecipe(
    @Param('productId') productId: number,
    @Query('quantity') quantity: number,
  ) {
    return this.assemblyService.getProductionRecipe(
      Number(productId),
      Number(quantity) || 1,
    );
  }

  @Post('record')
  async recordProduction(
    @Body()
    body: {
      productId: number;
      quantity: number;
      date?: string;
      notes?: string;
    },
  ) {
    return this.assemblyService.recordProduction({
      productId: body.productId,
      quantity: body.quantity,
      date: body.date ? new Date(body.date) : undefined,
      notes: body.notes,
    });
  }
}

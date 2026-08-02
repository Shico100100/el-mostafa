import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Controller('accounting/budgets')
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

  @Get()
  findAll() { return this.budgetService.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.budgetService.findOne(id); }

  @Post()
  create(@Body() dto: CreateBudgetDto) { return this.budgetService.create(dto); }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateBudgetDto>) { return this.budgetService.update(id, dto); }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.budgetService.remove(id); }

  @Get(':id/variance')
  getVariance(@Param('id', ParseIntPipe) id: number) { return this.budgetService.getVariance(id); }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlanningService } from './planning.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScheduleStatus } from './entities/production-schedule.entity';
import { CreateProductionScheduleDto } from './dto';

@Controller('manufacturing/planning')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private planningService: PlanningService) {}

  @Get()
  getSchedules(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.planningService.getAllSchedules({
      fromDate,
      toDate,
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
    });
  }

  @Post()
  createSchedule(@Body() data: CreateProductionScheduleDto) {
    return this.planningService.createSchedule(data);
  }

  @Put(':id')
  updateSchedule(
    @Param('id') id: string,
    @Body() data: CreateProductionScheduleDto,
  ) {
    return this.planningService.updateSchedule(+id, data);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ScheduleStatus,
  ) {
    return this.planningService.updateStatus(+id, status);
  }

  @Delete(':id')
  deleteSchedule(@Param('id') id: string) {
    return this.planningService.deleteSchedule(+id);
  }
}

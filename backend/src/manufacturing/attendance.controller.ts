import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CreateAttendanceDto } from './dto';
import { Attendance } from './entities/attendance.entity';

@Controller('manufacturing/attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get()
  getAttendance(
    @Query('date') date?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.attendanceService.getAttendance(
      date,
      startDate,
      endDate,
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Public()
  @Get('workers')
  getWorkers() {
    return this.attendanceService.getWorkers();
  }

  @Post()
  createAttendance(@Body() data: CreateAttendanceDto) {
    return this.attendanceService.createAttendance(
      data as unknown as Partial<Attendance>,
    );
  }

  @Put(':id')
  updateAttendance(@Param('id') id: string, @Body() data: CreateAttendanceDto) {
    return this.attendanceService.updateAttendance(
      +id,
      data as unknown as Partial<Attendance>,
    );
  }

  @Delete(':id')
  deleteAttendance(@Param('id') id: string) {
    return this.attendanceService.deleteAttendance(+id);
  }
}

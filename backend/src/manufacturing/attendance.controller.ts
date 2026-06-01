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

@Controller('manufacturing/attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get()
  getAttendance(
    @Query('date') date?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.attendanceService.getAttendance(date, startDate, endDate);
  }

  @Get('workers')
  getWorkers() {
    return this.attendanceService.getWorkers();
  }

  @Post()
  createAttendance(@Body() data: any) {
    return this.attendanceService.createAttendance(data);
  }

  @Put(':id')
  updateAttendance(@Param('id') id: string, @Body() data: any) {
    return this.attendanceService.updateAttendance(+id, data);
  }

  @Delete(':id')
  deleteAttendance(@Param('id') id: string) {
    return this.attendanceService.deleteAttendance(+id);
  }
}

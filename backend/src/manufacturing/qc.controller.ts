import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { QCService } from './qc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { CreateQCInspectionDto } from './dto';

@Controller('manufacturing/qc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QCController {
  constructor(private readonly qcService: QCService) {}

  @Get('pending')
  getPending() {
    return this.qcService.getPendingInspections();
  }

  @Get('recent')
  getRecent(@Query('limit') limit: number) {
    return this.qcService.getRecentInspections(limit);
  }

  @Get('stats')
  getStats() {
    return this.qcService.getStats();
  }

  @Post()
  create(@Body() data: CreateQCInspectionDto, @Request() req: any) {
    // Automatically set the inspector_id from the logged in user
    return this.qcService.createInspection({
      ...data,
      inspector_id: req.user.id,
    });
  }
}

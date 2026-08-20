import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { ManufacturingService } from './manufacturing.service';
import { DailyProductionService } from './daily-production.service';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import {
  CreateDailyProductionDto,
  CreateRangeProductionDto,
} from './dto';
import { excelFileFilter } from '../common/file-filter';
import { sheetToJson } from '../utils/excel-export';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('Production')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class ProductionController {
  constructor(
    private manufacturingService: ManufacturingService,
    private dailyProductionService: DailyProductionService,
  ) {}

  @Get('production')
  @ApiOperation({ summary: 'Get daily production records' })
  @ApiResponse({ status: 200, description: 'Returns production records' })
  getDailyProduction(
    @Query('date') date?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.dailyProductionService.getDailyProduction(
      date,
      startDate,
      endDate,
    );
  }

  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.worker)
  @Post('production')
  @ApiOperation({ summary: 'Create a production record' })
  @ApiResponse({ status: 201, description: 'Production record created' })
  async createProduction(@Body() data: CreateDailyProductionDto) {
    return await this.manufacturingService.createProduction(data);
  }

  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.worker)
  @Post('production/range')
  @ApiOperation({ summary: 'Create range production records' })
  @ApiResponse({ status: 201, description: 'Range production created' })
  async createRangeProduction(
    @Body() data: CreateRangeProductionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id?: number };
    return await this.manufacturingService.createRangeProduction({
      ...data,
      user_id: user?.id,
    });
  }

  @Get('production/sessions')
  @ApiOperation({ summary: 'Get range production sessions' })
  @ApiResponse({ status: 200, description: 'Returns production sessions' })
  getRangeSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dailyProductionService.getRangeSessions(
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get('production/sessions/:id')
  @ApiOperation({ summary: 'Get a range production session by ID' })
  @ApiResponse({ status: 200, description: 'Returns the session' })
  getRangeSession(@Param('id') id: string) {
    return this.dailyProductionService.getRangeSessionById(+id);
  }

  @Delete('production/sessions/:id')
  @ApiOperation({ summary: 'Delete a range production session' })
  @ApiResponse({ status: 200, description: 'Session deleted' })
  deleteRangeSession(@Param('id') id: string) {
    return this.manufacturingService.deleteRangeSession(+id);
  }

  @Put('production/:id')
  @ApiOperation({ summary: 'Update a production record' })
  @ApiResponse({ status: 200, description: 'Production updated' })
  updateProduction(
    @Param('id') id: string,
    @Body() data: CreateDailyProductionDto,
  ) {
    return this.manufacturingService.updateProduction(+id, data);
  }

  @Get('production/:id/history')
  @ApiOperation({ summary: 'Get change history for a production record' })
  @ApiResponse({
    status: 200,
    description: 'Returns production record history',
  })
  getProductionRecordHistory(@Param('id') id: string) {
    return this.dailyProductionService.getRecordHistory(+id);
  }

  @Delete('production/:id')
  @ApiOperation({ summary: 'Delete a production record' })
  @ApiResponse({ status: 200, description: 'Production deleted' })
  deleteProduction(@Param('id') id: string) {
    return this.manufacturingService.deleteProduction(+id);
  }

  @Get('export/production-history')
  @ApiOperation({ summary: 'Export production history to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
  async exportProductionHistory(@Res() res: Response) {
    const buffer = await this.dailyProductionService.exportProductionHistory();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=production-history.xlsx',
    });
    res.send(buffer);
  }

  @Post('import/production-history')
  @UseInterceptors(FileInterceptor('file', { fileFilter: excelFileFilter }))
  @ApiOperation({ summary: 'Import production history from Excel' })
  @ApiResponse({ status: 201, description: 'Production history imported' })
  async importProductionHistory(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.manufacturingService.importProductionHistory(data as any[]);
  }
}

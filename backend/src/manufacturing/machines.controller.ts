import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { MachineService } from './machines/machine.service';
import { MachineStatus } from './entities/machine.entity';
import { CreateMachineDto } from './dto';
import { excelFileFilter } from '../common/file-filter';
import { sheetToJson } from '../utils/excel-export';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Machines')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class MachinesController {
  constructor(private machineService: MachineService) {}

  @Get('machines/status')
  @ApiOperation({ summary: 'Get machines with current status' })
  @ApiResponse({ status: 200, description: 'Returns machine statuses' })
  getMachinesStatus() {
    return this.machineService.getMachinesWithStatus();
  }

  @Get('machines')
  @ApiOperation({ summary: 'Get all machines' })
  @ApiResponse({ status: 200, description: 'Returns paginated machines' })
  getAllMachines(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.machineService.getAllMachines(
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Get('machines/overview')
  @ApiOperation({ summary: 'Get machines overview with filters' })
  @ApiResponse({ status: 200, description: 'Returns machines overview' })
  getMachinesOverview(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: 'name' | 'status' | 'next_maintenance',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.machineService.getMachinesOverview({
      search,
      status: status as MachineStatus,
      sortBy,
      sortOrder,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Post('machines')
  @ApiOperation({ summary: 'Create a machine' })
  @ApiResponse({ status: 201, description: 'Machine created' })
  createMachine(@Body() data: CreateMachineDto) {
    return this.machineService.createMachine(data);
  }

  @Put('machines/:id')
  @ApiOperation({ summary: 'Update a machine' })
  @ApiResponse({ status: 200, description: 'Machine updated' })
  updateMachine(@Param('id') id: string, @Body() data: CreateMachineDto) {
    return this.machineService.updateMachine(+id, data);
  }

  @Post('machines/:id/calculate-depreciation')
  @ApiOperation({ summary: 'Queue depreciation calculation for a machine' })
  @ApiResponse({ status: 201, description: 'Depreciation job queued' })
  calculateMachineDepreciation(@Param('id') id: string) {
    return this.machineService.queueDepreciationCalculation(+id);
  }

  @Post('machines/calculate-all-depreciation')
  @ApiOperation({ summary: 'Queue depreciation for all machines' })
  @ApiResponse({ status: 201, description: 'All depreciation jobs queued' })
  calculateAllDepreciation() {
    return this.machineService.queueAllDepreciation();
  }

  @Get('machines/:id/history')
  @ApiOperation({ summary: 'Get machine history' })
  @ApiResponse({ status: 200, description: 'Returns machine history' })
  getMachineHistory(@Param('id') id: string) {
    return this.machineService.getMachineHistory(+id);
  }

  @Get('export/machines')
  @ApiOperation({ summary: 'Export machines to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
  async exportMachines(@Res() res: Response) {
    const buffer = await this.machineService.exportMachines();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=machines.xlsx',
    });
    res.send(buffer);
  }

  @Post('import/machines')
  @UseInterceptors(FileInterceptor('file', { fileFilter: excelFileFilter }))
  @ApiOperation({ summary: 'Import machines from Excel' })
  @ApiResponse({ status: 201, description: 'Machines imported' })
  async importMachines(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.machineService.importMachines(data as any[]);
  }
}

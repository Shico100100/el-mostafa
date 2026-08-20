import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MachineService } from './machines/machine.service';
import { CreateMaintenanceDto } from './dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Maintenance')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class MaintenanceController {
  constructor(private machineService: MachineService) {}

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance records' })
  @ApiResponse({ status: 200, description: 'Returns maintenance records' })
  getMaintenance(@Query('machine_id') machineId?: string) {
    return this.machineService.getMachineMaintenance(
      machineId ? +machineId : undefined,
    );
  }

  @Post('maintenance')
  @ApiOperation({ summary: 'Create a maintenance record' })
  @ApiResponse({ status: 201, description: 'Maintenance record created' })
  createMaintenance(@Body() data: CreateMaintenanceDto) {
    return this.machineService.createMaintenance(data);
  }
}

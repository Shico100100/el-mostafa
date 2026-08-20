import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ManufacturingService } from './manufacturing.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Manufacturing Orders')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class ManufacturingOrdersController {
  constructor(private manufacturingService: ManufacturingService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get manufacturing statistics' })
  @ApiResponse({ status: 200, description: 'Returns manufacturing stats' })
  async getManufacturingStats() {
    return this.manufacturingService.getManufacturingStats();
  }

  @Get('manufacturing-orders')
  @ApiOperation({ summary: 'Get all manufacturing orders' })
  @ApiResponse({ status: 200, description: 'Returns manufacturing orders' })
  getManufacturingOrders() {
    return this.manufacturingService.getManufacturingOrders();
  }

  @Get('manufacturing-orders/:id')
  @ApiOperation({ summary: 'Get a manufacturing order by ID' })
  @ApiResponse({ status: 200, description: 'Returns the manufacturing order' })
  getManufacturingOrder(@Param('id') id: string) {
    return this.manufacturingService.getManufacturingOrder(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FixedCostService } from './fixed-cost.service';
import { CreateFixedCostDto } from './dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Fixed Costs')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class FixedCostsController {
  constructor(private fixedCostService: FixedCostService) {}

  @Get('fixed-costs')
  @ApiOperation({ summary: 'Get fixed costs' })
  @ApiResponse({ status: 200, description: 'Returns fixed costs' })
  getFixedCosts(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.fixedCostService.getFixedCosts(
      month,
      year,
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Post('fixed-costs')
  @ApiOperation({ summary: 'Create a fixed cost' })
  @ApiResponse({ status: 201, description: 'Fixed cost created' })
  createFixedCost(@Body() data: CreateFixedCostDto) {
    return this.fixedCostService.createFixedCost(data);
  }

  @Delete('fixed-costs/:id')
  deleteFixedCost(@Param('id') id: string) {
    return this.fixedCostService.deleteFixedCost(+id);
  }

  @Get('overhead-rate')
  getOverheadRate(@Query('month') month: string) {
    return this.fixedCostService.calculateOverheadRate(month);
  }
}

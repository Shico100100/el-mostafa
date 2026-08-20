import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BOMService } from './bom.service';
import { BOM } from './entities/bom.entity';
import { CreateBOMDto } from './dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('BOMs')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class BOMsController {
  constructor(private bomService: BOMService) {}

  @Get('boms')
  @ApiOperation({ summary: 'Get all BOMs' })
  @ApiResponse({ status: 200, description: 'Returns paginated BOMs' })
  getBOMs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.bomService.getBOMs(page ? +page : 1, limit ? +limit : 50);
  }

  @Post('boms')
  @ApiOperation({ summary: 'Create a BOM' })
  @ApiResponse({ status: 201, description: 'BOM created' })
  createBOM(@Body() data: CreateBOMDto) {
    return this.bomService.createBOM(data as unknown as Partial<BOM>);
  }

  @Get('boms/:id')
  @ApiOperation({ summary: 'Get a BOM by ID' })
  @ApiResponse({ status: 200, description: 'Returns the BOM' })
  getBOM(@Param('id') id: string) {
    return this.bomService.getBOM(+id);
  }

  @Put('boms/:id')
  @ApiOperation({ summary: 'Update a BOM' })
  @ApiResponse({ status: 200, description: 'BOM updated' })
  updateBOM(@Param('id') id: string, @Body() data: CreateBOMDto) {
    return this.bomService.updateBOM(+id, data);
  }

  @Delete('boms/:id')
  @ApiOperation({ summary: 'Delete a BOM' })
  @ApiResponse({ status: 200, description: 'BOM deleted' })
  deleteBOM(@Param('id') id: string) {
    return this.bomService.deleteBOM(+id);
  }

  @Get('boms/:id/cost')
  @ApiOperation({ summary: 'Calculate production cost for a BOM' })
  @ApiResponse({ status: 200, description: 'Returns production cost' })
  calculateProductionCost(
    @Param('id') id: string,
    @Query('quantity') quantity?: string,
  ) {
    return this.bomService.calculateProductionCost(
      +id,
      quantity ? +quantity : 1,
    );
  }

  @Get('boms/:id/explode')
  @ApiOperation({ summary: 'Explode a BOM' })
  @ApiResponse({ status: 200, description: 'Returns exploded BOM' })
  explodeBOM(@Param('id') id: string, @Query('quantity') quantity?: string) {
    return this.bomService.explodeBOM(+id, quantity ? +quantity : 1);
  }
}

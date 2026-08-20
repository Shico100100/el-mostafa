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
import { MoldService } from './mold.service';
import { CreateMoldDto, CreateMoldIssueDto } from './dto';
import { excelFileFilter } from '../common/file-filter';
import { sheetToJson } from '../utils/excel-export';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Molds')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class MoldsController {
  constructor(private moldService: MoldService) {}

  @Get('molds')
  @ApiOperation({ summary: 'Get all molds' })
  @ApiResponse({ status: 200, description: 'Returns paginated molds' })
  getAllMolds(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.moldService.getAllMolds(page ? +page : 1, limit ? +limit : 50);
  }

  @Post('molds')
  @ApiOperation({ summary: 'Create a mold' })
  @ApiResponse({ status: 201, description: 'Mold created' })
  createMold(@Body() data: CreateMoldDto) {
    return this.moldService.createMold(data);
  }

  @Put('molds/:id')
  @ApiOperation({ summary: 'Update a mold' })
  @ApiResponse({ status: 200, description: 'Mold updated' })
  updateMold(@Param('id') id: string, @Body() data: CreateMoldDto) {
    return this.moldService.updateMold(+id, data);
  }

  @Post('sync-molds')
  syncAllMoldProducts() {
    return this.moldService.syncAllMoldProducts();
  }

  @Post('recalculate-semi-finished-costs')
  recalculateSemiFinishedCosts() {
    return this.moldService.recalculateSemiFinishedCosts();
  }

  @Get('semi-finished-products/:id/details')
  getSemiFinishedDetails(@Param('id') id: string) {
    return this.moldService.getSemiFinishedDetails(+id);
  }

  @Get('molds/:id/history')
  @ApiOperation({ summary: 'Get mold history' })
  @ApiResponse({ status: 200, description: 'Returns mold history' })
  getMoldHistory(@Param('id') id: string) {
    return this.moldService.getMoldHistory(+id);
  }

  @Get('mold-issues')
  getMoldIssues(@Query('mold_id') moldId?: string) {
    return this.moldService.getMoldIssues(moldId ? +moldId : undefined);
  }

  @Post('mold-issues')
  createMoldIssue(@Body() data: CreateMoldIssueDto) {
    return this.moldService.createMoldIssue(data);
  }

  @Put('mold-issues/:id')
  updateMoldIssue(@Param('id') id: string, @Body() data: CreateMoldIssueDto) {
    return this.moldService.updateMoldIssue(+id, data);
  }

  @Get('molds/:id/stats')
  getMoldStats(@Param('id') id: string) {
    return this.moldService.getMoldStats(+id);
  }

  @Get('machines/:id/last-mold')
  @ApiOperation({ summary: 'Get last mold for a machine' })
  @ApiResponse({ status: 200, description: 'Returns last mold' })
  getLastMold(@Param('id') id: string) {
    return this.moldService.getLastMoldForMachine(+id);
  }

  @Get('export/molds')
  @ApiOperation({ summary: 'Export molds to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
  async exportMolds(@Res() res: Response) {
    const buffer = await this.moldService.exportMolds();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=molds.xlsx',
    });
    res.send(buffer);
  }

  @Post('import/molds')
  @UseInterceptors(FileInterceptor('file', { fileFilter: excelFileFilter }))
  @ApiOperation({ summary: 'Import molds from Excel' })
  @ApiResponse({ status: 201, description: 'Molds imported' })
  async importMolds(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.moldService.importMolds(data as any[]);
  }
}

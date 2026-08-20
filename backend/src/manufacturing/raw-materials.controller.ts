import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
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
import { RawMaterialService } from './raw-material.service';
import { MovementType } from '../inventory/entities/stock-movement.entity';
import {
  CreateRawMaterialDto,
  RecordConsumptionDto,
  AddRawMaterialStockDto,
  CreateSupplierMaterialDto,
  CreateManufacturingStockMovementDto,
} from './dto';
import { excelFileFilter } from '../common/file-filter';
import { sheetToJson } from '../utils/excel-export';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Raw Materials')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class RawMaterialsController {
  constructor(private rawMaterialService: RawMaterialService) {}

  @Get('raw-materials')
  @ApiOperation({ summary: 'Get all raw materials' })
  @ApiResponse({ status: 200, description: 'Returns all raw materials' })
  getRawMaterials() {
    return this.rawMaterialService.getRawMaterials();
  }

  @Get('raw-materials/:id')
  @ApiOperation({ summary: 'Get a raw material by ID' })
  @ApiResponse({ status: 200, description: 'Returns the raw material' })
  getRawMaterial(@Param('id') id: string) {
    return this.rawMaterialService.getRawMaterial(+id);
  }

  @Post('raw-materials')
  @ApiOperation({ summary: 'Create a raw material' })
  @ApiResponse({ status: 201, description: 'Raw material created' })
  createRawMaterial(@Body() data: CreateRawMaterialDto) {
    return this.rawMaterialService.createRawMaterial(data);
  }

  @Put('raw-materials/:id')
  @ApiOperation({ summary: 'Update a raw material' })
  @ApiResponse({ status: 200, description: 'Raw material updated' })
  updateRawMaterial(
    @Param('id') id: string,
    @Body() data: CreateRawMaterialDto,
  ) {
    return this.rawMaterialService.updateRawMaterial(+id, data);
  }

  @Delete('raw-materials/:id')
  @ApiOperation({ summary: 'Delete a raw material' })
  @ApiResponse({ status: 200, description: 'Raw material deleted' })
  deleteRawMaterial(@Param('id') id: string) {
    return this.rawMaterialService.deleteRawMaterial(+id);
  }

  @Get('raw-materials/consumption/history')
  @ApiOperation({ summary: 'Get consumption history' })
  @ApiResponse({ status: 200, description: 'Returns consumption history' })
  getConsumptionHistory(
    @Query('raw_material_id') rawMaterialId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: {
      product_id?: number;
      start_date?: Date;
      end_date?: Date;
      page?: number;
      limit?: number;
    } = {};
    if (rawMaterialId) filters.product_id = +rawMaterialId;
    if (startDate) filters.start_date = new Date(startDate);
    if (endDate) filters.end_date = new Date(endDate);
    filters.page = page ? +page : 1;
    filters.limit = limit ? +limit : 50;
    return this.rawMaterialService.getConsumptionHistory(filters);
  }

  @Post('raw-materials/consumption')
  @ApiOperation({ summary: 'Record raw material consumption' })
  @ApiResponse({ status: 201, description: 'Consumption recorded' })
  recordConsumption(@Body() data: RecordConsumptionDto) {
    return this.rawMaterialService.recordConsumption(data);
  }

  @Get('raw-materials/alerts/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiResponse({ status: 200, description: 'Returns low stock alerts' })
  getLowStockAlerts() {
    return this.rawMaterialService.getLowStockAlerts();
  }

  @Get('suppliers/:id/materials')
  getSupplierMaterials(@Param('id') id: string) {
    return this.rawMaterialService.getSupplierMaterials(+id);
  }

  @Get('raw-materials/:id/suppliers')
  getMaterialSuppliers(@Param('id') id: string) {
    return this.rawMaterialService.getMaterialSuppliers(+id);
  }

  @Post('raw-materials/:id/suppliers')
  addSupplierMaterial(
    @Param('id') id: string,
    @Body() data: CreateSupplierMaterialDto,
  ) {
    return this.rawMaterialService.addSupplierMaterial({
      ...data,
      product_id: +id,
    });
  }

  @Put('supplier-materials/:id')
  updateSupplierMaterial(
    @Param('id') id: string,
    @Body() data: CreateSupplierMaterialDto,
  ) {
    return this.rawMaterialService.updateSupplierMaterial(+id, data);
  }

  @Post('raw-materials/:id/purchase')
  @ApiOperation({ summary: 'Add stock to a raw material' })
  @ApiResponse({ status: 201, description: 'Stock added' })
  async addRawMaterialStock(
    @Param('id') id: string,
    @Body() data: AddRawMaterialStockDto,
  ) {
    return await this.rawMaterialService.addRawMaterialStock({
      ...data,
      product_id: +id,
      date: data.date ? new Date(data.date) : new Date(),
    });
  }

  @Get('raw-materials/:id/movements')
  getRawMaterialMovements(@Param('id') id: string) {
    return this.rawMaterialService.getRawMaterialMovements(+id);
  }

  @Get('stock-movements')
  @ApiOperation({ summary: 'Get all stock movements' })
  @ApiResponse({ status: 200, description: 'Returns stock movements' })
  getAllStockMovements(
    @Query('type') type?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.rawMaterialService.getAllStockMovements({
      type: type as MovementType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Delete('stock-movements/:id')
  deleteStockMovement(@Param('id') id: string) {
    return this.rawMaterialService.deleteStockMovement(+id);
  }

  @Patch('stock-movements/:id')
  updateStockMovement(
    @Param('id') id: string,
    @Body() data: Partial<CreateManufacturingStockMovementDto>,
  ) {
    return this.rawMaterialService.updateStockMovement(+id, data);
  }

  @Post('stock-movements')
  createStockMovement(@Body() data: CreateManufacturingStockMovementDto) {
    return this.rawMaterialService.createStockMovement(data);
  }

  @Post('raw-materials/:id/recalculate')
  recalculateStock(@Param('id') id: string) {
    return this.rawMaterialService.recalculateRawMaterialStock(+id);
  }

  @Get('export/raw-materials')
  @ApiOperation({ summary: 'Export raw materials to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
  async exportRawMaterials(@Res() res: Response) {
    const buffer = await this.rawMaterialService.exportRawMaterials();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=raw-materials.xlsx',
    });
    res.send(buffer);
  }

  @Post('import/raw-materials')
  @UseInterceptors(FileInterceptor('file', { fileFilter: excelFileFilter }))
  @ApiOperation({ summary: 'Import raw materials from Excel' })
  @ApiResponse({ status: 201, description: 'Raw materials imported' })
  async importRawMaterials(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.rawMaterialService.importRawMaterials(data as any[]);
  }
}

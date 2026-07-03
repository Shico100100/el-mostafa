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
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { ManufacturingService } from './manufacturing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { sheetToJson } from '../utils/excel-export';
import { Public } from '../auth/public.decorator';
import {
  CreateMachineDto,
  CreateMoldDto,
  CreateBOMDto,
  CreateAssemblyOrderDto,
  CreateMaintenanceDto,
  CreateMoldIssueDto,
  CreateRawMaterialDto,
  CreateFixedCostDto,
  CreateDailyProductionDto,
  CreateRangeProductionDto,
  RecordConsumptionDto,
  AddRawMaterialStockDto,
  CreateSupplierMaterialDto,
  CreateManufacturingStockMovementDto,
} from './dto';
import { BOM } from './entities/bom.entity';
import { MachineStatus } from './entities/machine.entity';
import { MovementType } from '../inventory/entities/stock-movement.entity';

@ApiTags('Manufacturing')
@Controller('manufacturing')
@UseGuards(JwtAuthGuard)
export class ManufacturingController {
  private readonly logger = new Logger(ManufacturingController.name);

  constructor(private manufacturingService: ManufacturingService) {}

  // ==================== IMPORT / EXPORT (Moved to Top) ====================

  @Get('stats')
  async getManufacturingStats() {
    return this.manufacturingService.getManufacturingStats();
  }

  @Public()
  @Get('export/machines')
  async exportMachines(@Res() res: Response) {
    const buffer = await this.manufacturingService.exportMachines();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=machines.xlsx',
    });
    res.send(buffer);
  }

  @Post('import/machines')
  @UseInterceptors(FileInterceptor('file'))
  async importMachines(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.manufacturingService.importMachines(data);
  }

  @Public()
  @Get('export/molds')
  async exportMolds(@Res() res: Response) {
    const buffer = await this.manufacturingService.exportMolds();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=molds.xlsx',
    });
    res.send(buffer);
  }

  @Post('import/molds')
  @UseInterceptors(FileInterceptor('file'))
  async importMolds(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.manufacturingService.importMolds(data);
  }

  @Public()
  @Get('export/raw-materials')
  async exportRawMaterials(@Res() res: Response) {
    const buffer = await this.manufacturingService.exportRawMaterials();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=raw-materials.xlsx',
    });
    res.send(buffer);
  }

  @Post('import/raw-materials')
  @UseInterceptors(FileInterceptor('file'))
  async importRawMaterials(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.manufacturingService.importRawMaterials(data);
  }

  // Upload Image
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/${file.filename}` };
  }

  // History
  @Get('machines/:id/history')
  getMachineHistory(@Param('id') id: string) {
    return this.manufacturingService.getMachineHistory(+id);
  }

  @Get('molds/:id/history')
  getMoldHistory(@Param('id') id: string) {
    return this.manufacturingService.getMoldHistory(+id);
  }

  // BOMs
  @Get('boms')
  getBOMs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.manufacturingService.getBOMs(
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Post('boms')
  createBOM(@Body() data: CreateBOMDto) {
    return this.manufacturingService.createBOM(data as unknown as Partial<BOM>);
  }

  @Get('boms/:id')
  getBOM(@Param('id') id: string) {
    return this.manufacturingService.getBOM(+id);
  }

  @Put('boms/:id')
  updateBOM(@Param('id') id: string, @Body() data: CreateBOMDto) {
    return this.manufacturingService.updateBOM(+id, data);
  }

  @Delete('boms/:id')
  deleteBOM(@Param('id') id: string) {
    return this.manufacturingService.deleteBOM(+id);
  }

  // Assembly
  @Post('assembly')
  createAssembly(@Body() data: CreateAssemblyOrderDto) {
    return this.manufacturingService.createAssembly(data);
  }

  @Get('assembly')
  getAssemblyOrders() {
    return this.manufacturingService.getAssemblyOrders();
  }

  // Machines
  @Get('machines/status')
  getMachinesStatus() {
    return this.manufacturingService.getMachinesWithStatus();
  }

  @Get('machines')
  getAllMachines(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.manufacturingService.getAllMachines(
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Get('machines/overview')
  getMachinesOverview(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: 'name' | 'status' | 'next_maintenance',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.manufacturingService.getMachinesOverview({
      search,
      status: status as MachineStatus,
      sortBy,
      sortOrder,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Post('machines')
  createMachine(@Body() data: CreateMachineDto) {
    return this.manufacturingService.createMachine(data);
  }

  @Put('machines/:id')
  updateMachine(@Param('id') id: string, @Body() data: CreateMachineDto) {
    return this.manufacturingService.updateMachine(+id, data);
  }

  // Maintenance
  @Get('maintenance')
  getMaintenance(@Query('machine_id') machineId?: string) {
    return this.manufacturingService.getMachineMaintenance(
      machineId ? +machineId : undefined,
    );
  }

  @Post('maintenance')
  createMaintenance(@Body() data: CreateMaintenanceDto) {
    return this.manufacturingService.createMaintenance(data);
  }

  // Molds
  @Get('molds')
  getAllMolds(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.manufacturingService.getAllMolds(
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Post('molds')
  createMold(@Body() data: CreateMoldDto) {
    return this.manufacturingService.createMold(data);
  }

  @Put('molds/:id')
  updateMold(@Param('id') id: string, @Body() data: CreateMoldDto) {
    return this.manufacturingService.updateMold(+id, data);
  }

  @Post('sync-molds')
  syncAllMoldProducts() {
    return this.manufacturingService.syncAllMoldProducts();
  }

  @Post('recalculate-semi-finished-costs')
  recalculateSemiFinishedCosts() {
    return this.manufacturingService.recalculateSemiFinishedCosts();
  }

  @Get('semi-finished-products/:id/details')
  getSemiFinishedDetails(@Param('id') id: string) {
    return this.manufacturingService.getSemiFinishedDetails(+id);
  }

  // Mold Issues
  @Get('mold-issues')
  getMoldIssues(@Query('mold_id') moldId?: string) {
    return this.manufacturingService.getMoldIssues(
      moldId ? +moldId : undefined,
    );
  }

  @Post('mold-issues')
  createMoldIssue(@Body() data: CreateMoldIssueDto) {
    return this.manufacturingService.createMoldIssue(data);
  }

  @Put('mold-issues/:id')
  updateMoldIssue(@Param('id') id: string, @Body() data: CreateMoldIssueDto) {
    return this.manufacturingService.updateMoldIssue(+id, data);
  }

  @Get('molds/:id/stats')
  getMoldStats(@Param('id') id: string) {
    return this.manufacturingService.getMoldStats(+id);
  }

  // Production
  @Get('production')
  getDailyProduction(
    @Query('date') date?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.manufacturingService.getDailyProduction(
      date,
      startDate,
      endDate,
    );
  }

  @Post('production')
  async createProduction(@Body() data: CreateDailyProductionDto) {
    try {
      return await this.manufacturingService.createProduction(data);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('❌ createProduction failed:', message);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to create production',
      );
    }
  }

  @Post('production/range')
  async createRangeProduction(
    @Body() data: CreateRangeProductionDto,
    @Req() req: any,
  ) {
    try {
      return await this.manufacturingService.createRangeProduction({
        ...data,
        user_id: req.user?.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('❌ createRangeProduction failed:', message);
      throw new InternalServerErrorException(message);
    }
  }

  @Get('production/sessions')
  getRangeSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.manufacturingService.getRangeSessions(
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get('production/sessions/:id')
  getRangeSession(@Param('id') id: string) {
    return this.manufacturingService.getRangeSessionById(+id);
  }

  @Delete('production/sessions/:id')
  deleteRangeSession(@Param('id') id: string) {
    return this.manufacturingService.deleteRangeSession(+id);
  }

  @Get('production/:id/history')
  getProductionHistory(@Param('id') id: string) {
    return this.manufacturingService.getProductionHistory(+id);
  }

  @Put('production/:id')
  updateProduction(
    @Param('id') id: string,
    @Body() data: CreateDailyProductionDto,
  ) {
    return this.manufacturingService.updateProduction(+id, data);
  }

  @Delete('production/:id')
  deleteProduction(@Param('id') id: string) {
    return this.manufacturingService.deleteProduction(+id);
  }

  @Public()
  @Get('export/production-history')
  async exportProductionHistory(@Res() res: Response) {
    const buffer = await this.manufacturingService.exportProductionHistory();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=production-history.xlsx',
    });
    res.send(buffer);
  }

  @Post('import/production-history')
  @UseInterceptors(FileInterceptor('file'))
  async importProductionHistory(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.manufacturingService.importProductionHistory(data);
  }

  @Get('machines/:id/last-mold')
  getLastMold(@Param('id') id: string) {
    return this.manufacturingService.getLastMoldForMachine(+id);
  }

  // ==================== RAW MATERIALS ====================

  // Get all raw materials
  @Get('raw-materials')
  getRawMaterials() {
    return this.manufacturingService.getRawMaterials();
  }

  // Get single raw material
  @Get('raw-materials/:id')
  getRawMaterial(@Param('id') id: string) {
    return this.manufacturingService.getRawMaterial(+id);
  }

  // Create raw material
  @Post('raw-materials')
  createRawMaterial(@Body() data: CreateRawMaterialDto) {
    return this.manufacturingService.createRawMaterial(data);
  }

  // Update raw material
  @Put('raw-materials/:id')
  updateRawMaterial(
    @Param('id') id: string,
    @Body() data: CreateRawMaterialDto,
  ) {
    return this.manufacturingService.updateRawMaterial(+id, data);
  }

  // Delete raw material
  @Delete('raw-materials/:id')
  deleteRawMaterial(@Param('id') id: string) {
    return this.manufacturingService.deleteRawMaterial(+id);
  }

  // Get consumption history
  @Get('raw-materials/consumption/history')
  getConsumptionHistory(
    @Query('raw_material_id') rawMaterialId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (rawMaterialId) filters.product_id = +rawMaterialId;
    if (startDate) filters.start_date = new Date(startDate);
    if (endDate) filters.end_date = new Date(endDate);
    filters.page = page ? +page : 1;
    filters.limit = limit ? +limit : 50;
    return this.manufacturingService.getConsumptionHistory(filters);
  }

  // Record consumption
  @Post('raw-materials/consumption')
  recordConsumption(@Body() data: RecordConsumptionDto) {
    return this.manufacturingService.recordConsumption(data);
  }

  // Get low stock alerts
  @Get('raw-materials/alerts/low-stock')
  getLowStockAlerts() {
    return this.manufacturingService.getLowStockAlerts();
  }

  // Get supplier materials
  @Get('suppliers/:id/materials')
  getSupplierMaterials(@Param('id') id: string) {
    return this.manufacturingService.getSupplierMaterials(+id);
  }

  // Get material suppliers
  @Get('raw-materials/:id/suppliers')
  getMaterialSuppliers(@Param('id') id: string) {
    return this.manufacturingService.getMaterialSuppliers(+id);
  }

  // Add supplier to material
  @Post('raw-materials/:id/suppliers')
  addSupplierMaterial(
    @Param('id') id: string,
    @Body() data: CreateSupplierMaterialDto,
  ) {
    return this.manufacturingService.addSupplierMaterial({
      ...data,
      product_id: +id,
    });
  }

  // Update supplier material
  @Put('supplier-materials/:id')
  updateSupplierMaterial(
    @Param('id') id: string,
    @Body() data: CreateSupplierMaterialDto,
  ) {
    return this.manufacturingService.updateSupplierMaterial(+id, data);
  }

  // Calculate production cost
  @Get('boms/:id/cost')
  calculateProductionCost(
    @Param('id') id: string,
    @Query('quantity') quantity?: string,
  ) {
    return this.manufacturingService.calculateProductionCost(
      +id,
      quantity ? +quantity : 1,
    );
  }

  // BOM Explosion: تفجير المكونات مع الأوزان والمواصفات
  @Get('boms/:id/explode')
  explodeBOM(@Param('id') id: string, @Query('quantity') quantity?: string) {
    return this.manufacturingService.explodeBOM(+id, quantity ? +quantity : 1);
  }

  // Add stock to raw material
  @Post('raw-materials/:id/purchase')
  async addRawMaterialStock(
    @Param('id') id: string,
    @Body() data: AddRawMaterialStockDto,
  ) {
    try {
      return await this.manufacturingService.addRawMaterialStock({
        ...data,
        product_id: +id,
        date: data.date ? new Date(data.date) : new Date(),
      });
    } catch (err: any) {
      this.logger.error('[addRawMaterialStock] Error:', err?.message || err);
      throw new BadRequestException(
        err?.message || 'Failed to add raw material stock',
      );
    }
  }

  // Get material movements
  @Get('raw-materials/:id/movements')
  getRawMaterialMovements(@Param('id') id: string) {
    return this.manufacturingService.getRawMaterialMovements(+id);
  }
  // Delete material movement
  @Delete('stock-movements/:id')
  deleteStockMovement(@Param('id') id: string) {
    return this.manufacturingService.deleteStockMovement(+id);
  }

  // Get all movements (log)
  @Get('stock-movements')
  getAllStockMovements(
    @Query('type') type?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.manufacturingService.getAllStockMovements({
      type: type as MovementType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  // Update stock movement
  @Put('stock-movements/:id')
  updateStockMovement(
    @Param('id') id: string,
    @Body() data: Partial<CreateManufacturingStockMovementDto>,
  ) {
    return this.manufacturingService.updateStockMovement(+id, data);
  }

  // Create stock movement (for OUT movements like consumption)
  @Post('stock-movements')
  createStockMovement(@Body() data: CreateManufacturingStockMovementDto) {
    return this.manufacturingService.createStockMovement(data);
  }

  // ==================== FIXED COSTS ====================
  @Get('fixed-costs')
  getFixedCosts(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.manufacturingService.getFixedCosts(
      month,
      year,
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Post('fixed-costs')
  createFixedCost(@Body() data: CreateFixedCostDto) {
    return this.manufacturingService.createFixedCost(data);
  }
  @Delete('fixed-costs/:id')
  deleteFixedCost(@Param('id') id: string) {
    return this.manufacturingService.deleteFixedCost(+id);
  }

  @Get('overhead-rate')
  getOverheadRate(@Query('month') month: string) {
    return this.manufacturingService.calculateOverheadRate(month);
  }

  @Post('raw-materials/:id/recalculate')
  recalculateStock(@Param('id') id: string) {
    return this.manufacturingService.recalculateRawMaterialStock(+id);
  }
}

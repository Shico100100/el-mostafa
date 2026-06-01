import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  NotFoundException,
  Param,
  Body,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { ManufacturingService } from './manufacturing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Machine } from './entities/machine.entity';

@Controller('manufacturing')
@UseGuards(JwtAuthGuard)
export class ManufacturingController {
  constructor(
    private manufacturingService: ManufacturingService,
  ) {}

  // ==================== IMPORT / EXPORT (Moved to Top) ====================

  @Get('stats')
  async getManufacturingStats() {
    return this.manufacturingService.getManufacturingStats();
  }

  @Get('export/machines')
  async exportMachines(@Res() res: Response) {
    const buffer = await this.manufacturingService.exportMachines();
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename=machines.xlsx' });
    res.send(buffer);
  }

  @Post('import/machines')
  @UseInterceptors(FileInterceptor('file'))
  async importMachines(@UploadedFile() file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return this.manufacturingService.importMachines(data);
  }

  @Get('export/molds')
  async exportMolds(@Res() res: Response) {
    const buffer = await this.manufacturingService.exportMolds();
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename=molds.xlsx' });
    res.send(buffer);
  }

  @Post('import/molds')
  @UseInterceptors(FileInterceptor('file'))
  async importMolds(@UploadedFile() file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return this.manufacturingService.importMolds(data);
  }

  @Get('export/raw-materials')
  async exportRawMaterials(@Res() res: Response) {
    const buffer = await this.manufacturingService.exportRawMaterials();
    res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename=raw-materials.xlsx' });
    res.send(buffer);
  }

  @Post('import/raw-materials')
  @UseInterceptors(FileInterceptor('file'))
  async importRawMaterials(@UploadedFile() file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
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
  getBOMs() {
    return this.manufacturingService.getBOMs();
  }

  @Post('boms')
  createBOM(@Body() data: any) {
    return this.manufacturingService.createBOM(data);
  }

  @Get('boms/:id')
  getBOM(@Param('id') id: string) {
    return this.manufacturingService.getBOM(+id);
  }

  @Put('boms/:id')
  updateBOM(@Param('id') id: string, @Body() data: any) {
    return this.manufacturingService.updateBOM(+id, data);
  }

  // Assembly
  @Post('assembly')
  createAssembly(@Body() data: any) {
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
  getAllMachines() {
    return this.manufacturingService.getAllMachines();
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
      status: status as any,
      sortBy,
      sortOrder,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Post('machines')
  createMachine(@Body() data: Partial<Machine>) {
    return this.manufacturingService.createMachine(data);
  }

  @Put('machines/:id')
  updateMachine(@Param('id') id: string, @Body() data: Partial<Machine>) {
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
  createMaintenance(@Body() data: any) {
    return this.manufacturingService.createMaintenance(data);
  }

  // Molds
  @Get('molds')
  getAllMolds() {
    return this.manufacturingService.getAllMolds();
  }

  @Post('molds')
  createMold(@Body() data: any) {
    return this.manufacturingService.createMold(data);
  }

  @Put('molds/:id')
  updateMold(@Param('id') id: string, @Body() data: any) {
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
  createMoldIssue(@Body() data: any) {
    return this.manufacturingService.createMoldIssue(data);
  }

  @Put('mold-issues/:id')
  updateMoldIssue(@Param('id') id: string, @Body() data: any) {
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
  async createProduction(@Body() data: any) {
    try {
      return await this.manufacturingService.createProduction(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ createProduction failed:', message);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to create production',
      );
    }
  }

  @Put('production/:id')
  updateProduction(@Param('id') id: string, @Body() data: any) {
    return this.manufacturingService.updateProduction(+id, data);
  }

  @Delete('production/:id')
  deleteProduction(@Param('id') id: string) {
    return this.manufacturingService.deleteProduction(+id);
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
  async getRawMaterial(@Param('id') id: string) {
    try {
      return await this.manufacturingService.getRawMaterial(+id);
    } catch (error) {
      if (error.message === 'Raw material not found') {
        throw new NotFoundException('Raw material not found');
      }
      throw error;
    }
  }

  // Create raw material
  @Post('raw-materials')
  createRawMaterial(@Body() data: any) {
    return this.manufacturingService.createRawMaterial(data);
  }

  // Update raw material
  @Put('raw-materials/:id')
  updateRawMaterial(@Param('id') id: string, @Body() data: any) {
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
  ) {
    const filters: any = {};
    if (rawMaterialId) filters.raw_material_id = +rawMaterialId;
    if (startDate) filters.start_date = new Date(startDate);
    if (endDate) filters.end_date = new Date(endDate);
    return this.manufacturingService.getConsumptionHistory(filters);
  }

  // Record consumption
  @Post('raw-materials/consumption')
  recordConsumption(@Body() data: any) {
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
  addSupplierMaterial(@Param('id') id: string, @Body() data: any) {
    return this.manufacturingService.addSupplierMaterial({
      ...data,
      raw_material_id: +id,
    });
  }

  // Update supplier material
  @Put('supplier-materials/:id')
  updateSupplierMaterial(@Param('id') id: string, @Body() data: any) {
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
  explodeBOM(
    @Param('id') id: string,
    @Query('quantity') quantity?: string,
  ) {
    return this.manufacturingService.explodeBOM(
      +id,
      quantity ? +quantity : 1,
    );
  }

  // Add stock to raw material
  @Post('raw-materials/:id/purchase')
  async addRawMaterialStock(@Param('id') id: string, @Body() data: any) {
    try {
      return await this.manufacturingService.addRawMaterialStock({
        ...data,
        raw_material_id: +id,
        date: data.date ? new Date(data.date) : new Date(),
      });
    } catch (err: any) {
      console.error('[addRawMaterialStock] Error:', err?.message || err);
      throw new BadRequestException(
        err?.message || 'Failed to add raw material stock',
      );
    }
  }

  // Get material movements
  @Get('raw-materials/:id/movements')
  async getRawMaterialMovements(@Param('id') id: string) {
    try {
      return await this.manufacturingService.getRawMaterialMovements(+id);
    } catch (error) {
      if (error.message === 'Raw material not found') {
        throw new NotFoundException('Raw material not found');
      }
      throw error;
    }
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
      type: type as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  // Create stock movement (for OUT movements like consumption)
  @Post('stock-movements')
  createStockMovement(@Body() data: any) {
    return this.manufacturingService.createStockMovement(data);
  }
  // ==================== FIXED COSTS ====================
  @Get('fixed-costs')
  getFixedCosts(@Query('month') month?: string, @Query('year') year?: string) {
    return this.manufacturingService.getFixedCosts(month, year);
  }

  @Post('fixed-costs')
  createFixedCost(@Body() data: any) {
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

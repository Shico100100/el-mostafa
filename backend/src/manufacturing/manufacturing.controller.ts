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
import type { Response, Request } from 'express';
import { ManufacturingService } from './manufacturing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { sheetToJson } from '../utils/excel-export';
import { Public } from '../auth/public.decorator';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class ManufacturingController {
  private readonly logger = new Logger(ManufacturingController.name);

  constructor(private manufacturingService: ManufacturingService) {}

  // ==================== IMPORT / EXPORT (Moved to Top) ====================

  @Get('stats')
  @ApiOperation({ summary: 'Get manufacturing statistics' })
  @ApiResponse({ status: 200, description: 'Returns manufacturing stats' })
  async getManufacturingStats() {
    return this.manufacturingService.getManufacturingStats();
  }

  @Public()
  @Get('export/machines')
  @ApiOperation({ summary: 'Export machines to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
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
  @ApiOperation({ summary: 'Import machines from Excel' })
  @ApiResponse({ status: 201, description: 'Machines imported' })
  async importMachines(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.manufacturingService.importMachines(data as any[]);
  }

  @Public()
  @Get('export/molds')
  @ApiOperation({ summary: 'Export molds to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
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
  @ApiOperation({ summary: 'Import molds from Excel' })
  @ApiResponse({ status: 201, description: 'Molds imported' })
  async importMolds(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.manufacturingService.importMolds(data as any[]);
  }

  @Public()
  @Get('export/raw-materials')
  @ApiOperation({ summary: 'Export raw materials to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
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
  @ApiOperation({ summary: 'Import raw materials from Excel' })
  @ApiResponse({ status: 201, description: 'Raw materials imported' })
  async importRawMaterials(@UploadedFile() file: Express.Multer.File) {
    let data: unknown[];
    try {
      data = await sheetToJson(file.buffer);
    } catch {
      throw new BadRequestException('ملف Excel غير صالح');
    }
    return this.manufacturingService.importRawMaterials(data as any[]);
  }

  // Upload Image
  @Post('upload')
  @ApiOperation({ summary: 'Upload an image' })
  @ApiResponse({ status: 201, description: 'Image URL returned' })
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
  @ApiOperation({ summary: 'Get all BOMs' })
  @ApiResponse({ status: 200, description: 'Returns paginated BOMs' })
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
  @ApiOperation({ summary: 'Create a BOM' })
  @ApiResponse({ status: 201, description: 'BOM created' })
  createBOM(@Body() data: CreateBOMDto) {
    return this.manufacturingService.createBOM(data as unknown as Partial<BOM>);
  }

  @Get('boms/:id')
  @ApiOperation({ summary: 'Get a BOM by ID' })
  @ApiResponse({ status: 200, description: 'Returns the BOM' })
  getBOM(@Param('id') id: string) {
    return this.manufacturingService.getBOM(+id);
  }

  @Put('boms/:id')
  @ApiOperation({ summary: 'Update a BOM' })
  @ApiResponse({ status: 200, description: 'BOM updated' })
  updateBOM(@Param('id') id: string, @Body() data: CreateBOMDto) {
    return this.manufacturingService.updateBOM(+id, data);
  }

  @Delete('boms/:id')
  @ApiOperation({ summary: 'Delete a BOM' })
  @ApiResponse({ status: 200, description: 'BOM deleted' })
  deleteBOM(@Param('id') id: string) {
    return this.manufacturingService.deleteBOM(+id);
  }

  // Assembly
  @Post('assembly')
  @ApiOperation({ summary: 'Create an assembly order' })
  @ApiResponse({ status: 201, description: 'Assembly order created' })
  createAssembly(@Body() data: CreateAssemblyOrderDto) {
    return this.manufacturingService.createAssembly(data);
  }

  @Get('assembly')
  @ApiOperation({ summary: 'Get all assembly orders' })
  @ApiResponse({ status: 200, description: 'Returns assembly orders' })
  getAssemblyOrders() {
    return this.manufacturingService.getAssemblyOrders();
  }

  // Machines
  @Get('machines/status')
  @ApiOperation({ summary: 'Get machines with current status' })
  @ApiResponse({ status: 200, description: 'Returns machine statuses' })
  getMachinesStatus() {
    return this.manufacturingService.getMachinesWithStatus();
  }

  @Get('machines')
  @ApiOperation({ summary: 'Get all machines' })
  @ApiResponse({ status: 200, description: 'Returns paginated machines' })
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
  @ApiOperation({ summary: 'Create a machine' })
  @ApiResponse({ status: 201, description: 'Machine created' })
  createMachine(@Body() data: CreateMachineDto) {
    return this.manufacturingService.createMachine(data);
  }

  @Put('machines/:id')
  @ApiOperation({ summary: 'Update a machine' })
  @ApiResponse({ status: 200, description: 'Machine updated' })
  updateMachine(@Param('id') id: string, @Body() data: CreateMachineDto) {
    return this.manufacturingService.updateMachine(+id, data);
  }

  // Maintenance
  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance records' })
  @ApiResponse({ status: 200, description: 'Returns maintenance records' })
  getMaintenance(@Query('machine_id') machineId?: string) {
    return this.manufacturingService.getMachineMaintenance(
      machineId ? +machineId : undefined,
    );
  }

  @Post('maintenance')
  @ApiOperation({ summary: 'Create a maintenance record' })
  @ApiResponse({ status: 201, description: 'Maintenance record created' })
  createMaintenance(@Body() data: CreateMaintenanceDto) {
    return this.manufacturingService.createMaintenance(data);
  }

  // Molds
  @Get('molds')
  @ApiOperation({ summary: 'Get all molds' })
  @ApiResponse({ status: 200, description: 'Returns paginated molds' })
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
  @ApiOperation({ summary: 'Create a mold' })
  @ApiResponse({ status: 201, description: 'Mold created' })
  createMold(@Body() data: CreateMoldDto) {
    return this.manufacturingService.createMold(data);
  }

  @Put('molds/:id')
  @ApiOperation({ summary: 'Update a mold' })
  @ApiResponse({ status: 200, description: 'Mold updated' })
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
  @ApiOperation({ summary: 'Get daily production records' })
  @ApiResponse({ status: 200, description: 'Returns production records' })
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
    return this.manufacturingService.getRangeSessions(
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get('production/sessions/:id')
  @ApiOperation({ summary: 'Get a range production session by ID' })
  @ApiResponse({ status: 200, description: 'Returns the session' })
  getRangeSession(@Param('id') id: string) {
    return this.manufacturingService.getRangeSessionById(+id);
  }

  @Delete('production/sessions/:id')
  @ApiOperation({ summary: 'Delete a range production session' })
  @ApiResponse({ status: 200, description: 'Session deleted' })
  deleteRangeSession(@Param('id') id: string) {
    return this.manufacturingService.deleteRangeSession(+id);
  }

  @Get('production/:id/history')
  @ApiOperation({ summary: 'Get production history by ID' })
  @ApiResponse({ status: 200, description: 'Returns production history' })
  getProductionHistory(@Param('id') id: string) {
    return this.manufacturingService.getProductionHistory(+id);
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

  @Delete('production/:id')
  @ApiOperation({ summary: 'Delete a production record' })
  @ApiResponse({ status: 200, description: 'Production deleted' })
  deleteProduction(@Param('id') id: string) {
    return this.manufacturingService.deleteProduction(+id);
  }

  @Public()
  @Get('export/production-history')
  @ApiOperation({ summary: 'Export production history to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
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

  @Get('machines/:id/last-mold')
  getLastMold(@Param('id') id: string) {
    return this.manufacturingService.getLastMoldForMachine(+id);
  }

  // ==================== RAW MATERIALS ====================

  // Get all raw materials
  @Get('raw-materials')
  @ApiOperation({ summary: 'Get all raw materials' })
  @ApiResponse({ status: 200, description: 'Returns all raw materials' })
  getRawMaterials() {
    return this.manufacturingService.getRawMaterials();
  }

  // Get single raw material
  @Get('raw-materials/:id')
  @ApiOperation({ summary: 'Get a raw material by ID' })
  @ApiResponse({ status: 200, description: 'Returns the raw material' })
  getRawMaterial(@Param('id') id: string) {
    return this.manufacturingService.getRawMaterial(+id);
  }

  // Create raw material
  @Post('raw-materials')
  @ApiOperation({ summary: 'Create a raw material' })
  @ApiResponse({ status: 201, description: 'Raw material created' })
  createRawMaterial(@Body() data: CreateRawMaterialDto) {
    return this.manufacturingService.createRawMaterial(data);
  }

  // Update raw material
  @Put('raw-materials/:id')
  @ApiOperation({ summary: 'Update a raw material' })
  @ApiResponse({ status: 200, description: 'Raw material updated' })
  updateRawMaterial(
    @Param('id') id: string,
    @Body() data: CreateRawMaterialDto,
  ) {
    return this.manufacturingService.updateRawMaterial(+id, data);
  }

  // Delete raw material
  @Delete('raw-materials/:id')
  @ApiOperation({ summary: 'Delete a raw material' })
  @ApiResponse({ status: 200, description: 'Raw material deleted' })
  deleteRawMaterial(@Param('id') id: string) {
    return this.manufacturingService.deleteRawMaterial(+id);
  }

  // Get consumption history
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
    return this.manufacturingService.getConsumptionHistory(filters);
  }

  // Record consumption
  @Post('raw-materials/consumption')
  @ApiOperation({ summary: 'Record raw material consumption' })
  @ApiResponse({ status: 201, description: 'Consumption recorded' })
  recordConsumption(@Body() data: RecordConsumptionDto) {
    return this.manufacturingService.recordConsumption(data);
  }

  // Get low stock alerts
  @Get('raw-materials/alerts/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiResponse({ status: 200, description: 'Returns low stock alerts' })
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
  @ApiOperation({ summary: 'Add stock to a raw material' })
  @ApiResponse({ status: 201, description: 'Stock added' })
  async addRawMaterialStock(
    @Param('id') id: string,
    @Body() data: AddRawMaterialStockDto,
  ) {
    return await this.manufacturingService.addRawMaterialStock({
      ...data,
      product_id: +id,
      date: data.date ? new Date(data.date) : new Date(),
    });
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
  @ApiOperation({ summary: 'Get all stock movements' })
  @ApiResponse({ status: 200, description: 'Returns stock movements' })
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
  @ApiOperation({ summary: 'Get fixed costs' })
  @ApiResponse({ status: 200, description: 'Returns fixed costs' })
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
  @ApiOperation({ summary: 'Create a fixed cost' })
  @ApiResponse({ status: 201, description: 'Fixed cost created' })
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

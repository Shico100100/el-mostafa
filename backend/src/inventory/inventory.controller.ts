import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateWarehouseDto,
  CreateStockMovementDto,
  TransferStockDto,
  BulkUpdatePricesDto,
  AdjustStockDto,
} from './dto';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // Categories
  @Get('categories')
  getAllCategories() {
    return this.inventoryService.getAllCategories();
  }

  @Post('categories')
  createCategory(@Body() data: CreateCategoryDto) {
    return this.inventoryService.createCategory(data);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() data: CreateCategoryDto) {
    return this.inventoryService.updateCategory(+id, data);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.inventoryService.deleteCategory(+id);
  }

  // Products
  @Get('products')
  getAllProducts(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('lowStock') lowStock?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getAllProducts({
      search,
      type,
      categoryId: categoryId ? +categoryId : undefined,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      lowStock: lowStock === 'true',
      warehouseId: warehouseId ? +warehouseId : undefined,
    });
  }

  @Public()
  @Get('products/export')
  async exportProducts(@Res() res: Response) {
    const buffer = await this.inventoryService.exportProductsToExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=products.xlsx',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Post('products/import')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    return this.inventoryService.importProductsFromExcel(file.buffer);
  }

  @Post('products/upload-image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/${file.filename}` };
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.inventoryService.getProduct(+id);
  }

  @Post('products')
  createProduct(@Body() data: CreateProductDto) {
    return this.inventoryService.createProduct(data);
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() data: CreateProductDto) {
    return this.inventoryService.updateProduct(+id, data);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.inventoryService.deleteProduct(+id);
  }

  @Get('products/:id/movements')
  getProductMovements(@Param('id') id: string) {
    return this.inventoryService.getStockMovements(+id, undefined);
  }

  // Warehouses
  @Get('warehouses')
  getAllWarehouses() {
    return this.inventoryService.getAllWarehouses();
  }

  @Post('warehouses/init')
  initDefaultWarehouses() {
    return this.inventoryService.initDefaultWarehouses();
  }

  @Get('warehouses/:id')
  getWarehouse(@Param('id') id: string) {
    return this.inventoryService.getWarehouse(+id);
  }

  @Public()
  @Get('warehouses/:id/stock')
  getWarehouseStock(@Param('id') id: string) {
    return this.inventoryService.getWarehouseStock(+id);
  }

  @Post('warehouses')
  createWarehouse(@Body() data: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(data);
  }

  @Put('warehouses/:id')
  updateWarehouse(@Param('id') id: string, @Body() data: CreateWarehouseDto) {
    return this.inventoryService.updateWarehouse(+id, data);
  }

  @Delete('warehouses/:id')
  deleteWarehouse(@Param('id') id: string) {
    return this.inventoryService.deleteWarehouse(+id);
  }

  // Stock
  @Get('stock')
  getStock(
    @Query('product_id') productId?: string,
    @Query('warehouse_id') warehouseId?: string,
  ) {
    return this.inventoryService.getStock(
      productId ? +productId : undefined,
      warehouseId ? +warehouseId : undefined,
    );
  }

  @Post('stock/movement')
  addStockMovement(@Body() data: CreateStockMovementDto) {
    return this.inventoryService.addStockMovement(data);
  }

  @Get('stock/movements')
  getStockMovements(
    @Query('product_id') productId?: string,
    @Query('warehouse_id') warehouseId?: string,
  ) {
    return this.inventoryService.getStockMovements(
      productId ? +productId : undefined,
      warehouseId ? +warehouseId : undefined,
    );
  }

  @Put('stock/movements/:id')
  updateStockMovement(
    @Param('id') id: string,
    @Body() data: CreateStockMovementDto,
  ) {
    return this.inventoryService.updateStockMovement(+id, data);
  }

  @Post('stock/transfer')
  transferStock(@Body() data: TransferStockDto) {
    return this.inventoryService.transferStock(data);
  }

  @Post('stock/adjust')
  adjustStock(@Body() data: AdjustStockDto) {
    return this.inventoryService.adjustStock(data);
  }

  @Post('products/:id/recalculate')
  recalculateProductStock(@Param('id') id: string) {
    return this.inventoryService.recalculateProductStock(+id);
  }

  @Post('products/bulk-update-prices')
  bulkUpdatePrices(@Body() data: BulkUpdatePricesDto) {
    return this.inventoryService.bulkUpdatePrices(data);
  }

  @Post('products/smart-assign')
  smartAssignWarehouses() {
    return this.inventoryService.smartAssignWarehouses();
  }

  @Post('products/:id/auto-price')
  autoPriceProduct(@Param('id') id: string) {
    return this.inventoryService.autoPriceProduct(+id);
  }
}

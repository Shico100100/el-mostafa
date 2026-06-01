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
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

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
  createCategory(@Body() data: any) {
    return this.inventoryService.createCategory(data);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() data: any) {
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
  ) {
    return this.inventoryService.getAllProducts({
      search,
      type,
      categoryId: categoryId ? +categoryId : undefined,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      lowStock: lowStock === 'true',
    });
  }

  @Get('products/export')
  async exportProducts(@Res() res: Response) {
    const buffer = await this.inventoryService.exportProductsToExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=products.xlsx',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('products/import')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    return this.inventoryService.importProductsFromExcel(file.buffer);
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.inventoryService.getProduct(+id);
  }

  @Post('products')
  createProduct(@Body() data: any) {
    return this.inventoryService.createProduct(data);
  }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() data: any) {
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

  @Post('warehouses')
  createWarehouse(@Body() data: any) {
    return this.inventoryService.createWarehouse(data);
  }

  @Put('warehouses/:id')
  updateWarehouse(@Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateWarehouse(+id, data);
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
  addStockMovement(@Body() data: any) {
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
  updateStockMovement(@Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateStockMovement(+id, data);
  }

  @Post('products/:id/recalculate')
  recalculateProductStock(@Param('id') id: string) {
    return this.inventoryService.recalculateProductStock(+id);
  }

  @Post('products/bulk-update-prices')
  bulkUpdatePrices(@Body() data: any) {
    return this.inventoryService.bulkUpdatePrices(data);
  }
}

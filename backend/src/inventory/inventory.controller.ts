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
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import {
  CreateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  CreateWarehouseDto,
  CreateStockMovementDto,
  TransferStockDto,
  BulkUpdatePricesDto,
  AdjustStockDto,
} from './dto';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.viewer)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // Categories
  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  getAllCategories() {
    return this.inventoryService.getAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  createCategory(@Body() data: CreateCategoryDto) {
    return this.inventoryService.createCategory(data);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  updateCategory(@Param('id') id: string, @Body() data: CreateCategoryDto) {
    return this.inventoryService.updateCategory(+id, data);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  deleteCategory(@Param('id') id: string) {
    return this.inventoryService.deleteCategory(+id);
  }

  // Products
  @Get('products')
  @ApiOperation({ summary: 'Get all products with optional filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated products' })
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
  @ApiOperation({ summary: 'Export products to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file returned' })
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
  @ApiOperation({ summary: 'Import products from Excel' })
  @ApiResponse({ status: 201, description: 'Products imported' })
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    return this.inventoryService.importProductsFromExcel(file.buffer);
  }

  @Post('products/upload-image')
  @ApiOperation({ summary: 'Upload a product image' })
  @ApiResponse({ status: 201, description: 'Image URL returned' })
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
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Returns the product' })
  getProduct(@Param('id') id: string) {
    return this.inventoryService.getProduct(+id);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse({ status: 201, description: 'Product created' })
  createProduct(@Body() data: CreateProductDto) {
    return this.inventoryService.createProduct(data);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  updateProduct(@Param('id') id: string, @Body() data: UpdateProductDto) {
    return this.inventoryService.updateProduct(+id, data);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  deleteProduct(@Param('id') id: string) {
    return this.inventoryService.deleteProduct(+id);
  }

  @Get('products/:id/movements')
  @ApiOperation({ summary: 'Get stock movements for a product' })
  @ApiResponse({ status: 200, description: 'Returns stock movements' })
  getProductMovements(@Param('id') id: string) {
    return this.inventoryService.getStockMovements(+id, undefined);
  }

  // Warehouses
  @Get('warehouses')
  @ApiOperation({ summary: 'Get all warehouses' })
  @ApiResponse({ status: 200, description: 'Returns all warehouses' })
  getAllWarehouses() {
    return this.inventoryService.getAllWarehouses();
  }

  @Post('warehouses/init')
  @ApiOperation({ summary: 'Initialize default warehouses' })
  @ApiResponse({ status: 201, description: 'Default warehouses created' })
  initDefaultWarehouses() {
    return this.inventoryService.initDefaultWarehouses();
  }

  @Get('warehouses/:id')
  @ApiOperation({ summary: 'Get a warehouse by ID' })
  @ApiResponse({ status: 200, description: 'Returns the warehouse' })
  getWarehouse(@Param('id') id: string) {
    return this.inventoryService.getWarehouse(+id);
  }

  @Public()
  @Get('warehouses/:id/stock')
  @ApiOperation({ summary: 'Get stock for a warehouse' })
  @ApiResponse({ status: 200, description: 'Returns warehouse stock' })
  getWarehouseStock(@Param('id') id: string) {
    return this.inventoryService.getWarehouseStock(+id);
  }

  @Post('warehouses')
  @ApiOperation({ summary: 'Create a warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse created' })
  createWarehouse(@Body() data: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(data);
  }

  @Put('warehouses/:id')
  @ApiOperation({ summary: 'Update a warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse updated' })
  updateWarehouse(@Param('id') id: string, @Body() data: CreateWarehouseDto) {
    return this.inventoryService.updateWarehouse(+id, data);
  }

  @Delete('warehouses/:id')
  @ApiOperation({ summary: 'Delete a warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse deleted' })
  deleteWarehouse(@Param('id') id: string) {
    return this.inventoryService.deleteWarehouse(+id);
  }

  // Stock
  @Get('stock')
  @ApiOperation({ summary: 'Get stock levels with optional filters' })
  @ApiResponse({ status: 200, description: 'Returns stock data' })
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
  @ApiOperation({ summary: 'Add a stock movement' })
  @ApiResponse({ status: 201, description: 'Stock movement created' })
  addStockMovement(@Body() data: CreateStockMovementDto) {
    return this.inventoryService.addStockMovement(data);
  }

  @Get('stock/movements')
  @ApiOperation({ summary: 'Get stock movements with optional filters' })
  @ApiResponse({ status: 200, description: 'Returns stock movements' })
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
  @ApiOperation({ summary: 'Update a stock movement' })
  @ApiResponse({ status: 200, description: 'Stock movement updated' })
  updateStockMovement(
    @Param('id') id: string,
    @Body() data: CreateStockMovementDto,
  ) {
    return this.inventoryService.updateStockMovement(+id, data);
  }

  @Post('stock/transfer')
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  @ApiResponse({ status: 200, description: 'Stock transferred' })
  transferStock(@Body() data: TransferStockDto) {
    return this.inventoryService.transferStock(data);
  }

  @Post('stock/adjust')
  @ApiOperation({ summary: 'Adjust stock quantity' })
  @ApiResponse({ status: 200, description: 'Stock adjusted' })
  adjustStock(@Body() data: AdjustStockDto) {
    return this.inventoryService.adjustStock(data);
  }

  @Post('products/:id/recalculate')
  @ApiOperation({ summary: 'Recalculate stock for a product' })
  @ApiResponse({ status: 200, description: 'Stock recalculated' })
  recalculateProductStock(@Param('id') id: string) {
    return this.inventoryService.recalculateProductStock(+id);
  }

  @Post('products/bulk-update-prices')
  @ApiOperation({ summary: 'Bulk update product prices' })
  @ApiResponse({ status: 200, description: 'Prices updated' })
  bulkUpdatePrices(@Body() data: BulkUpdatePricesDto) {
    return this.inventoryService.bulkUpdatePrices(data);
  }

  @Post('products/smart-assign')
  @ApiOperation({ summary: 'Smart assign warehouses to products' })
  @ApiResponse({ status: 200, description: 'Warehouses assigned' })
  smartAssignWarehouses() {
    return this.inventoryService.smartAssignWarehouses();
  }

  @Post('products/:id/auto-price')
  @ApiOperation({ summary: 'Auto-price a product' })
  @ApiResponse({ status: 200, description: 'Price updated' })
  autoPriceProduct(@Param('id') id: string) {
    return this.inventoryService.autoPriceProduct(+id);
  }

  @Post('products/:id/mark-dormant')
  @ApiOperation({ summary: 'Mark a product as dormant' })
  @ApiResponse({ status: 200, description: 'Product marked as dormant' })
  markProductAsDormant(@Param('id') id: string) {
    return this.inventoryService.markProductAsDormant(+id);
  }

  @Post('products/:id/restore')
  @ApiOperation({ summary: 'Restore a dormant product' })
  @ApiResponse({ status: 200, description: 'Product restored' })
  restoreProduct(@Param('id') id: string) {
    return this.inventoryService.restoreProduct(+id);
  }
}

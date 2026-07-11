import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { ProductCrudService } from './product-crud/product-crud.service';
import { ProductPricingService } from './product-pricing/product-pricing.service';
import { ProductExcelService } from './product-excel/product-excel.service';
import { WarehouseService } from './warehouse.service';
import { StockService } from './stock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Stock } from './entities/stock.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { BOM, BOMItem } from '../manufacturing/entities/bom.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Product,
      Warehouse,
      Stock,
      StockMovement,
      BOM,
      BOMItem,
    ]),
  ],
  providers: [
    InventoryService,
    CategoryService,
    ProductService,
    ProductCrudService,
    ProductPricingService,
    ProductExcelService,
    WarehouseService,
    StockService,
  ],
  controllers: [InventoryController],
  exports: [InventoryService, TypeOrmModule],
})
export class InventoryModule {}

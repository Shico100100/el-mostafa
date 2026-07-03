import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { ProductCrudService } from './product-crud/product-crud.service';
import { ProductPricingService } from './product-pricing/product-pricing.service';
import { ProductExcelService } from './product-excel/product-excel.service';

@Injectable()
export class ProductService {
  constructor(
    private productCrudService: ProductCrudService,
    private productPricingService: ProductPricingService,
    private productExcelService: ProductExcelService,
  ) {}

  // ---- CRUD / Query Delegation ----

  async getDefaultWarehouseId() {
    return this.productCrudService.getDefaultWarehouseId();
  }

  async getAllProducts(options: {
    search?: string;
    type?: string;
    categoryId?: number;
    page?: number;
    limit?: number;
    lowStock?: boolean;
    warehouseId?: number;
  }) {
    return this.productCrudService.getAllProducts(options);
  }

  async getProduct(id: number) {
    return this.productCrudService.getProduct(id);
  }

  async updateProductSimple(id: number, data: Partial<Product>) {
    return this.productCrudService.updateProductSimple(id, data);
  }

  async deleteProduct(id: number) {
    return this.productCrudService.deleteProduct(id);
  }

  // ---- Pricing / Stock Recalc ----

  async recalculateProductStock(id: number) {
    return this.productPricingService.recalculateProductStock(id);
  }

  async bulkUpdatePrices(data: {
    productIds?: number[];
    categoryId?: number;
    type?: string;
    priceField: 'selling_price' | 'cost_price';
    updateType: 'percentage' | 'fixed';
    value: number;
  }) {
    return this.productPricingService.bulkUpdatePrices(data);
  }

  async autoPriceProduct(productId: number) {
    return this.productPricingService.autoPriceProduct(productId);
  }

  // ---- Excel Export / Import ----

  async exportProductsToExcel() {
    return this.productExcelService.exportProductsToExcel();
  }

  async importProductsFromExcel(buffer: Buffer) {
    return this.productExcelService.importProductsFromExcel(buffer);
  }
}

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

  async autoPriceProduct(productId: number) {
    return this.productPricingService.autoPriceProduct(productId);
  }

  async bulkDeleteProducts(ids: number[]) {
    return this.productCrudService.bulkDeleteProducts(ids);
  }

  async getAssemblyPreview(
    productId: number,
    quantity: number,
    warehouseId?: number,
  ) {
    return this.productCrudService.getAssemblyPreview(
      productId,
      quantity,
      warehouseId,
    );
  }

  async assembleProduct(
    productId: number,
    quantity: number,
    warehouseId?: number,
  ) {
    return this.productCrudService.assembleProduct(
      productId,
      quantity,
      warehouseId,
    );
  }

  async bulkAssignCategory(ids: number[], categoryId: number) {
    return this.productCrudService.bulkAssignCategory(ids, categoryId);
  }

  async getProductsSummary() {
    return this.productCrudService.getProductsSummary();
  }

  // ---- Excel Export / Import ----

  async exportProductsToExcel(filters?: {
    search?: string;
    type?: string;
    categoryId?: number;
    lowStock?: boolean;
    warehouseId?: number;
  }) {
    return this.productExcelService.exportProductsToExcel(filters);
  }

  async previewImportFromExcel(buffer: Buffer) {
    return this.productExcelService.previewImportFromExcel(buffer);
  }

  async importProductsFromExcel(buffer: Buffer) {
    return this.productExcelService.importProductsFromExcel(buffer);
  }
}

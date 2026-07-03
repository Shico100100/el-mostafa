import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';
import { Category } from '../entities/category.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { ProductCrudService } from '../product-crud/product-crud.service';

@Injectable()
export class ProductExcelService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    private productCrudService: ProductCrudService,
    private dataSource: DataSource,
  ) {}

  async exportProductsToExcel() {
    const result: any = await this.productCrudService.getAllProducts({
      limit: 10000,
    });
    const products = (result.data || result) as (Product & {
      stock_quantity: number;
    })[];

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Products');
    ws.columns = [
      { header: 'صورة', key: 'image', width: 14 },
      { header: 'الاسم', key: 'name', width: 30 },
      { header: 'SKU', key: 'sku', width: 18 },
      { header: 'Barcode', key: 'barcode', width: 18 },
      { header: 'النوع', key: 'type', width: 14 },
      { header: 'المخزن', key: 'warehouse', width: 16 },
      { header: 'التصنيف', key: 'category', width: 16 },
      { header: 'وزن القطعة (جرام)', key: 'weight_grams', width: 16 },
      { header: 'سعر البيع', key: 'selling_price', width: 14 },
      { header: 'التكلفة', key: 'cost_price', width: 14 },
      { header: 'المخزون', key: 'stock_quantity', width: 12 },
      { header: 'حد الطلب', key: 'min_stock', width: 12 },
      { header: 'الوحدة', key: 'unit', width: 10 },
    ];
    const hr = ws.getRow(1);
    hr.height = 24;
    hr.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'thin', color: { argb: 'FF334155' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });
    products.forEach((p, idx) => {
      const r = idx + 2;
      const row = ws.getRow(r);
      row.height = 60;
      row.getCell(1).value = '';
      row.getCell(2).value = p.name;
      row.getCell(3).value = p.sku || '';
      row.getCell(4).value = p.barcode || '';
      row.getCell(5).value = p.type;
      row.getCell(6).value = p.warehouse?.name || '';
      row.getCell(7).value = p.category?.name || '';
      row.getCell(8).value = Number(p.weight_grams) || '';
      row.getCell(9).value = Number(p.selling_price);
      row.getCell(10).value = Number(p.cost_price);
      row.getCell(11).value = p.stock_quantity;
      row.getCell(12).value = p.min_stock;
      row.getCell(13).value = p.unit;
      for (let c = 2; c <= 13; c++) {
        const cell = row.getCell(c);
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { size: 11, color: { argb: 'FF1E293B' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }
      if (p.image_path) {
        const localPath = join(
          process.cwd(),
          'uploads',
          basename(p.image_path),
        );
        if (existsSync(localPath)) {
          try {
            const buffer = readFileSync(localPath);
            const ext = p.image_path.split('.').pop()?.toLowerCase() || 'png';
            const extension = ext === 'jpg' ? 'jpeg' : ext;
            const imageId = wb.addImage({
              buffer: buffer as unknown as NonNullable<ExcelJS.Image['buffer']>,
              extension: extension as ExcelJS.Image['extension'],
            });
            ws.addImage(imageId, {
              tl: { col: 0, row: r - 1 },
              ext: { width: 50, height: 50 },
            });
          } catch {
            /* skip */
          }
        }
      }
    });
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async importProductsFromExcel(buffer: Buffer) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(
      buffer as unknown as Parameters<ExcelJS.Xlsx['load']>[0],
    );
    const ws = wb.worksheets[0];
    if (!ws) return { created: 0, updated: 0 };
    const media =
      (wb as unknown as { model?: ExcelJS.WorkbookModel })?.model?.media || [];
    const rows = ws.getSheetValues();
    if (rows.length < 2) return { created: 0, updated: 0 };

    const headers = (rows[1] as unknown as Array<unknown>) || [];
    const colMap: Record<string, number> = {};
    headers.forEach((h: any, i: number) => {
      if (h) {
        const key = String(h).trim();
        colMap[key] = i;
        colMap[key.toLowerCase()] = i;
        if (key === 'الاسم') colMap['name'] = i;
        if (key === 'النوع') colMap['type'] = i;
        if (key === 'المخزن') colMap['warehouse'] = i;
        if (key === 'التصنيف') colMap['category'] = i;
        if (key === 'سعر البيع') colMap['selling_price'] = i;
        if (key === 'التكلفة') colMap['cost_price'] = i;
        if (key === 'المخزون') colMap['stock_quantity'] = i;
        if (key === 'حد الطلب') colMap['min_stock'] = i;
        if (key === 'الوحدة') colMap['unit'] = i;
        if (key === 'وزن القطعة (جرام)') colMap['weight_grams'] = i;
      }
    });
    const imagePlacements = ws.getImages ? ws.getImages() : [];

    let createdCount = 0,
      updatedCount = 0;
    for (let r = 2; r <= rows.length; r++) {
      const row = (rows[r] as unknown as Array<unknown>) || [];
      const name = (row[colMap['name']] || row[colMap['الاسم']]) as string;
      if (!name) continue;
      const sku = (row[colMap['SKU']] || row[colMap['sku']]) as
        | string
        | undefined;
      const barcode = (row[colMap['Barcode']] || row[colMap['barcode']]) as
        | string
        | undefined;
      let existingProduct: Product | null = null;
      if (sku)
        existingProduct = await this.productRepo.findOne({
          where: { sku: String(sku) },
        });
      if (!existingProduct && barcode)
        existingProduct = await this.productRepo.findOne({
          where: { barcode: String(barcode) },
        });
      if (!existingProduct)
        existingProduct = await this.productRepo.findOne({ where: { name } });

      const productData: Partial<Product> = {
        name,
        sku: sku ? String(sku) : undefined,
        barcode: barcode ? String(barcode) : undefined,
        selling_price: (row[colMap['Selling Price']] ||
          row[colMap['selling_price']] ||
          0) as number,
        cost_price: (row[colMap['Cost Price']] ||
          row[colMap['cost_price']] ||
          0) as number,
        min_stock: (row[colMap['Min Stock']] ||
          row[colMap['min_stock']] ||
          0) as number,
        type: (
          (row[colMap['Type']] || row[colMap['type']] || 'FINISHED') as string
        ).toUpperCase(),
        unit: (row[colMap['Unit']] || row[colMap['unit']] || 'piece') as string,
        weight_grams: row[colMap['weight_grams']]
          ? Number(row[colMap['weight_grams']])
          : undefined,
      };
      const categoryName = (row[colMap['Category']] ||
        row[colMap['category']]) as string | undefined;
      if (categoryName) {
        let category = await this.categoryRepo.findOne({
          where: { name: categoryName },
        });
        if (!category) {
          category = await this.categoryRepo.save(
            this.categoryRepo.create({ name: categoryName }),
          );
        }
        productData.category = category;
      }
      const warehouseName = row[colMap['warehouse']];
      if (warehouseName) {
        const warehouse = await this.warehouseRepo.findOne({
          where: { name: String(warehouseName).trim() },
        });
        if (warehouse) productData.warehouse_id = warehouse.id;
      }
      for (const img of imagePlacements) {
        const tlRow = (img.range?.tl?.row ?? -1) + 1;
        if (tlRow === r) {
          const mediaIdx = Number(img.imageId);
          const entry = media[mediaIdx];
          if (entry?.buffer) {
            const ext = entry.extension || 'png';
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            const destPath = join(
              process.cwd(),
              'uploads',
              `${randomName}.${ext}`,
            );
            writeFileSync(
              destPath,
              entry.buffer as unknown as NodeJS.ArrayBufferView,
            );
            productData.image_path = `/uploads/${randomName}.${ext}`;
          }
          break;
        }
      }
      if (existingProduct) {
        await this.productRepo.update(existingProduct.id, productData);
        updatedCount++;
      } else {
        const whId =
          productData.warehouse_id ||
          (await this.productCrudService.getDefaultWarehouseId());
        await this.dataSource.transaction(async (manager) => {
          const pr = manager.getRepository(Product);
          const sr = manager.getRepository(Stock);
          const saved = await pr.save(
            pr.create({ ...productData, warehouse_id: whId }),
          );
          await sr.save(
            sr.create({
              product_id: saved.id,
              warehouse_id: whId,
              quantity: 0,
            }),
          );
        });
        createdCount++;
      }
    }
    return { created: createdCount, updated: updatedCount };
  }
}

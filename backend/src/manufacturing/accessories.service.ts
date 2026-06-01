import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { Accessory } from './entities/accessory.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';

@Injectable()
export class AccessoriesService {
  constructor(
    @InjectRepository(Accessory)
    private accessoryRepo: Repository<Accessory>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private stockMovementRepo: Repository<StockMovement>,
  ) {}

  async findAll() {
    const accessories = await this.accessoryRepo.find({
      relations: ['product', 'preferred_supplier'],
      order: { created_at: 'DESC' },
    });

    // Enrich with stock info
    const enriched = await Promise.all(
      accessories.map(async (acc) => {
        const stock = await this.stockRepo.findOne({
          where: { product_id: acc.product_id },
        });
        return {
          ...acc,
          current_stock: stock ? Number(stock.quantity) : 0,
          stock_status:
            !stock || Number(stock.quantity) === 0
              ? 'OUT_OF_STOCK'
              : Number(stock.quantity) <= Number(acc.reorder_point)
                ? 'LOW_STOCK'
                : 'NORMAL',
        };
      }),
    );

    return enriched;
  }

  async getLowStock() {
    const all = await this.findAll();
    return all.filter((acc) => acc.stock_status !== 'NORMAL');
  }

  async findOne(id: number) {
    return this.accessoryRepo.findOne({
      where: { id },
      relations: ['product', 'preferred_supplier'],
    });
  }

  async create(data: any) {
    // 1. Create or Find Product
    let product;
    if (data.product_id) {
      product = await this.productRepo.findOne({
        where: { id: data.product_id },
      });
    } else {
      product = this.productRepo.create({
        name: data.name,
        unit: data.unit || 'piece',
        type: 'ACCESSORY',
        cost_price: data.last_purchase_price || 0,
      });
      await this.productRepo.save(product);
    }

    if (!product) throw new Error('Product creation failed');

    // 2. Create Accessory
    const accessory = this.accessoryRepo.create({
      ...data,
      product_id: product.id,
    });

    return this.accessoryRepo.save(accessory);
  }

  async update(id: number, data: any) {
    // Update Product if name/unit changed
    const accessory = await this.findOne(id);
    if (accessory && (data.name || data.unit)) {
      await this.productRepo.update(accessory.product_id, {
        name: data.name || accessory.product.name,
        unit: data.unit || accessory.product.unit,
      });
    }

    await this.accessoryRepo.update(id, {
      reorder_point: data.reorder_point,
      reorder_quantity: data.reorder_quantity,
      notes: data.notes,
      preferred_supplier_id: data.preferred_supplier_id,
      last_purchase_price: data.last_purchase_price,
    });

    return this.findOne(id);
  }

  async delete(id: number, reason: string) {
    const accessory = await this.findOne(id);
    if (accessory) {
      // Log deletion movement
      const stock = await this.stockRepo.findOne({
        where: { product_id: accessory.product_id },
      });
      if (stock && Number(stock.quantity) > 0) {
        await this.stockMovementRepo.save({
          product_id: accessory.product_id,
          warehouse_id: stock.warehouse_id,
          type: MovementType.OUT,
          quantity: Number(stock.quantity),
          reference_type: 'ACCESSORY_DELETION',
          reference_id: accessory.id,
          date: new Date(),
          notes: `Deleted: ${reason}`,
        });

        // Zero out stock
        stock.quantity = 0;
        await this.stockRepo.save(stock);
      }
    }
    return this.accessoryRepo.softDelete(id);
  }

  async getHistory(id: number) {
    const accessory = await this.findOne(id);
    if (!accessory) throw new Error('Accessory not found');

    return this.stockMovementRepo.find({
      where: { product_id: accessory.product_id },
      order: { date: 'DESC' },
    });
  }

  async getTotalValue() {
    const accessories = await this.findAll();
    const value = accessories.reduce((sum, acc) => {
      return (
        sum + Number(acc.current_stock) * Number(acc.last_purchase_price || 0)
      );
    }, 0);
    return { total_value: value, count: accessories.length };
  }

  async getTopConsumed(limit: number = 5) {
    // Simple query to sum OUT movements
    // In real app, date filtering should be applied
    const query = this.stockMovementRepo
      .createQueryBuilder('movement')
      .select('movement.product_id', 'product_id')
      .addSelect('SUM(movement.quantity)', 'total_consumed')
      .where('movement.type = :type', { type: MovementType.OUT })
      .andWhere('movement.reference_type = :refType', {
        refType: 'ACCESSORY_CONSUMPTION',
      })
      .groupBy('movement.product_id')
      .orderBy('total_consumed', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    // Populate product details
    const enriched = await Promise.all(
      results.map(async (row) => {
        const accessory = await this.accessoryRepo.findOne({
          where: { product_id: row.product_id },
          relations: ['product'],
        });
        return {
          ...row,
          accessory_name: accessory?.product.name || 'Unknown',
          unit: accessory?.product.unit,
        };
      }),
    );
    return enriched;
  }

  async getSlowMoving(months: number = 3) {
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - months);

    const accessories = await this.findAll();
    const slowMoving: any[] = [];

    for (const acc of accessories) {
      // Check if current stock > 0
      if (acc.current_stock > 0) {
        // Check last OUT movement
        const lastMove = await this.stockMovementRepo.findOne({
          where: {
            product_id: acc.product_id,
            type: MovementType.OUT,
          },
          order: { date: 'DESC' },
        });

        if (!lastMove || lastMove.date < thresholdDate) {
          slowMoving.push({
            ...acc,
            last_movement_date: lastMove?.date || 'Never',
          });
        }
      }
    }
    return slowMoving;
  }

  async generatePODraft() {
    const lowStock = await this.getLowStock();
    return lowStock.map((acc) => ({
      accessory_id: acc.id,
      product_name: acc.product.name,
      current_stock: acc.current_stock,
      reorder_point: acc.reorder_point,
      suggested_quantity: Number(acc.reorder_quantity || 100), // Default reorder qty
      last_price: acc.last_purchase_price,
      supplier: acc.preferred_supplier?.name || 'Any',
      total_estimated_cost:
        Number(acc.reorder_quantity || 100) *
        Number(acc.last_purchase_price || 0),
    }));
  }

  async bulkAddStock(
    items: { id: number; quantity: number; price?: number }[],
  ) {
    const results = { success: 0, failed: 0 };
    for (const item of items) {
      try {
        await this.addStock(item.id, item.quantity, item.price);
        results.success++;
      } catch {
        results.failed++;
      }
    }
    return results;
  }

  // Stock Operations
  async addStock(id: number, quantity: number, price?: number, unit?: string) {
    const accessory = await this.findOne(id);
    if (!accessory) throw new Error('Accessory not found');

    // KG to Pieces conversion
    if (unit && (unit === 'kg' || unit === 'KG') && accessory.weight_per_piece) {
      quantity = Math.round((quantity * 1000) / Number(accessory.weight_per_piece));
    }

    // Update last price
    if (price) {
      accessory.last_purchase_price = price;
      accessory.last_purchase_date = new Date();
      await this.accessoryRepo.save(accessory);

      // Update product cost (Weighted Average could be better, but simple update for now)
      await this.productRepo.update(accessory.product_id, {
        cost_price: price,
      });
    }

    // Update Stock
    let stock = await this.stockRepo.findOne({
      where: { product_id: accessory.product_id },
    });
    if (!stock) {
      stock = this.stockRepo.create({
        product_id: accessory.product_id,
        warehouse_id: 1,
        quantity: 0,
      });
    }
    stock.quantity = Number(stock.quantity) + Number(quantity);
    await this.stockRepo.save(stock);

    // Movement
    await this.stockMovementRepo.save({
      product_id: accessory.product_id,
      warehouse_id: stock.warehouse_id,
      type: MovementType.IN,
      quantity: quantity,
      reference_type: 'ACCESSORY_PURCHASE',
      reference_id: accessory.id,
      date: new Date(),
      notes: `Added stock. Price: ${price}`,
    });

    return stock;
  }

  async consumeStock(id: number, quantity: number, notes?: string, unit?: string) {
    const accessory = await this.findOne(id);
    if (!accessory) throw new Error('Accessory not found');

    // KG to Pieces conversion
    if (unit && (unit === 'kg' || unit === 'KG') && accessory.weight_per_piece) {
      quantity = Math.round((quantity * 1000) / Number(accessory.weight_per_piece));
    }

    const stock = await this.stockRepo.findOne({
      where: { product_id: accessory.product_id },
    });
    if (!stock || Number(stock.quantity) < quantity) {
      throw new Error('Insufficient stock');
    }

    stock.quantity = Number(stock.quantity) - Number(quantity);
    await this.stockRepo.save(stock);

    await this.stockMovementRepo.save({
      product_id: accessory.product_id,
      warehouse_id: stock.warehouse_id,
      type: MovementType.OUT,
      quantity: quantity,
      reference_type: 'ACCESSORY_CONSUMPTION',
      reference_id: accessory.id,
      date: new Date(),
      notes: notes || 'Consumption',
    });

    return stock;
  }

  async exportAccessories() {
    const accessories = await this.findAll();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Accessories');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Image', key: 'image', width: 15 }, // Image Column
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Current Stock', key: 'current_stock', width: 15 },
      { header: 'Reorder Point', key: 'reorder_point', width: 15 },
      { header: 'Last Price', key: 'last_price', width: 15 },
      { header: 'Preferred Supplier', key: 'supplier', width: 25 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Weight (g)', key: 'weight', width: 15 },
      { header: 'Image Path', key: 'image_path', width: 30 }, // Keep path for re-import
    ];

    for (const acc of accessories) {
      const row = sheet.addRow({
        id: acc.id,
        name: acc.product.name,
        unit: acc.product.unit,
        current_stock: acc.current_stock,
        reorder_point: acc.reorder_point,
        last_price: acc.last_purchase_price,
        supplier: acc.preferred_supplier?.name || '',
        notes: acc.notes,
        weight: acc.weight_per_piece,
        image_path: acc.image_path,
      });

      // Embed Image if exists
      if (acc.image_path) {
        try {
          // acc.image_path is like "/uploads/filename.jpg"
          // We need to resolve it relative to backend root
          const filename = path.basename(acc.image_path);
          const imagePath = path.join(process.cwd(), 'uploads', filename);

          if (fs.existsSync(imagePath)) {
            const imageId = workbook.addImage({
              filename: imagePath,
              extension: path.extname(imagePath).replace('.', '') as
                | 'jpeg'
                | 'png'
                | 'gif',
            });

            sheet.addImage(imageId, {
              tl: { col: 2, row: row.number - 1 }, // Column 2 (Image), 0-indexed
              ext: { width: 100, height: 100 },
            });

            // Increase row height for image
            row.height = 80;
          }
        } catch (e) {
          console.error('Failed to embed image:', e);
        }
      }
    }

    return await workbook.xlsx.writeBuffer();
  }

  async importAccessories(buffer: Buffer) {
    const results = {
      success: 0,
      errors: 0,
      failedRows: [] as { row: any; error: string }[],
    };

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet(1); // Assuming first sheet

    if (!sheet) return results;

    // Map images by row index (0-indexed)
    const imagesByRow: { [key: number]: any } = {};
    sheet.getImages().forEach((img: any) => {
      const range = img.range;
      // Assuming image is in the "Image" column (col 2) or generally associated with the row
      // We'll map it to the row number (tl.row)
      if (range) {
        const row = Math.floor(range.tl.nativeRow);
        console.log(
          `Found image at row index: ${row}, nativeRow: ${range.tl.nativeRow}`,
        );
        imagesByRow[row] = img;
      }
    });
    console.log(`Total images mapped: ${Object.keys(imagesByRow).length}`);

    // Headers are likely in row 1
    // We'll map column names to indices
    const headers: { [key: string]: number } = {};
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      headers[cell.value?.toString() || ''] = colNumber;
    });

    // Iterate from row 2
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      if (!row.hasValues) continue;

      try {
        // Check if ID exists and is valid
        const idStr = row.getCell(headers['ID']).value?.toString();
        const id = idStr ? parseInt(idStr) : null;

        const name = row.getCell(headers['Name']).value?.toString();
        if (!name && !id) continue; // Skip empty rows

        const unit = row.getCell(headers['Unit']).value?.toString() || 'piece';
        const lastPrice = Number(row.getCell(headers['Last Price']).value) || 0;
        const reorderPoint =
          Number(row.getCell(headers['Reorder Point']).value) || 0;
        const notes = row.getCell(headers['Notes']).value?.toString();
        const weight = Number(row.getCell(headers['Weight (g)']).value);

        // Check for image
        let imagePath = row.getCell(headers['Image Path']).value?.toString();

        // If explicit path is empty, check for embedded image
        if (!imagePath && imagesByRow[i - 1]) {
          const img = imagesByRow[i - 1];
          // Accessing internal media array via any cast
          const media = (workbook as any).model.media?.find(
            (m: any) => m.index === img.imageId,
          );

          if (media) {
            const imgBuffer = Buffer.from(media.buffer);
            const extension = media.extension;
            const filename = `${Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('')}.${extension}`;
            const uploadPath = path.join(process.cwd(), 'uploads', filename);

            // Ensure uploads dir exists (handled by multer usually but good to check)
            if (!fs.existsSync(path.join(process.cwd(), 'uploads'))) {
              fs.mkdirSync(path.join(process.cwd(), 'uploads'));
            }

            fs.writeFileSync(uploadPath, imgBuffer);
            imagePath = `/uploads/${filename}`;
          }
        }

        let accessory;
        let product;

        // Strategy 1: Find by ID (Update Mode)
        if (id) {
          accessory = await this.accessoryRepo.findOne({
            where: { id },
            relations: ['product'],
          });

          if (accessory) {
            product = accessory.product;
            // Update product name if changed
            if (name && name !== product.name) {
              await this.productRepo.update(product.id, { name, unit });
            }
          }
        }

        // Strategy 2: Find/Create by Name (Insert/Upsert Mode)
        if (!accessory && name) {
          product = await this.productRepo.findOne({
            where: { name, type: 'ACCESSORY' },
          });
          if (!product) {
            product = this.productRepo.create({
              name,
              unit,
              type: 'ACCESSORY',
              cost_price: lastPrice,
            });
            await this.productRepo.save(product);
          }

          accessory = await this.accessoryRepo.findOne({
            where: { product_id: product.id },
          });
        }

        if (!accessory && !product) {
          throw new Error('Could not identify accessory by ID or Name');
        }

        const accessoryData: any = {
          reorder_point: reorderPoint,
          last_purchase_price: lastPrice,
          notes: notes,
          weight_per_piece: weight,
        };

        if (imagePath) {
          accessoryData.image_path = imagePath;
        }

        if (accessory) {
          await this.accessoryRepo.update(accessory.id, accessoryData);
        } else {
          // This block should theoretically be reached only if we created a new product above
          const newAccessory = this.accessoryRepo.create({
            ...accessoryData,
            product_id: product!.id,
          });
          await this.accessoryRepo.save(newAccessory);
        }

        results.success++;
      } catch (error) {
        results.errors++;
        results.failedRows.push({ row: i, error: error.message });
      }
    }

    return results;
  }
}

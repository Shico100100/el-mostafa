import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { BadRequestException } from '@nestjs/common';
import { Stock } from '../inventory/entities/stock.entity';
import { Product } from '../inventory/entities/product.entity';
import {
  StockMovement,
  MovementType,
} from '../inventory/entities/stock-movement.entity';

@Injectable()
export class WarehouseHelper {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async getDefaultWarehouseId(): Promise<number> {
    const warehouse = await this.warehouseRepo.findOne({
      where: { is_active: true },
      order: { id: 'ASC' },
    });
    if (warehouse) return warehouse.id;
    const created = await this.warehouseRepo.save(
      this.warehouseRepo.create({ name: 'المستودع الرئيسي', is_active: true }),
    );
    return created.id;
  }

  async getPlasticWarehouseId(): Promise<number> {
    let warehouse = await this.warehouseRepo.findOne({
      where: { name: 'مخزن البلاستيك' },
    });
    if (warehouse) return warehouse.id;
    warehouse = await this.warehouseRepo.save(
      this.warehouseRepo.create({ name: 'مخزن البلاستيك', is_active: true }),
    );
    return warehouse.id;
  }

  async safeDeductStock(
    productId: number,
    qty: number,
    manager?: any,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Stock) : this.stockRepo;
    const stock = await repo.findOne({ where: { product_id: productId } });
    if (!stock || Number(stock.quantity) < qty) {
      const product = await this.productRepo.findOne({
        where: { id: productId },
      });
      throw new BadRequestException(
        `رصيد غير كافٍ للمنتج: ${product?.name || 'غير معروف'} (المطلوب: ${qty}, المتوفر: ${stock ? Number(stock.quantity) : 0})`,
      );
    }
    stock.quantity = Number(stock.quantity) - qty;
    await repo.save(stock);
  }

  async deductRawMaterialStock(
    productId: number,
    quantity: number,
    reference: { type: string; id: number },
    manager: any,
  ): Promise<void> {
    const stockRepo = manager.getRepository(Stock);
    const stock = await stockRepo.findOne({ where: { product_id: productId } });
    if (!stock || Number(stock.quantity) < quantity) {
      const product = await this.productRepo.findOne({
        where: { id: productId },
      });
      throw new BadRequestException(
        `رصيد غير كافٍ للمادة الخام: ${product?.name || 'غير معروف'} (المطلوب: ${quantity}, المتوفر: ${stock ? Number(stock.quantity) : 0})`,
      );
    }
    stock.quantity = Number(stock.quantity) - quantity;
    await stockRepo.save(stock);
    const stockMovementRepo = manager.getRepository(StockMovement);
    await stockMovementRepo.save({
      product_id: productId,
      warehouse_id: stock.warehouse_id,
      type: MovementType.OUT,
      quantity,
      reference_type: reference.type,
      reference_id: reference.id,
      date: new Date(),
      notes: `Used in production: ${reference.id}`,
    });
  }

  async reverseRawMaterialStock(
    productId: number,
    quantity: number,
    reference: { type: string; id: number },
    manager: any,
  ): Promise<void> {
    const stockRepo = manager.getRepository(Stock);
    const stock = await stockRepo.findOne({ where: { product_id: productId } });
    if (stock) {
      stock.quantity = Number(stock.quantity) + quantity;
      await stockRepo.save(stock);
      const stockMovementRepo = manager.getRepository(StockMovement);
      await stockMovementRepo.save({
        product_id: productId,
        warehouse_id: stock.warehouse_id,
        type: MovementType.IN,
        quantity,
        reference_type: reference.type,
        reference_id: reference.id,
        date: new Date(),
        notes: `Reversal of Production #${reference.id}`,
      });
    }
  }

  async addSemiFinishedStock(
    moldName: string,
    pieces: number,
    overheadCost: number | undefined,
    plasticWhId: number,
    reference: { type: string; id: number },
    manager: any,
  ): Promise<void> {
    const productRepo = manager.getRepository(Product);
    const stockRepo = manager.getRepository(Stock);
    const stockMovementRepo = manager.getRepository(StockMovement);

    const productName = `بلاستيك ${moldName}`;
    let product = await productRepo.findOne({
      where: { name: productName, type: 'SEMI_FINISHED' },
    });
    if (!product) {
      product = productRepo.create({
        name: productName,
        type: 'SEMI_FINISHED',
        unit: 'piece',
        cost_price: 0,
        selling_price: 0,
      });
      product = await productRepo.save(product);
    }
    let productStock = await stockRepo.findOne({
      where: { product_id: product.id },
    });
    if (!productStock) {
      productStock = stockRepo.create({
        product_id: product.id,
        warehouse_id: plasticWhId,
        quantity: 0,
      });
    }
    const oldStockQty = Number(productStock.quantity || 0);
    const oldCost = Number(product.cost_price || 0);
    const newPieces = Number(pieces);
    const wac =
      oldStockQty + newPieces > 0
        ? (oldStockQty * oldCost + newPieces * (overheadCost || 0)) /
          (oldStockQty + newPieces)
        : overheadCost || 0;
    await productRepo.update(product.id, { cost_price: wac });
    productStock.quantity = Number(productStock.quantity) + newPieces;
    await stockRepo.save(productStock);
    await stockMovementRepo.save({
      product_id: product.id,
      warehouse_id: productStock.warehouse_id || plasticWhId,
      type: MovementType.IN,
      quantity: pieces,
      reference_type: reference.type,
      reference_id: reference.id,
      date: new Date(),
      notes: `Production #${reference.id}`,
    });
  }

  async reverseSemiFinishedStock(
    moldName: string,
    pieces: number,
    plasticWhId: number,
    reference: { type: string; id: number },
    manager: any,
  ): Promise<void> {
    const productRepo = manager.getRepository(Product);
    const stockRepo = manager.getRepository(Stock);
    const stockMovementRepo = manager.getRepository(StockMovement);

    const productName = `بلاستيك ${moldName}`;
    const product = await productRepo.findOne({
      where: { name: productName, type: 'SEMI_FINISHED' },
    });
    if (product) {
      const stock = await stockRepo.findOne({
        where: { product_id: product.id },
      });
      if (stock) {
        if (Number(stock.quantity) < pieces) {
          throw new BadRequestException(
            `رصيد غير كافٍ لعكس الإنتاج: ${product.name} (المطلوب: ${pieces}, المتوفر: ${stock.quantity})`,
          );
        }
        stock.quantity = Number(stock.quantity) - pieces;
        await stockRepo.save(stock);
        await stockMovementRepo.save({
          product_id: product.id,
          warehouse_id: stock.warehouse_id || plasticWhId,
          type: MovementType.OUT,
          quantity: pieces,
          reference_type: reference.type,
          reference_id: reference.id,
          date: new Date(),
          notes: `Reversal of Production #${reference.id}`,
        });
      }
    }
  }

  async processBOMConsumption(
    bom: any,
    pieces: number,
    reference: { type: string; id: number },
    manager: any,
  ): Promise<void> {
    const stockRepo = manager.getRepository(Stock);
    const stockMovementRepo = manager.getRepository(StockMovement);
    for (const item of bom.items) {
      const requiredQty = Number(item.quantity) * Number(pieces);
      const itemStock = await stockRepo.findOne({
        where: { product_id: item.product_id },
      });
      if (itemStock) {
        if (Number(itemStock.quantity) < requiredQty) {
          throw new BadRequestException(
            `رصيد غير كافٍ لمكون BOM: ${item.product?.name || 'غير معروف'} (المطلوب: ${requiredQty}, المتوفر: ${itemStock.quantity})`,
          );
        }
        itemStock.quantity = Number(itemStock.quantity) - requiredQty;
        await stockRepo.save(itemStock);
        await stockMovementRepo.save({
          product_id: item.product_id,
          warehouse_id: itemStock.warehouse_id,
          type: MovementType.OUT,
          quantity: requiredQty,
          reference_type: reference.type,
          reference_id: reference.id,
          date: new Date(),
          notes: `BOM Deduction for Production #${reference.id}`,
        });
      }
    }
  }

  async reverseBOMConsumption(
    bom: any,
    pieces: number,
    reference: { type: string; id: number },
    manager: any,
  ): Promise<void> {
    const stockRepo = manager.getRepository(Stock);
    const stockMovementRepo = manager.getRepository(StockMovement);
    for (const item of bom.items) {
      const requiredQty = Number(item.quantity) * Number(pieces);
      const itemStock = await stockRepo.findOne({
        where: { product_id: item.product_id },
      });
      if (itemStock) {
        itemStock.quantity = Number(itemStock.quantity) + requiredQty;
        await stockRepo.save(itemStock);
        await stockMovementRepo.save({
          product_id: item.product_id,
          warehouse_id: itemStock.warehouse_id,
          type: MovementType.IN,
          quantity: requiredQty,
          reference_type: reference.type,
          reference_id: reference.id,
          date: new Date(),
          notes: `BOM Reversal for Production #${reference.id}`,
        });
      }
    }
  }
}

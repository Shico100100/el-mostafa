import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BOM, BOMItem } from './entities/bom.entity';
import { Product } from '../inventory/entities/product.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { FixedCost } from './entities/fixed-cost.entity';
import { DailyProduction } from './entities/daily-production.entity';
import { PurchaseOrderItem } from '../purchases/entities/purchase-order-item.entity';

@Injectable()
export class BOMService {
  constructor(
    @InjectRepository(BOM)
    private bomRepo: Repository<BOM>,
    @InjectRepository(BOMItem)
    private bomItemRepo: Repository<BOMItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(FixedCost)
    private fixedCostRepo: Repository<FixedCost>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepo: Repository<PurchaseOrderItem>,
  ) {}

  async getBOMs(page = 1, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;
    const [items, total] = await this.bomRepo.findAndCount({
      relations: [
        'product',
        'items',
        'items.product',
        'carton_product',
        'box_product',
      ],
      skip,
      take,
    });
    return {
      items,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async createBOM(data: Partial<BOM>) {
    const bom = this.bomRepo.create(data);
    return this.bomRepo.save(bom);
  }

  async getBOM(id: number) {
    return this.bomRepo.findOne({
      where: { id },
      relations: [
        'product',
        'items',
        'items.product',
        'carton_product',
        'box_product',
      ],
    });
  }

  async updateBOM(id: number, data: any) {
    const bom = await this.bomRepo.findOne({ where: { id } });
    if (!bom) throw new NotFoundException('قائمة المكونات غير موجودة');
    if (data.name) bom.name = data.name;
    if (data.product_id) bom.product_id = data.product_id;
    if (data.pcs_per_carton !== undefined)
      bom.pcs_per_carton = data.pcs_per_carton;
    if (data.pcs_per_box !== undefined) bom.pcs_per_box = data.pcs_per_box;
    if (data.carton_product_id !== undefined)
      bom.carton_product_id = data.carton_product_id;
    if (data.box_product_id !== undefined)
      bom.box_product_id = data.box_product_id;
    if (data.description !== undefined) bom.description = data.description;
    await this.bomRepo.save(bom);
    if (data.items) {
      await this.bomItemRepo.delete({ bom_id: id });
      const newItems = data.items.map((i: any) =>
        this.bomItemRepo.create({
          bom_id: id,
          product_id: i.product_id,
          quantity: i.quantity,
        }),
      );
      await this.bomItemRepo.save(newItems);
    }
    return this.getBOM(id);
  }

  async deleteBOM(id: number) {
    const bom = await this.bomRepo.findOne({ where: { id } });
    if (!bom) throw new NotFoundException('قائمة المكونات غير موجودة');
    await this.bomRepo.delete(id);
    return { deleted: true };
  }

  async calculateProductionCost(bomId: number, quantity: number) {
    if (!quantity || quantity < 1)
      throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');
    const bom = await this.bomRepo.findOne({
      where: { id: bomId },
      relations: ['items', 'items.product'],
    });
    if (!bom) throw new NotFoundException('قائمة المكونات غير موجودة');

    let totalCost = 0;
    const breakdown: any[] = [];
    for (const item of bom.items) {
      const requiredQty = Number(item.quantity) * Number(quantity);
      let unitPrice = Number(item.product.cost_price);
      if (!unitPrice) {
        const lastItem = await this.purchaseOrderItemRepo.findOne({
          where: { product: { id: item.product.id } },
          order: { id: 'DESC' },
        });
        unitPrice = lastItem ? Number(lastItem.price) : 0;
      }
      const itemCost = unitPrice * requiredQty;
      totalCost += itemCost;
      breakdown.push({
        product: item.product,
        quantity_per_unit: item.quantity,
        total_quantity: requiredQty,
        cost_per_unit: unitPrice,
        total_cost: itemCost,
      });
    }

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const fixedCosts = await this.fixedCostRepo.find({ where: { month } });
    const totalFixedCosts = fixedCosts.reduce(
      (sum, fc) => sum + Number(fc.amount),
      0,
    );
    let overheadPerPiece = 0;
    if (totalFixedCosts) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const totalPieces = await this.productionRepo.sum('pieces_produced', {
        date: Between(startOfMonth, endOfMonth),
      });
      if (totalPieces) overheadPerPiece = totalFixedCosts / totalPieces;
    }

    const overheadCost = overheadPerPiece * quantity;
    const totalWithOverhead = totalCost + overheadCost;
    return {
      bom_id: bomId,
      quantity,
      total_cost: totalWithOverhead,
      material_cost: totalCost,
      overhead_cost: overheadCost,
      overhead_per_piece: overheadPerPiece,
      cost_per_unit: totalWithOverhead / quantity,
      breakdown,
    };
  }

  async explodeBOM(
    bomId: number,
    quantity: number,
    visitedBomIds: Set<number> = new Set(),
  ) {
    if (visitedBomIds.has(bomId)) {
      throw new BadRequestException(
        `دائرة مغلقة في BOM: تم تجاوز الـ BOM ذو المعرف ${bomId} مسبقاً`,
      );
    }
    visitedBomIds.add(bomId);

    const bom = await this.bomRepo.findOne({
      where: { id: bomId },
      relations: [
        'product',
        'items',
        'items.product',
        'carton_product',
        'box_product',
      ],
    });
    if (!bom) throw new NotFoundException('قائمة المكونات غير موجودة');

    const components: any[] = [];
    let totalWeight = 0;

    for (const item of bom.items) {
      const requiredQty = Number(item.quantity) * Number(quantity);
      const product = item.product;
      const subBom = await this.bomRepo.findOne({
        where: { product: { id: product.id } },
        relations: ['items', 'items.product'],
      });

      if (subBom && subBom.items.length > 0) {
        const subResult = await this.explodeBOM(
          subBom.id,
          requiredQty,
          new Set(visitedBomIds),
        );
        components.push(...subResult.components);
        totalWeight += subResult.total_weight_grams;
      } else {
        const weight = Number(product.weight_grams) || 0;
        const itemWeight = weight * requiredQty;
        totalWeight += itemWeight;
        const stockRow = await this.stockRepo.findOne({
          where: { product_id: product.id },
        });
        const stockQty = stockRow ? Number(stockRow.quantity) : 0;
        let componentCostPrice = Number(product.cost_price);
        if (!componentCostPrice) {
          const lastItem = await this.purchaseOrderItemRepo.findOne({
            where: { product: { id: product.id } },
            order: { id: 'DESC' },
          });
          componentCostPrice = lastItem ? Number(lastItem.price) : 0;
        }
        components.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          specs: product.description || '',
          weight_grams: weight,
          raw_material_type: product.raw_material_type || '',
          image_path: product.image_path || '',
          quantity_per_unit: Number(item.quantity),
          total_quantity: requiredQty,
          unit: product.unit,
          total_weight_grams: itemWeight,
          total_weight_kg: itemWeight / 1000,
          stock_quantity: stockQty,
          cost_price: componentCostPrice,
          selling_price: Number(product.selling_price) || 0,
        });
      }
    }

    const merged = new Map<number, (typeof components)[0]>();
    for (const comp of components) {
      const existing = merged.get(comp.product_id);
      if (existing) {
        existing.total_quantity += comp.total_quantity;
        existing.total_weight_grams += comp.total_weight_grams;
        existing.total_weight_kg = existing.total_weight_grams / 1000;
      } else {
        merged.set(comp.product_id, { ...comp });
      }
    }

    return {
      bom_id: bomId,
      bom_name: bom.name,
      product_name: bom.product?.name || '',
      product_cost_price: Number(bom.product?.cost_price) || 0,
      product_selling_price: Number(bom.product?.selling_price) || 0,
      requested_quantity: quantity,
      total_components: merged.size,
      total_weight_grams: totalWeight,
      total_weight_kg: totalWeight / 1000,
      components: Array.from(merged.values()),
      pcs_per_carton: bom.pcs_per_carton,
      pcs_per_box: bom.pcs_per_box,
      carton_product: bom.carton_product || null,
      box_product: bom.box_product || null,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  ProductionSchedule,
  ScheduleStatus,
} from './entities/production-schedule.entity';
import { BOM } from './entities/bom.entity';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../purchases/entities/purchase-order.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { Product } from '../inventory/entities/product.entity';
import {
  ManufacturingOrder,
  ManufacturingOrderStatus,
} from './entities/manufacturing-order.entity';

@Injectable()
export class MRPService {
  constructor(
    @InjectRepository(ProductionSchedule)
    private scheduleRepo: Repository<ProductionSchedule>,
    @InjectRepository(BOM)
    private bomRepo: Repository<BOM>,
    @InjectRepository(PurchaseOrder)
    private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ManufacturingOrder)
    private moRepo: Repository<ManufacturingOrder>,
  ) {}

  async getMaterialPlanning() {
    const requirements: Map<number, { product: Product; quantity: number }> =
      new Map();

    // Helper: explode BOM demand into raw material requirements
    const addDemand = async (productId: number, quantity: number) => {
      const bom = await this.bomRepo.findOne({
        where: { product_id: productId },
        relations: ['items', 'items.product'],
      });
      if (bom) {
        for (const item of bom.items) {
          const needed = Number(item.quantity) * quantity;
          const current = requirements.get(item.product_id) || {
            product: item.product,
            quantity: 0,
          };
          requirements.set(item.product_id, {
            product: item.product,
            quantity: current.quantity + needed,
          });
        }
      }
    };

    // 1. Demand from Production Schedules
    const schedules = await this.scheduleRepo.find({
      where: { status: ScheduleStatus.PENDING },
      relations: ['product'],
    });
    for (const schedule of schedules) {
      await addDemand(schedule.product_id, Number(schedule.target_quantity));
    }

    // 2. Demand from Sales (Manufacturing Orders)
    const mos = await this.moRepo.find({
      where: { status: ManufacturingOrderStatus.PENDING },
      relations: ['product'],
    });
    for (const mo of mos) {
      await addDemand(mo.product_id, Number(mo.quantity_required) - Number(mo.quantity_produced));
    }

    // 3. Get Current Stock for these products
    const productIds = Array.from(requirements.keys());
    const stockMap: Map<number, number> = new Map();
    if (productIds.length > 0) {
      const stocks = await this.stockRepo.find({
        where: { product_id: In(productIds) },
      });
      stocks.forEach((s) => stockMap.set(s.product_id, Number(s.quantity)));
    }

    // 4. Get Incoming Supply (Pending Purchase Orders)
    const incomingMap: Map<number, number> = new Map();
    if (productIds.length > 0) {
      const pendingPos = await this.poRepo
        .createQueryBuilder('po')
        .leftJoinAndSelect('po.items', 'item')
        .where('po.status = :status', { status: PurchaseOrderStatus.PENDING })
        .getMany();

      for (const po of pendingPos) {
        for (const item of po.items) {
          if (productIds.includes(item.product_id)) {
            const current = incomingMap.get(item.product_id) || 0;
            incomingMap.set(item.product_id, current + Number(item.quantity));
          }
        }
      }
    }

    // 5. Consolidate Data
    const report = Array.from(requirements.values()).map((req) => {
      const productId = req.product.id;
      const currentStock = stockMap.get(productId) || 0;
      const incoming = incomingMap.get(productId) || 0;
      const required = req.quantity;
      const netStatus = currentStock + incoming - required;

      return {
        id: productId,
        name: req.product.name,
        unit: req.product.unit,
        currentStock,
        incoming,
        required,
        netStatus,
        status:
          netStatus < 0
            ? 'SHORTAGE'
            : netStatus < Number(req.product.min_stock || 0)
              ? 'LOW_STOCK'
              : 'OK',
      };
    });

    return report.sort((a, b) => a.netStatus - b.netStatus);
  }

  async calculateAdhocMRP(items: { productId: number; quantity: number }[]) {
    const requirements: Map<number, { product: Product; quantity: number }> =
      new Map();

    for (const item of items) {
      const bom = await this.bomRepo.findOne({
        where: { product_id: item.productId },
        relations: ['items', 'items.product'],
      });

      if (bom) {
        for (const bomItem of bom.items) {
          const needed = Number(bomItem.quantity) * Number(item.quantity);
          const current = requirements.get(bomItem.product_id) || {
            product: bomItem.product,
            quantity: 0,
          };
          requirements.set(bomItem.product_id, {
            product: bomItem.product,
            quantity: current.quantity + needed,
          });
        }
      }
    }

    const productIds = Array.from(requirements.keys());
    const stockMap: Map<number, number> = new Map();
    if (productIds.length > 0) {
      const stocks = await this.stockRepo.find({
        where: { product_id: In(productIds) },
      });
      stocks.forEach((s) => stockMap.set(s.product_id, Number(s.quantity)));
    }

    return Array.from(requirements.values())
      .map((req) => {
        const productId = req.product.id;
        const currentStock = stockMap.get(productId) || 0;
        const required = req.quantity;
        const netStatus = currentStock - required;

        return {
          id: productId,
          name: req.product.name,
          unit: req.product.unit,
          currentStock,
          required,
          netStatus,
          status:
            netStatus < 0
              ? 'SHORTAGE'
              : netStatus < Number(req.product.min_stock || 0)
                ? 'LOW_STOCK'
                : 'OK',
        };
      })
      .sort((a, b) => a.netStatus - b.netStatus);
  }
}

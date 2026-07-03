import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BOM } from '../entities/bom.entity';
import { Mold, MoldStatus } from '../entities/mold.entity';
import { Machine, MachineStatus } from '../entities/machine.entity';
import { Stock } from '../../inventory/entities/stock.entity';
import { Product } from '../../inventory/entities/product.entity';
import { DailyProduction } from '../entities/daily-production.entity';

interface FeasibilityRequestItem {
  productId: number;
  quantity: number;
}

interface ComponentRequirement {
  productId: number;
  productName: string;
  unit: string;
  required: number;
  currentStock: number;
  shortage: number;
  status: 'OK' | 'SHORTAGE';
  procurementSuggestion?: {
    preferredSupplierId?: number;
    preferredSupplierName?: string;
    estimatedCost?: number;
    leadTimeDays?: number;
    suggestedOrderQty?: number;
    lastPurchasePrice?: number;
  };
}

interface ProductAnalysis {
  productId: number;
  productName: string;
  quantity: number;
  bomFound: boolean;
  bomName?: string;
  componentCount: number;
  moldFound: boolean;
  moldName?: string;
  moldCavities?: number;
  compatibleMachines: { id: number; name: string; status: string }[];
  suggestedMachine?: { id: number; name: string; reason: string };
  status: 'OK' | 'NO_BOM' | 'NO_MOLD' | 'NO_MACHINE';
  estimatedHours?: number;
}

interface MachineSuggestion {
  machineId: number;
  machineName: string;
  assignedProducts: {
    productName: string;
    quantity: number;
    moldName: string;
    cavities: number;
    estimatedHours: number;
  }[];
  totalEstimatedHours: number;
}

interface PlasticMaterialItem {
  materialId: number;
  materialName: string;
  quantityPerUnit: number;
  totalQuantity: number;
  unit: string;
}

interface PlasticMaterialSuggestion {
  productId: number;
  productName: string;
  targetQuantity: number;
  materials: PlasticMaterialItem[];
  estimatedDays: number | null;
  suggestedMachineName: string | null;
}

export interface FeasibilityReport {
  overall: 'FEASIBLE' | 'PARTIAL' | 'NOT_FEASIBLE';
  items: ProductAnalysis[];
  components: ComponentRequirement[];
  machineSuggestions: MachineSuggestion[];
  plasticMaterialSuggestions: PlasticMaterialSuggestion[];
  summary: {
    totalProducts: number;
    totalComponents: number;
    shortageComponents: number;
    totalEstimatedDays: number;
    productsWithIssues: number;
  };
}

@Injectable()
export class FeasibilityAnalysisService {
  constructor(
    @InjectRepository(BOM)
    private bomRepo: Repository<BOM>,
    @InjectRepository(Mold)
    private moldRepo: Repository<Mold>,
    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,
    @InjectRepository(Stock)
    private stockRepo: Repository<Stock>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(DailyProduction)
    private productionRepo: Repository<DailyProduction>,
  ) {}

  async analyze(items: FeasibilityRequestItem[]): Promise<FeasibilityReport> {
    const productAnalyses: ProductAnalysis[] = [];
    const allComponents: Map<
      number,
      { product: Product; totalRequired: number }
    > = new Map();
    const machineSuggestions: MachineSuggestion[] = [];

    for (const item of items) {
      const analysis = await this.analyzeProduct(item);
      productAnalyses.push(analysis);

      if (analysis.bomFound) {
        const bom = await this.bomRepo.findOne({
          where: { product: { id: item.productId } },
          relations: ['items', 'items.product'],
        });
        if (bom) {
          for (const bomItem of bom.items) {
            const needed = Number(bomItem.quantity) * item.quantity;
            const existing = allComponents.get(bomItem.product_id) || {
              product: bomItem.product,
              totalRequired: 0,
            };
            allComponents.set(bomItem.product_id, {
              product: existing.product,
              totalRequired: existing.totalRequired + needed,
            });
          }
        }
      }
    }

    const componentRequirements =
      await this.evaluateComponentStock(allComponents);
    const shortageCount = componentRequirements.filter(
      (c) => c.status === 'SHORTAGE',
    ).length;
    const shortageMap = new Map<number, number>();
    for (const c of componentRequirements) {
      if (c.shortage > 0) shortageMap.set(c.productId, c.shortage);
    }

    const productsWithIssues = productAnalyses.filter(
      (p) => p.status !== 'OK' || p.compatibleMachines.length === 0,
    ).length;

    const productDaysMap = new Map<number, number>();
    let totalEstimatedDays = 0;
    for (const analysis of productAnalyses) {
      const mold = await this.moldRepo.findOne({
        where: { product: { id: analysis.productId } },
      });
      if (mold) {
        const records = await this.productionRepo.find({
          where: { mold: { id: mold.id } },
          select: ['date', 'pieces_produced', 'hours_worked'],
        });
        if (records.length > 0) {
          const dailyMap = new Map<string, { pieces: number; hours: number }>();
          for (const r of records) {
            const key =
              r.date instanceof Date
                ? r.date.toISOString().split('T')[0]
                : String(r.date);
            const existing = dailyMap.get(key) || { pieces: 0, hours: 0 };
            existing.pieces += Number(r.pieces_produced || 0);
            existing.hours += Number(r.hours_worked || 0);
            dailyMap.set(key, existing);
          }
          const dailyTotals = Array.from(dailyMap.values());
          const avgDailyPieces =
            dailyTotals.reduce((s, d) => s + d.pieces, 0) / dailyTotals.length;
          const avgDailyHours =
            dailyTotals.reduce((s, d) => s + d.hours, 0) / dailyTotals.length;

          if (avgDailyPieces > 0) {
            const days = Math.ceil(analysis.quantity / avgDailyPieces);
            productDaysMap.set(analysis.productId, days);
            totalEstimatedDays += days;
            analysis.estimatedHours = Math.ceil(days * avgDailyHours);
          }
        }
      }
    }

    const plasticMaterialSuggestions: PlasticMaterialSuggestion[] = [];
    for (const item of items) {
      const product = await this.productRepo.findOne({
        where: { id: item.productId },
      });
      if (!product) continue;
      const bom = await this.bomRepo.findOne({
        where: { product: { id: item.productId } },
        relations: ['items', 'items.product'],
      });
      if (!bom) continue;
      const analysis = productAnalyses.find(
        (a) => a.productId === item.productId,
      );
      const materials: PlasticMaterialItem[] = [];
      for (const bomItem of bom.items) {
        if (!bomItem.product?.name?.startsWith('بلاستيك')) continue;
        if (!shortageMap.has(bomItem.product_id)) continue;
        materials.push({
          materialId: bomItem.product_id,
          materialName: bomItem.product.name,
          quantityPerUnit: Number(bomItem.quantity),
          totalQuantity: Number(bomItem.quantity) * item.quantity,
          unit: bomItem.product.unit || '',
        });
      }
      if (materials.length > 0) {
        plasticMaterialSuggestions.push({
          productId: item.productId,
          productName: product.name,
          targetQuantity: item.quantity,
          materials,
          estimatedDays: productDaysMap.get(item.productId) || null,
          suggestedMachineName: analysis?.suggestedMachine?.name || null,
        });
      }
    }

    const hasCriticalIssues = productAnalyses.some(
      (p) => p.status === 'NO_BOM',
    );
    const hasShortages = shortageCount > 0;
    const hasMachineIssues = productsWithIssues > 0;

    let overall: 'FEASIBLE' | 'PARTIAL' | 'NOT_FEASIBLE' = 'FEASIBLE';
    if (hasCriticalIssues) {
      overall = 'NOT_FEASIBLE';
    } else if (hasShortages || hasMachineIssues) {
      overall = 'PARTIAL';
    }

    return {
      overall,
      items: productAnalyses,
      components: componentRequirements,
      machineSuggestions,
      plasticMaterialSuggestions,
      summary: {
        totalProducts: items.length,
        totalComponents: allComponents.size,
        shortageComponents: shortageCount,
        totalEstimatedDays,
        productsWithIssues,
      },
    };
  }

  private async analyzeProduct(
    item: FeasibilityRequestItem,
  ): Promise<ProductAnalysis> {
    const product = await this.productRepo.findOne({
      where: { id: item.productId },
    });
    const productName = product?.name || 'Unknown';

    const bom = await this.bomRepo.findOne({
      where: { product: { id: item.productId } },
      relations: ['items', 'items.product'],
    });

    if (!bom) {
      return {
        productId: item.productId,
        productName,
        quantity: item.quantity,
        bomFound: false,
        componentCount: 0,
        moldFound: false,
        compatibleMachines: [],
        status: 'NO_BOM',
      };
    }

    const mold = await this.moldRepo.findOne({
      where: { product: { id: item.productId }, status: MoldStatus.GOOD },
    });

    const allActiveMachines = await this.machineRepo.find({
      where: { status: MachineStatus.ACTIVE },
    });

    let compatibleMachines: { id: number; name: string; status: string }[] = [];
    let suggestedMachine:
      | { id: number; name: string; reason: string }
      | undefined;

    if (mold) {
      const machinesUsingMold = await this.productionRepo
        .createQueryBuilder('dp')
        .select('DISTINCT dp.machine_id')
        .where('dp.mold_id = :moldId', { moldId: mold.id })
        .getRawMany();

      const machineIds = machinesUsingMold.map((r: any) =>
        Number(r.machine_id),
      );
      compatibleMachines = allActiveMachines
        .filter((m) => machineIds.length === 0 || machineIds.includes(m.id))
        .map((m) => ({ id: m.id, name: m.name, status: m.status }));

      if (compatibleMachines.length === 0 && allActiveMachines.length > 0) {
        compatibleMachines = allActiveMachines.map((m) => ({
          id: m.id,
          name: m.name,
          status: m.status,
        }));
      }
    } else {
      compatibleMachines = allActiveMachines.map((m) => ({
        id: m.id,
        name: m.name,
        status: m.status,
      }));
    }

    const cavities = mold?.cavities || 1;
    const cycleTimeMinutes = 1;
    const piecesPerHour = cavities * (60 / cycleTimeMinutes);
    const estimatedHours = Math.ceil(item.quantity / piecesPerHour);

    return {
      productId: item.productId,
      productName,
      quantity: item.quantity,
      bomFound: true,
      bomName: bom.name,
      componentCount: bom.items.length,
      moldFound: !!mold,
      moldName: mold?.name,
      moldCavities: cavities,
      compatibleMachines,
      suggestedMachine,
      status: mold ? 'OK' : 'NO_MOLD',
      estimatedHours,
    };
  }

  private async evaluateComponentStock(
    components: Map<number, { product: Product; totalRequired: number }>,
  ): Promise<ComponentRequirement[]> {
    const productIds = Array.from(components.keys());
    const stockMap: Map<number, number> = new Map();

    if (productIds.length > 0) {
      const stocks = await this.stockRepo.find({
        where: { product_id: In(productIds) },
      });
      stocks.forEach((s) => stockMap.set(s.product_id, Number(s.quantity)));
    }

    const products = await this.productRepo.find({
      where: { id: In(productIds) },
      relations: ['preferred_supplier'],
    });

    const productMap = new Map<number, Product>();
    products.forEach((p) => productMap.set(p.id, p));

    const results: ComponentRequirement[] = [];

    for (const [productId, { product, totalRequired }] of components) {
      const currentStock = stockMap.get(productId) || 0;
      const shortage = Math.max(0, totalRequired - currentStock);
      const status = shortage > 0 ? 'SHORTAGE' : 'OK';

      let procurementSuggestion: ComponentRequirement['procurementSuggestion'] =
        undefined;

      if (shortage > 0) {
        const prod = productMap.get(productId);
        if (prod) {
          procurementSuggestion = {
            preferredSupplierId: prod.preferred_supplier_id,
            preferredSupplierName: prod.preferred_supplier?.name,
            estimatedCost:
              shortage *
              (Number(prod.last_purchase_price) ||
                Number(product.cost_price) ||
                0),
            leadTimeDays: 14,
            suggestedOrderQty: Math.max(
              shortage,
              Number(prod.reorder_quantity) || shortage,
            ),
            lastPurchasePrice:
              Number(prod.last_purchase_price) ||
              Number(product.cost_price) ||
              undefined,
          };
        } else {
          procurementSuggestion = {
            estimatedCost: shortage * (Number(product.cost_price) || 0),
            leadTimeDays: 14,
            suggestedOrderQty: shortage,
          };
        }
      }

      results.push({
        productId,
        productName: product.name,
        unit: product.unit,
        required: totalRequired,
        currentStock,
        shortage,
        status,
        procurementSuggestion,
      });
    }

    return results.sort((a, b) => b.shortage - a.shortage);
  }
}

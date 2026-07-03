export interface Product {
  id: number;
  name: string;
  unit: string;
  type: string;
}

export interface MachineInfo {
  id: number;
  name: string;
  status: string;
}

export interface ProductAnalysis {
  productId: number;
  productName: string;
  quantity: number;
  bomFound: boolean;
  bomName?: string;
  componentCount: number;
  moldFound: boolean;
  moldName?: string;
  moldCavities?: number;
  compatibleMachines: MachineInfo[];
  suggestedMachine?: { id: number; name: string; reason: string };
  status: 'OK' | 'NO_BOM' | 'NO_MOLD' | 'NO_MACHINE';
  estimatedHours?: number;
}

export interface ComponentRequirement {
  productId: number;
  productName: string;
  unit: string;
  required: number;
  currentStock: number;
  shortage: number;
  status: 'OK' | 'SHORTAGE';
  procurementSuggestion?: {
    preferredSupplierName?: string;
    estimatedCost?: number;
    leadTimeDays?: number;
    suggestedOrderQty?: number;
    lastPurchasePrice?: number;
  };
}

export interface PlasticMaterialItem {
  materialId: number;
  materialName: string;
  quantityPerUnit: number;
  totalQuantity: number;
  unit: string;
}

export interface PlasticMaterialSuggestion {
  productId: number;
  productName: string;
  targetQuantity: number;
  materials: PlasticMaterialItem[];
  estimatedDays: number | null;
  suggestedMachineName: string | null;
}

export interface ProductionHistoryEntry {
  date: string;
  pieces: number;
  machineName: string;
  hours: number;
}

export interface ProductionHistoryData {
  allDays: ProductionHistoryEntry[];
  allAverage: number;
  allTop10: ProductionHistoryEntry[];
  recentDays: ProductionHistoryEntry[];
  recentAverage: number;
}

export interface FeasibilityReport {
  overall: 'FEASIBLE' | 'PARTIAL' | 'NOT_FEASIBLE';
  items: ProductAnalysis[];
  components: ComponentRequirement[];
  machineSuggestions: never[];
  plasticMaterialSuggestions: PlasticMaterialSuggestion[];
  summary: {
    totalProducts: number;
    totalComponents: number;
    shortageComponents: number;
    totalEstimatedDays: number;
    productsWithIssues: number;
  };
}

export interface ProductionItem {
  productId: number;
  quantity: string;
}

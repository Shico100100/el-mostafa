// Single source of truth for the product save payload. Mirrors
// CreateProductDto on the backend: only these keys may leave the client,
// because the API rejects unknown props (forbidNonWhitelisted) with 422.
export const PRODUCT_PAYLOAD_KEYS = [
  'name',
  'cost_price',
  'selling_price',
  'category_id',
  'warehouse_id',
  'unit',
  'type',
  'description',
  'min_stock',
  'weight_grams',
  'image_path',
  'raw_material_type',
  'initial_stock',
] as const;

export interface ProductFormData {
  id?: number;
  name: string;
  type: string;
  unit: string;
  cost_price?: number | null;
  category_id?: number;
  selling_price: number;
  stock_quantity: number;
  min_stock?: number | null;
  warehouse_id?: number;
  description?: string | null;
  weight_grams?: number | null;
  image_path?: string | null;
}

export function toProductPayload(
  data: ProductFormData,
): Record<string, unknown> {
  const source = data as unknown as Record<string, unknown>;
  const payload: Record<string, unknown> = {};
  for (const k of PRODUCT_PAYLOAD_KEYS) {
    if (source[k] !== undefined) payload[k] = source[k];
  }
  return payload;
}

export interface ProductLike {
  id?: number;
  name: string;
  type: string;
  unit: string;
  cost_price?: number | string | null;
  category_id?: number;
  selling_price: number | string;
  stock_quantity?: number | string;
  min_stock?: number | string | null;
  warehouse_id?: number;
  description?: string | null;
  weight_grams?: number | string | null;
  image_path?: string | null;
}

export function toProductData(p: ProductLike): ProductFormData {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    unit: p.unit,
    cost_price: p.cost_price != null ? Number(p.cost_price) : null,
    category_id: p.category_id || undefined,
    selling_price: Number(p.selling_price),
    stock_quantity: Number(p.stock_quantity ?? 0),
    min_stock: p.min_stock ? Number(p.min_stock) : null,
    warehouse_id: p.warehouse_id || undefined,
    description: p.description || null,
    weight_grams: p.weight_grams ? Number(p.weight_grams) : null,
    image_path: p.image_path || null,
  };
}

// ==================== Sales DTOs ====================

export interface CreateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreateOrderItemDto {
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  warehouse_id?: number;
}

export interface CreateSalesOrderDto {
  customer_id: number;
  total_amount: number;
  notes?: string;
  order_date?: string;
  items: CreateOrderItemDto[];
}

export interface CreateQuoteItemDto {
  product_id: number;
  quantity: number;
  price: number;
  total: number;
}

export interface CreateQuoteDto {
  customer_id: number;
  total_amount: number;
  notes?: string;
  status?: string;
  items?: CreateQuoteItemDto[];
}

export interface CreateCustomerPaymentDto {
  amount: number;
  payment_date: string | null;
  notes?: string;
}

export interface CreateReturnItemDto {
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CreateSalesReturnDto {
  customer_id: number;
  order_id?: number;
  total_amount: number;
  reason?: string;
  return_date?: string;
  items: CreateReturnItemDto[];
}

// ==================== Purchases DTOs ====================

export interface CreateSupplierDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreatePurchaseOrderItemDto {
  product_id: number;
  quantity: number;
  price: number;
  total: number;
  foreign_price?: number;
  foreign_total?: number;
  weight_kg?: number;
}

export interface CreatePurchaseOrderDto {
  supplier_id: number;
  total_amount: number;
  invoice_number?: string;
  notes?: string;
  order_date?: string;
  currency_code?: string;
  exchange_rate?: number;
  total_amount_foreign?: number;
  freight_cost?: number;
  customs_percent?: number;
  commission_percent?: number;
  total_landed_cost?: number;
  total_weight_kg?: number;
  items: CreatePurchaseOrderItemDto[];
}

export interface CreateSupplierPaymentDto {
  amount: number;
  amount_foreign?: number;
  currency_code?: string;
  exchange_rate?: number;
  payment_date: string | null;
  notes?: string;
}

export interface CreatePurchaseReturnItemDto {
  product_id: number;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CreatePurchaseReturnDto {
  supplier_id: number;
  order_id?: number;
  total_amount: number;
  return_date?: string;
  reason?: string;
  items: CreatePurchaseReturnItemDto[];
}

export interface CreatePackingListDto {
  container_id?: number;
  carton_length_cm: number;
  carton_width_cm: number;
  carton_height_cm: number;
  cartons_count: number;
  total_cbm?: number;
  actual_net_weight_kg?: number;
  actual_gross_weight_kg?: number;
  deviation_threshold_percent?: number;
  notes?: string;
}

export interface CreateCurrencyDto {
  code: string;
  name: string;
  symbol?: string;
  exchange_rate_to_egp?: number;
  is_active?: boolean;
}

export interface AddFxRateDto {
  currency_id: number;
  rate_to_egp: number;
  amount_paid?: number | null;
  notes?: string;
  rate_date: string;
}

export interface UpdateLandedCostDto {
  freight_cost?: number;
  customs_percent?: number;
  commission_percent?: number;
}

export interface CreateContainerDto {
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  max_weight_kg: number;
  max_cbm?: number;
  is_active?: boolean;
  notes?: string;
}

// ==================== Inventory DTOs ====================

export interface CreateProductDto {
  name: string;
  sku?: string;
  barcode?: string;
  cost_price?: number;
  selling_price?: number;
  category_id?: number;
  warehouse_id?: number;
  unit?: string;
  type?: string;
  description?: string;
  min_stock?: number;
  weight_grams?: number;
  image_path?: string;
  raw_material_type?: string;
}

export interface CreateCategoryDto {
  name?: string;
  description?: string;
  parent_id?: number;
}

export interface CreateWarehouseDto {
  name?: string;
  location?: string;
  is_active?: boolean;
}

export interface CreateStockMovementDto {
  product_id: number;
  warehouse_id: number;
  type: string;
  quantity: number;
  notes?: string;
  date?: string;
}

export interface TransferStockDto {
  product_id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  quantity: number;
  notes?: string;
}

export interface BulkUpdatePricesDto {
  productIds?: number[];
  categoryId?: number;
  type?: string;
  priceField: 'cost_price' | 'selling_price';
  updateType: 'percentage' | 'fixed';
  value: number;
}

// ==================== Accounting DTOs ====================

export interface JournalEntryLineDto {
  account_id: number;
  debit: number;
  credit: number;
}

export interface CreateJournalEntryDto {
  date: string;
  description: string;
  reference?: string;
  entries: JournalEntryLineDto[];
}

export interface CreateAccountDto {
  code: string;
  name: string;
  type: string;
  description?: string;
}

// ==================== Manufacturing DTOs ====================

export interface CreateMachineDto {
  name: string;
  serial_number?: string;
  purchase_date?: string;
  status?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  maintenance_interval_days?: number;
  total_hours?: number;
  power_consumption?: number;
  price?: number;
  useful_life_years?: number;
  notes?: string;
}

export interface CreateMoldDto {
  name: string;
  product_id?: number;
  product_weight: number;
  cavities: number;
  status?: string;
  current_shots?: number;
  price?: number;
  max_shots?: number;
  total_production_cycles?: number;
  life_cycle_status?: string;
  notes?: string;
}

export interface CreateMoldIssueDto {
  mold_id: number;
  date: string;
  description: string;
  status?: string;
  resolution?: string;
  image_path?: string;
}

export interface CreateMaintenanceDto {
  machine_id: number;
  type: string;
  date: string;
  description: string;
  cost?: number;
  status?: string;
  notes?: string;
}

export interface CreateRawMaterialDto {
  product_id: number;
  preferred_supplier_id?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  avg_consumption_rate?: number;
  last_purchase_price?: number;
  last_purchase_date?: string;
  notes?: string;
}

export interface CreateSupplierMaterialDto {
  supplier_id: number;
  price: number;
  lead_time_days?: number;
  min_order_quantity?: number;
  is_preferred?: boolean;
  notes?: string;
}

export interface RecordProductionDto {
  productId: number;
  quantity: number;
  date?: string;
  notes?: string;
}

export interface RecordConsumptionDto {
  product_id: number;
  quantity: number;
  production_id?: number;
  batch_number?: string;
  notes?: string;
}

export interface AddRawMaterialStockDto {
  quantity: number;
  price?: number;
  supplier_id?: number;
  date?: string;
  notes?: string;
}

export interface CreateManufacturingStockMovementDto {
  productId: number;
  type: 'IN' | 'OUT';
  quantity: number;
  price?: number;
  date: string;
  reference?: string;
  notes?: string;
}

export interface CreateDailyProductionDto {
  machine_id: number;
  mold_id?: number;
  product_id?: number;
  date: string;
  total_production_kg?: number;
  pieces_produced?: number;
  start_time?: string;
  end_time?: string;
  hours_worked?: number;
  overhead_cost?: number;
  status?: string;
  session_id?: number;
  machine_name?: string;
  shift?: string;
  operator_name?: string;
  notes?: string;
  allow_negative_stock?: boolean;
  substitute_material_id?: number;
}

export interface CreateRangeProductionDto {
  machine_id: number;
  mold_id: number;
  product_id: number;
  start_date: string;
  end_date: string;
  total_production_kg: number;
  mode: 'sum' | 'distribute';
  hours_worked?: number;
  notes?: string;
}

export interface CreateProductionScheduleDto {
  planned_date: string;
  shift: string;
  machine_id: number;
  mold_id: number;
  product_id: number;
  target_quantity: number;
  status?: string;
  notes?: string;
}

export interface CreateQCInspectionDto {
  production_id: number;
  product_id?: number;
  status?: string;
  defects_count?: number;
  notes?: string;
}

export interface CreateFixedCostDto {
  month: string;
  category?: string;
  amount: number;
  notes?: string;
}

export interface CreateBOMItemDto {
  id?: number;
  bom_id?: number;
  product_id: number;
  quantity: number;
}

export interface CreateBOMDto {
  name: string;
  product_id: number;
  pcs_per_carton?: number;
  pcs_per_box?: number;
  carton_product_id?: number | null;
  box_product_id?: number | null;
  description?: string;
  items?: CreateBOMItemDto[];
}

export interface CreateAttendanceDto {
  user_id: number;
  date: string;
  status?: string;
  check_in?: string | null;
  check_out?: string | null;
  notes?: string;
}

// ==================== Users DTOs ====================

export interface CreateUserDto {
  email: string;
  password?: string;
  provider?: string;
  socialId?: string | null;
  firstName: string;
  lastName: string;
  photo?: unknown;
  role?: unknown;
  status?: unknown;
}

export interface UpdateUserDto {
  email?: string | null;
  password?: string;
  provider?: string;
  socialId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  photo?: unknown;
  role?: unknown;
  status?: unknown;
}

// ==================== Notifications DTOs ====================

export interface CreateNotificationDto {
  title: string;
  message: string;
  userId?: number;
  actionType?: string;
  actionData?: unknown;
}

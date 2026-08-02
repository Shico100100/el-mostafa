export enum SyncEntity {
  CUSTOMERS = 'customers',
  SUPPLIERS = 'suppliers',
  PRODUCTS = 'products',
  SALES_INVOICES = 'sales_invoices',
  PURCHASE_INVOICES = 'purchase_invoices',
  INVOICE_LINE_ITEMS = 'invoice_line_items',
}

export enum SyncStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class SyncResultDto {
  entity: SyncEntity;
  status: SyncStatus;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
}

export class SyncStatusResponseDto {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: SyncStatus;
  triggeredBy: string;
  results: SyncResultDto[];
  records_synced?: number;
  duration_ms?: number;
  currentEntity?: string;
  percentComplete?: number;
}

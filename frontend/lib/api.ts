import type { ApiErrorPayload } from '@/types/api';
import type { AgingItem, CashFlowData } from '@/lib/dashboard/types';
import type {
  CreateUserDto,
  UpdateUserDto,
  CreateJournalEntryDto,
  CreateSalesOrderDto,
  CreatePurchaseOrderDto,
  CreateCustomerPaymentDto,
  CreateSupplierPaymentDto,
  CreateSalesReturnDto,
  CreatePurchaseReturnDto,
  CreateDailyProductionDto,
  AddRawMaterialStockDto,
  CreateManufacturingStockMovementDto,
  CreateRangeProductionDto,
  CreateBOMDto,
  UpdateLandedCostDto,
  CreatePackingListDto,
  CreateNotificationDto,
} from './dto';

function normalizeApiUrl(url: string): string {
  let normalized = url.replace(/\/+$/, '');
  if (!normalized.endsWith('/api')) {
    normalized += '/api';
  }
  return normalized;
}

export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('apiBaseUrl');
    if (stored) return normalizeApiUrl(stored);
  }
  return '/api';
}

let API_URL = getApiUrl();

export function setApiBaseUrl(url: string): void {
  const normalized = normalizeApiUrl(url);
  localStorage.setItem('apiBaseUrl', normalized);
  API_URL = normalized;
}

export const api = {
    async loginByEmail(email: string, password: string) {

        const response = await fetch(`${API_URL}/v1/auth/email/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        return response.json();
    },

    async loginById(userId: number, password: string) {
        const response = await fetch(`${API_URL}/v1/auth/id/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, password }),
        });
        return response.json();
    },

    async login(email: string, password: string) {
        // Fallback or legacy support
        return this.loginByEmail(email, password);
    },

    async getMe() {
        return this.fetchWithAuth('/v1/auth/me');
    },

    async changePassword(oldPassword: string, newPassword: string) {
        return this.fetchWithAuth('/v1/auth/me', {
            method: 'PATCH',
            body: JSON.stringify({ password: newPassword, oldPassword }),
        });
    },

    _refreshPromise: null as Promise<boolean> | null,

    async _refreshToken(): Promise<boolean> {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_URL}/v1/auth/refresh`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${refreshToken}` },
            });
            if (!response.ok) return false;
            const data = await response.json();
            localStorage.setItem('token', data.token);
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            return true;
        } catch {
            return false;
        }
    },

    async tryRefreshToken(): Promise<boolean> {
        if (this._refreshPromise) return this._refreshPromise;
        this._refreshPromise = this._refreshToken();
        const result = await this._refreshPromise;
        this._refreshPromise = null;
        return result;
    },

    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
        let normalizedEndpoint = endpoint.startsWith('/v1/') ? endpoint : `/v1${endpoint}`;
        const method = (options.method || 'GET').toUpperCase();
        if (method !== 'GET' && !normalizedEndpoint.endsWith('/')) {
            normalizedEndpoint += '/';
        }

        const makeRequest = async (): Promise<Response> => {
            const token = localStorage.getItem('token');
            const isFormData = options.body instanceof FormData;
            const headers: Record<string, string> = {
                ...(token && { Authorization: `Bearer ${token}` }),
            };
            const hasBody = !['GET', 'HEAD', 'DELETE'].includes(method);
            if (!isFormData && hasBody) {
                headers['Content-Type'] = 'application/json';
            }
            if (options.headers) {
                Object.assign(headers, options.headers);
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            try {
                return await fetch(`${API_URL}${normalizedEndpoint}`, { ...options, headers, signal: controller.signal, redirect: 'follow' });
            } finally {
                clearTimeout(timeoutId);
            }
        };

        let response = await makeRequest();

        if (response.status === 401) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
                response = await makeRequest();
            } else {
                this.clearAuth();
                window.location.href = '/login';
                throw new Error('Unauthorized');
            }
        }


        const text = await response.text();
        let data: unknown = {};
        try {
            data = text ? JSON.parse(text) : {};
            if (data === null) data = {};
        } catch {

            if (!response.ok) {
                const msg = `Server Error [${response.status}] ${API_URL}${normalizedEndpoint} - ${text.substring(0, 200)}`;
                console.error('API Error (Non-JSON):', {
                    url: `${API_URL}${normalizedEndpoint}`,
                    status: response.status,
                    body: text,
                });
                throw new Error(msg);
            }
            const msg = `Invalid JSON response from ${API_URL}${normalizedEndpoint}: ${text.substring(0, 200)}`;
            console.error('Error parsing JSON:', text);
            throw new Error(msg);
        }


        if (!response.ok) {
            const payload =
                data && typeof data === 'object'
                    ? (data as ApiErrorPayload)
                    : undefined;

            const message =
                payload?.message ??
                (typeof payload?.error === 'string' ? payload?.error : undefined) ??
                payload?.errors ??
                `HTTP ${response.status}`;

            console.error(`API Error [${response.status}] ${normalizedEndpoint}:`, data);

            const err = new Error(
                typeof message === 'string' ? message : JSON.stringify(message)
            ) as Error & { status?: number; data?: unknown };

            err.status = response.status;
            err.data = data as unknown;

            throw err;
        }

        return data as T;
    },
    async getDashboardStats() {
        return this.fetchWithAuth('/v1/dashboard/stats');
    },

    async getRecentSales() {
        return this.fetchWithAuth('/v1/sales/orders');
    },

    async getInventoryStatus() {
        return this.fetchWithAuth('/v1/inventory/stock');
    },

    async getProductionStats() {
        return this.fetchWithAuth('/v1/manufacturing/stats');
    },

    async getUsers() {
        return this.fetchWithAuth('/v1/users');
    },

    async createUser(userData: CreateUserDto) {
        return this.fetchWithAuth('/v1/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async updateUser(id: number, userData: UpdateUserDto) {
        return this.fetchWithAuth(`/v1/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(userData),
        });
    },

    async getProducts(type?: string) {
        const qs = type ? `?type=${type}` : '';
        return this.fetchWithAuth(`/v1/inventory/products${qs}`);
    },

    async getAccountingAccounts() {
        return this.fetchWithAuth('/v1/accounting/accounts');
    },

    async getAccountingJournals() {
        return this.fetchWithAuth('/v1/accounting/journal');
    },

    async createAccountingJournal(data: CreateJournalEntryDto) {
        return this.fetchWithAuth('/v1/accounting/journal', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getInventoryMovements() {
        return this.fetchWithAuth('/v1/inventory/stock/movements');
    },

    async getSuppliers() {
        return this.fetchWithAuth('/v1/purchases/suppliers');
    },

    async getSupplierAging(): Promise<AgingItem[]> {
        return this.fetchWithAuth('/v1/purchases/suppliers/aging');
    },

    async getLatestPurchasePrice(productId: number): Promise<{ price: number; date: string | null }> {
        return this.fetchWithAuth(`/v1/purchases/products/${productId}/latest-price`);
    },

    async getLatestPurchasePrices(productIds: number[]): Promise<Record<number, { price: number; date: string | null }>> {
        return this.fetchWithAuth(`/v1/purchases/products/latest-prices/batch?ids=${productIds.join(',')}`);
    },

    async getCustomers() {
        return this.fetchWithAuth('/v1/sales/customers');
    },

    async getCustomerAging(): Promise<AgingItem[]> {
        return this.fetchWithAuth('/v1/sales/customers/aging');
    },

    async getSalesOrders() {
        return this.fetchWithAuth('/v1/sales/orders');
    },

    async createSalesOrder(data: CreateSalesOrderDto) {
        return this.fetchWithAuth('/v1/sales/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getPurchaseOrders() {
        return this.fetchWithAuth('/v1/purchases/orders');
    },

    async createPurchaseOrder(data: CreatePurchaseOrderDto) {
        return this.fetchWithAuth('/v1/purchases/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getNotifications() {
        return this.fetchWithAuth('/v1/notifications');
    },

    async markNotificationRead(id: number) {
        return this.fetchWithAuth(`/v1/notifications/${id}/read`, {
            method: 'PATCH',
        });
    },

    async getCustomerStatement(customerId: number) {
        return this.fetchWithAuth(`/v1/sales/customers/${customerId}/statement`);
    },

    async getSupplierStatement(supplierId: number) {
        return this.fetchWithAuth(`/v1/purchases/suppliers/${supplierId}/statement`);
    },

    async addCustomerPayment(customerId: number, data: CreateCustomerPaymentDto) {
        return this.fetchWithAuth(`/v1/sales/customers/${customerId}/payments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async addSupplierPayment(supplierId: number, data: CreateSupplierPaymentDto) {
        return this.fetchWithAuth(`/v1/purchases/suppliers/${supplierId}/payments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getMoldStatus() {
        return this.fetchWithAuth('/v1/manufacturing/molds');
    },

    async getSalesReturns() {
        return this.fetchWithAuth('/v1/sales/returns');
    },

    async createSalesReturn(data: CreateSalesReturnDto) {
        return this.fetchWithAuth('/v1/sales/returns', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getPurchaseReturns() {
        return this.fetchWithAuth('/v1/purchases/returns');
    },

    async createPurchaseReturn(data: CreatePurchaseReturnDto) {
        return this.fetchWithAuth('/v1/purchases/returns', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getProductions() {
        return this.fetchWithAuth('/v1/manufacturing/production');
    },

    async createProduction(data: CreateDailyProductionDto) {
        return this.fetchWithAuth('/v1/manufacturing/production', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProduction(id: number, data: Partial<CreateDailyProductionDto>) {
        return this.fetchWithAuth(`/v1/manufacturing/production/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async getRawMaterials() {
        return this.fetchWithAuth('/v1/manufacturing/raw-materials');
    },

    async getRawMaterial(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/raw-materials/${id}`);
    },

    async getRawMaterialMovements(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/raw-materials/${id}/movements`);
    },

    async getRawMaterialConsumption() {
        return this.fetchWithAuth('/v1/manufacturing/raw-materials/consumption/history');
    },

    async getRawMaterialEntryLog() {
        return this.fetchWithAuth('/v1/manufacturing/raw-materials');
    },

    async addRawMaterialStock(rawMaterialId: number, data: AddRawMaterialStockDto) {
        return this.fetchWithAuth(`/v1/manufacturing/raw-materials/${rawMaterialId}/purchase`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getStockMovements() {
        return this.fetchWithAuth('/v1/manufacturing/stock-movements');
    },

    async updateStockMovement(id: number, data: Partial<CreateManufacturingStockMovementDto>) {
        return this.fetchWithAuth(`/v1/manufacturing/stock-movements/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async createStockMovement(data: CreateManufacturingStockMovementDto) {
        return this.fetchWithAuth('/v1/manufacturing/stock-movements', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async deleteStockMovement(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/stock-movements/${id}`, {
            method: 'DELETE',
        });
    },

    async getTrends() {
        return this.fetchWithAuth('/v1/reports/trends');
    },

    async getInventoryValueReport() {
        return this.fetchWithAuth('/v1/reports/inventory-value');
    },

    async getStockReport() {
        return this.fetchWithAuth('/v1/reports/stock');
    },

    async adjustStock(data: { product_id: number; warehouse_id: number; new_quantity: number; notes?: string }) {
        return this.fetchWithAuth('/v1/inventory/stock/adjust', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getManufacturingStats() {
        return this.fetchWithAuth('/v1/manufacturing/stats');
    },

    async getSalesReport(data: { startDate: string; endDate: string; page?: number; limit?: number }) {
        const qs = new URLSearchParams({
          startDate: data.startDate,
          endDate: data.endDate,
          ...(data.page && { page: String(data.page) }),
          ...(data.limit && { limit: String(data.limit) }),
        }).toString();
        return this.fetchWithAuth(`/v1/reports/sales?${qs}`);
    },

    async getPurchasesReport(data: { startDate: string; endDate: string; page?: number; limit?: number }) {
        const qs = new URLSearchParams({
          startDate: data.startDate,
          endDate: data.endDate,
          ...(data.page && { page: String(data.page) }),
          ...(data.limit && { limit: String(data.limit) }),
        }).toString();
        return this.fetchWithAuth(`/v1/reports/purchases?${qs}`);
    },

    async getProfitLossReport(data: { startDate: string; endDate: string }) {
        const qs = new URLSearchParams(data).toString();
        return this.fetchWithAuth(`/v1/reports/profit-loss?${qs}`);
    },

    async getSalesByCategoryReport(data: { startDate: string; endDate: string }) {
        const qs = new URLSearchParams(data).toString();
        return this.fetchWithAuth(`/v1/reports/sales-by-category?${qs}`);
    },

    async getCashFlowProjection(days?: number): Promise<CashFlowData> {
        const qs = days ? `?days=${days}` : '';
        return this.fetchWithAuth(`/v1/reports/cash-flow-projection${qs}`);
    },

    async createBackup() {
        return this.fetchWithAuth('/v1/system/backup', {
            method: 'POST',
        });
    },

    async restoreBackup(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.fetchWithAuth('/v1/system/restore', {
            method: 'POST',
            body: formData,
        });
    },

    async resetSystem() {
        return this.fetchWithAuth('/v1/system/reset', {
            method: 'POST',
        });
    },

    async syncMolds() {
        return this.fetchWithAuth('/v1/manufacturing/sync-molds', {
            method: 'POST',
        });
    },

    async deleteUser(id: number) {
        return this.fetchWithAuth(`/v1/users/${id}`, {
            method: 'DELETE',
        });
    },

    async getMachinesWithStatus() {
        return this.fetchWithAuth('/v1/manufacturing/machines/status');
    },

    async recalculateRawMaterialStock(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/raw-materials/${id}/recalculate`, {
            method: 'POST',
        });
    },

    async createRangeProduction(data: CreateRangeProductionDto) {
        return this.fetchWithAuth('/v1/manufacturing/production/range', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getRangeSessions(page = 1, limit = 20) {
        return this.fetchWithAuth(`/v1/manufacturing/production/sessions?page=${page}&limit=${limit}`);
    },

    async getRangeSession(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/production/sessions/${id}`);
    },

    async deleteRangeSession(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/production/sessions/${id}`, {
            method: 'DELETE',
        });
    },

    async getProductionRecordHistory(productionId: number) {
        return this.fetchWithAuth(`/v1/manufacturing/production/${productionId}/history`);
    },

    async exportProductionHistory() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/v1/manufacturing/export/production-history`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Export failed');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `production-history-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async importProductionHistory(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.fetchWithAuth('/v1/manufacturing/import/production-history', {
            method: 'POST',
            body: formData,
        });
    },

    async getDailyProduction(dateOrParams?: string | { date?: string; start_date?: string; end_date?: string }) {
        if (typeof dateOrParams === 'string') {
            return this.fetchWithAuth(`/v1/manufacturing/production?date=${dateOrParams}`);
        }
        const searchParams = new URLSearchParams();
        if (dateOrParams?.date) searchParams.set('date', dateOrParams.date);
        if (dateOrParams?.start_date) searchParams.set('start_date', dateOrParams.start_date);
        if (dateOrParams?.end_date) searchParams.set('end_date', dateOrParams.end_date);
        const qs = [...searchParams].length ? `?${searchParams.toString()}` : '';
        return this.fetchWithAuth(`/v1/manufacturing/production${qs}`);
    },

    async getMoldStats(moldId: number) {
        return this.fetchWithAuth(`/v1/manufacturing/molds/${moldId}/stats`);
    },

    async deleteProduction(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/production/${id}`, {
            method: 'DELETE',
        });
    },

    async getMolds() {
        return this.fetchWithAuth('/v1/manufacturing/molds');
    },

    // BOM APIs
    async getBOMs() {
        return this.fetchWithAuth('/v1/manufacturing/boms');
    },

    async getBOM(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/boms/${id}`);
    },

    async createBOM(data: CreateBOMDto) {
        return this.fetchWithAuth('/v1/manufacturing/boms', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateBOM(id: number, data: CreateBOMDto) {
        return this.fetchWithAuth(`/v1/manufacturing/boms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async explodeBOM(id: number, quantity: number) {
        return this.fetchWithAuth(`/v1/manufacturing/boms/${id}/explode?quantity=${quantity}`);
    },

    async deleteBOM(id: number) {
      return this.fetchWithAuth(`/v1/manufacturing/boms/${id}`, {
        method: 'DELETE',
      });
    },

    async getBOMCost(id: number, quantity?: number) {
        const q = quantity ? `?quantity=${quantity}` : '';
        return this.fetchWithAuth(`/v1/manufacturing/boms/${id}/cost${q}`);
    },

    // Landed Cost APIs
    async getLandedCost(orderId: number) {
        return this.fetchWithAuth(`/v1/purchases/orders/${orderId}/landed-cost`);
    },

    async updateLandedCost(orderId: number, data: UpdateLandedCostDto) {
        return this.fetchWithAuth(`/v1/purchases/orders/${orderId}/landed-cost`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Packing List APIs
    async getPackingList(orderId: number) {
        return this.fetchWithAuth(`/v1/purchases/orders/${orderId}/packing-list`);
    },

    async savePackingList(orderId: number, data: CreatePackingListDto) {
        return this.fetchWithAuth(`/v1/purchases/orders/${orderId}/packing-list`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async createNotification(data: CreateNotificationDto) {
        return this.fetchWithAuth('/v1/notifications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async exportSalesOrders() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/v1/sales/export/orders`, {
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        if (!response.ok) throw new Error('Export failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sales-orders.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    },

    async exportSalesCustomers() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/v1/sales/export/customers`, {
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        if (!response.ok) throw new Error('Export failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customers.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    },

    async markProductAsDormant(productId: number) {
        return this.fetchWithAuth(`/v1/inventory/products/${productId}/mark-dormant`, { method: 'POST' });
    },

    async restoreProduct(productId: number) {
        return this.fetchWithAuth(`/v1/inventory/products/${productId}/restore`, { method: 'POST' });
    },

    async getShipmentProfitability(startDate: string, endDate: string) {
        return this.fetchWithAuth(`/v1/reports/shipment-profitability?startDate=${startDate}&endDate=${endDate}`);
    },
};

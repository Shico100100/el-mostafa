import type { ApiErrorPayload } from '@/types/api';
import type { AgingItem, CashFlowData } from '@/lib/dashboard/types';
import type {
  CreateUserDto,
  UpdateUserDto,
  CreateJournalEntryDto,
  CreateSalesOrderDto,
  CreatePurchaseOrderDto,
  SaveSalaryPaymentDto,
  CreateCustomerPaymentDto,
  CreateSupplierPaymentDto,
  CreateProductionScheduleDto,
  CreateQCInspectionDto,
  CreateSalesReturnDto,
  CreatePurchaseReturnDto,
  CreateDailyProductionDto,
  AddRawMaterialStockDto,
  CreateManufacturingStockMovementDto,
  CreateAttendanceDto,
  CalculatePayrollDto,
  UpdateEmployeeProfileDto,
  CreateRangeProductionDto,
  CreateBOMDto,
  CreateCurrencyDto,
  AddFxRateDto,
  UpdateLandedCostDto,
  CreateContainerDto,
  CreatePackingListDto,
  CreateNotificationDto,
} from './dto';

function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('apiBaseUrl');
    if (stored) return stored.replace(/\/+$/, '');
  }
  return '/api';
}

let API_URL = getApiUrl();

export function setApiBaseUrl(url: string): void {
  localStorage.setItem('apiBaseUrl', url.replace(/\/+$/, ''));
  API_URL = url.replace(/\/+$/, '');
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
        const normalizedEndpoint = endpoint.startsWith('/v1/') ? endpoint : `/v1${endpoint}`;

        const makeRequest = async (): Promise<Response> => {
            const token = localStorage.getItem('token');
            const isFormData = options.body instanceof FormData;
            const headers: Record<string, string> = {
                ...(token && { Authorization: `Bearer ${token}` }),
            };
            const method = (options.method || 'GET').toUpperCase();
            const hasBody = !['GET', 'HEAD', 'DELETE'].includes(method);
            if (!isFormData && hasBody) {
                headers['Content-Type'] = 'application/json';
            }
            if (options.headers) {
                Object.assign(headers, options.headers);
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            try {
                return await fetch(`${API_URL}${normalizedEndpoint}`, { ...options, headers, signal: controller.signal });
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

    async getPayrollEmployees() {
        return this.fetchWithAuth('/v1/payroll/profiles');
    },

    async getPayrollPayments() {
        return this.fetchWithAuth('/v1/payroll/payments');
    },

    async savePayrollPayment(data: SaveSalaryPaymentDto) {
        return this.fetchWithAuth('/v1/payroll/payments', {
            method: 'POST',
            body: JSON.stringify(data),
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

    async getProductionSchedules() {
        return this.fetchWithAuth('/v1/manufacturing/planning');
    },

    async createProductionSchedule(data: CreateProductionScheduleDto) {
        return this.fetchWithAuth('/v1/manufacturing/planning', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProductionSchedule(id: number, data: CreateProductionScheduleDto) {
        return this.fetchWithAuth(`/v1/manufacturing/planning/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async getMoldStatus() {
        return this.fetchWithAuth('/v1/manufacturing/molds');
    },

    async getMold(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/molds/${id}`);
    },

    async getProductionPlanning() {
        return this.fetchWithAuth('/v1/manufacturing/planning');
    },

    async getQCInspections() {
        return this.fetchWithAuth('/v1/manufacturing/qc/recent');
    },

    async createQCInspection(data: CreateQCInspectionDto) {
        return this.fetchWithAuth('/v1/manufacturing/qc', {
            method: 'POST',
            body: JSON.stringify(data),
        });
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

    async getAccessories() {
        return this.fetchWithAuth('/v1/manufacturing/accessories');
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

    async getAttendance() {
        return this.fetchWithAuth('/v1/manufacturing/attendance');
    },

    async getWorkers() {
        return this.fetchWithAuth('/v1/manufacturing/attendance/workers');
    },

    async saveAttendance(data: CreateAttendanceDto) {
        return this.fetchWithAuth('/v1/manufacturing/attendance', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async deleteAttendance(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/attendance/${id}`, {
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

    async getPayrollProfiles() {
        return this.fetchWithAuth('/v1/payroll/profiles');
    },

    async calculatePayroll(data: CalculatePayrollDto) {
        const qs = data.month ? `?month=${data.month}` : '';
        return this.fetchWithAuth(`/v1/payroll/calculate${qs}`);
    },

    async updatePayrollProfile(id: number, data: UpdateEmployeeProfileDto) {
        return this.fetchWithAuth(`/v1/payroll/profiles/${id}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getManufacturingStats() {
        return this.fetchWithAuth('/v1/manufacturing/stats');
    },

    async getQCStats() {
        return this.fetchWithAuth('/v1/manufacturing/qc/stats');
    },

    async getQCPending() {
        return this.fetchWithAuth('/v1/manufacturing/qc/pending');
    },

    async getQCRecent(limit?: number) {
        const qs = limit ? `?limit=${limit}` : '';
        return this.fetchWithAuth(`/v1/manufacturing/qc/recent${qs}`);
    },

    async getSalesReport(data: { startDate: string; endDate: string }) {
        const qs = new URLSearchParams(data).toString();
        return this.fetchWithAuth(`/v1/reports/sales?${qs}`);
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

    async deleteProductionSchedule(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/planning/${id}`, {
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

    // Currency APIs
    async getCurrencies() {
        return this.fetchWithAuth('/v1/purchases/currencies');
    },

    async getAllCurrencies() {
        return this.fetchWithAuth('/v1/purchases/currencies/all');
    },

    async createCurrency(data: CreateCurrencyDto) {
        return this.fetchWithAuth('/v1/purchases/currencies', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateCurrency(id: number, data: CreateCurrencyDto) {
        return this.fetchWithAuth(`/v1/purchases/currencies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteCurrency(id: number) {
        return this.fetchWithAuth(`/v1/purchases/currencies/${id}`, {
            method: 'DELETE',
        });
    },

    // FX Rate APIs
    async getFxRates(currencyId?: number) {
        const q = currencyId ? `?currency_id=${currencyId}` : '';
        return this.fetchWithAuth(`/v1/purchases/fx-rates${q}`);
    },

    async addFxRate(data: AddFxRateDto) {
        return this.fetchWithAuth('/v1/purchases/fx-rates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getWeightedAverageFx(currencyId: number) {
        return this.fetchWithAuth(`/v1/purchases/fx-rates/weighted-average/${currencyId}`);
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

    // Container APIs
    async getContainers() {
        return this.fetchWithAuth('/v1/purchases/containers');
    },

    async createContainer(data: CreateContainerDto) {
        return this.fetchWithAuth('/v1/purchases/containers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateContainer(id: number, data: CreateContainerDto) {
        return this.fetchWithAuth(`/v1/purchases/containers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deleteContainer(id: number) {
        return this.fetchWithAuth(`/v1/purchases/containers/${id}`, {
            method: 'DELETE',
        });
    },

    async calculateCBM(length: number, width: number, height: number, cartons: number) {
        return this.fetchWithAuth(`/v1/purchases/cbm?length=${length}&width=${width}&height=${height}&cartons=${cartons}`);
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

    async markNotificationAsRead(id: number) {
        return this.markNotificationRead(id);
    },

    // Smart Reorder Alerts
    async getReorderSuggestions(containerId: number) {
        return this.fetchWithAuth(`/v1/purchases/reorder-suggestions/${containerId}`);
    },

    // Shipment Profitability
    async getShipmentProfitability(startDate?: string, endDate?: string) {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        const qs = params.toString();
        return this.fetchWithAuth(`/v1/reports/shipment-profitability${qs ? '?' + qs : ''}`);
    },

    // MRP
    async getMRPPlanning() {
        return this.fetchWithAuth('/v1/manufacturing/mrp/planning');
    },

    async getQCDashboard() {
        const [stats, recent] = await Promise.all([
            this.getQCStats(),
            this.getQCRecent(50),
        ]);
        return { stats, recent };
    },

    // Sales Excel exports
    async exportSalesOrders() {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/v1/sales/export/orders', {
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

    // Manufacturing Orders
    async getManufacturingOrders(params?: { status?: string; sales_order_id?: number }) {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.set('status', params.status);
        if (params?.sales_order_id) searchParams.set('sales_order_id', String(params.sales_order_id));
        const qs = [...searchParams].length ? '?' + searchParams.toString() : '';
        return this.fetchWithAuth(`/v1/manufacturing/manufacturing-orders${qs}`);
    },

    async createManufacturingOrdersFromSalesOrder(salesOrderId: number): Promise<unknown> {
        return this.fetchWithAuth(`/v1/manufacturing/manufacturing-orders/from-sales-order/${salesOrderId}`, {
            method: 'POST',
        });
    },

    async getManufacturingOrdersBySalesOrder(salesOrderId: number): Promise<unknown> {
        return this.fetchWithAuth(`/v1/manufacturing/manufacturing-orders/by-sales-order/${salesOrderId}`);
    },

    async updateManufacturingOrderStatus(id: number, status: string): Promise<unknown> {
        return this.fetchWithAuth(`/v1/manufacturing/manufacturing-orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    async updateManufacturingOrderProduced(id: number, quantity: number): Promise<unknown> {
        return this.fetchWithAuth(`/v1/manufacturing/manufacturing-orders/${id}/produced`, {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
        });
    },

    async exportSalesCustomers() {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/v1/sales/export/customers', {
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

    // Traceability / Batch Tracking
    async getBatches(status?: string) {
        const qs = status ? `?status=${status}` : '';
        return this.fetchWithAuth(`/v1/manufacturing/traceability${qs}`);
    },

    async getBatch(id: number) {
        return this.fetchWithAuth(`/v1/manufacturing/traceability/${id}`);
    },

    async createBatch(dto: {
        product_id: number;
        production_date: string;
        expiry_date?: string;
        quantity: number;
        unit?: string;
        notes?: string;
        production_id?: number;
        components?: {
            product_id?: number;
            accessory_id?: number;
            supplier_batch_number?: string;
            quantity_used: number;
            unit?: string;
            cost_per_unit?: number;
        }[];
    }) {
        return this.fetchWithAuth('/v1/manufacturing/traceability', {
            method: 'POST',
            body: JSON.stringify(dto),
        });
    },

    async updateBatchStatus(id: number, status: string) {
        return this.fetchWithAuth(`/v1/manufacturing/traceability/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    async recallBatch(id: number, reason?: string) {
        return this.fetchWithAuth(`/v1/manufacturing/traceability/${id}/recall`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },

    async getExpiringBatches(days: number) {
        return this.fetchWithAuth(`/v1/manufacturing/traceability/expiring?days=${days}`);
    },

    // Production Feasibility
    async analyzeProductionFeasibility(items: { productId: number; quantity: number }[]) {
        return this.fetchWithAuth('/v1/manufacturing/feasibility/analyze', {
            method: 'POST',
            body: JSON.stringify({ items }),
        });
    },

    async saveFeasibilityReport(data: { items: { productId: number; quantity: number }[]; report: unknown }) {
        return this.fetchWithAuth('/v1/manufacturing/feasibility/save', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getProductionHistory(productId: number) {
        return this.fetchWithAuth(`/v1/manufacturing/feasibility/production-history/${productId}`);
    },

    async getAssemblyOrders() {
        return this.fetchWithAuth('/v1/manufacturing/assembly');
    },

    async forwardTrace(supplierBatch: string) {
        return this.fetchWithAuth(`/v1/manufacturing/traceability/trace/forward?supplierBatch=${encodeURIComponent(supplierBatch)}`);
    },

    async backwardTrace(batchId: number) {
        return this.fetchWithAuth(`/v1/manufacturing/traceability/trace/backward/${batchId}`);
    },
};

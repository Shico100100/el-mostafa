import type { ApiErrorPayload } from '@/types/api';

const API_URL = '/api';

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const normalizedEndpoint = endpoint.startsWith('/v1/') ? endpoint : `/v1${endpoint}`;
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

        const response = await fetch(`${API_URL}${normalizedEndpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }


        const text = await response.text();
        let data: unknown = {};
        try {
            data = text ? JSON.parse(text) : {};
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
        return this.fetchWithAuth('/v1/sales/recent');
    },

    async getInventoryStatus() {
        return this.fetchWithAuth('/v1/inventory/status');
    },

    async getProductionStats() {
        return this.fetchWithAuth('/v1/production/stats');
    },

    async getUsers() {
        return this.fetchWithAuth('/v1/users');
    },

    async createUser(userData: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    async updateUser(id: number, userData: Record<string, unknown>) {
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
        return this.fetchWithAuth('/v1/accounting/journals');
    },

    async createAccountingJournal(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/accounting/journals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getInventoryMovements() {
        return this.fetchWithAuth('/v1/inventory/movements');
    },

    async getSuppliers() {
        return this.fetchWithAuth('/v1/purchases/suppliers');
    },

    async getCustomers() {
        return this.fetchWithAuth('/v1/sales/customers');
    },

    async getSalesOrders() {
        return this.fetchWithAuth('/v1/sales/orders');
    },

    async createSalesOrder(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/sales/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getPurchaseOrders() {
        return this.fetchWithAuth('/v1/purchases/orders');
    },

    async createPurchaseOrder(data: Record<string, unknown>) {
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
        return this.fetchWithAuth('/v1/payroll/employees');
    },

    async getPayrollPayments() {
        return this.fetchWithAuth('/v1/payroll/payments');
    },

    async savePayrollPayment(data: Record<string, unknown>) {
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

    async addCustomerPayment(customerId: number, data: Record<string, unknown>) {
        return this.fetchWithAuth(`/v1/sales/customers/${customerId}/payments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async addSupplierPayment(supplierId: number, data: Record<string, unknown>) {
        return this.fetchWithAuth(`/v1/purchases/suppliers/${supplierId}/payments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getProductionSchedules() {
        return this.fetchWithAuth('/v1/manufacturing/production-schedules');
    },

    async createProductionSchedule(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/manufacturing/production-schedules', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProductionSchedule(id: number, data: Record<string, unknown>) {
        return this.fetchWithAuth(`/v1/manufacturing/production-schedules/${id}`, {
            method: 'PATCH',
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
        return this.fetchWithAuth('/v1/manufacturing/production-plans');
    },

    async getQCInspections() {
        return this.fetchWithAuth('/v1/manufacturing/qc/recent');
    },

    async createQCInspection(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/manufacturing/qc', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getSalesReturns() {
        return this.fetchWithAuth('/v1/sales/returns');
    },

    async createSalesReturn(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/sales/returns', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getPurchaseReturns() {
        return this.fetchWithAuth('/v1/purchases/returns');
    },

    async createPurchaseReturn(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/purchases/returns', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getProductions() {
        return this.fetchWithAuth('/v1/manufacturing/production');
    },

    async createProduction(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/manufacturing/production', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateProduction(id: number, data: Record<string, unknown>) {
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
        return this.fetchWithAuth('/v1/manufacturing/raw-materials/consumption');
    },

    async getRawMaterialEntryLog() {
        return this.fetchWithAuth('/v1/manufacturing/raw-materials/entry-log');
    },

    async addRawMaterialStock(rawMaterialId: number, data: Record<string, unknown>) {
        return this.fetchWithAuth(`/v1/manufacturing/raw-materials/${rawMaterialId}/purchase`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getStockMovements() {
        return this.fetchWithAuth('/v1/manufacturing/stock-movements');
    },

    async updateStockMovement(id: number, data: Record<string, unknown>) {
        return this.fetchWithAuth(`/v1/manufacturing/stock-movements/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async createStockMovement(data: Record<string, unknown>) {
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

    async saveAttendance(data: Record<string, unknown>) {
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

    async getPayrollProfiles() {
        return this.fetchWithAuth('/v1/payroll/profiles');
    },

    async calculatePayroll(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/payroll/calculate', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updatePayrollProfile(id: number, data: Record<string, unknown>) {
        return this.fetchWithAuth(`/v1/payroll/profiles/${id}`, {
            method: 'PATCH',
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

    async getQCRecent() {
        return this.fetchWithAuth('/v1/manufacturing/qc/recent');
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

    async createBackup() {
        return this.fetchWithAuth('/v1/backup', {
            method: 'POST',
        });
    },

    async restoreBackup(file: File) {
        const formData = new FormData();
        formData.append('backup', file);
        return this.fetchWithAuth('/v1/backup/restore', {
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
        return this.fetchWithAuth('/v1/manufacturing/molds/sync', {
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
        return this.fetchWithAuth(`/v1/manufacturing/production-schedules/${id}`, {
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

    async createBOM(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/manufacturing/boms', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateBOM(id: number, data: Record<string, unknown>) {
        return this.fetchWithAuth(`/v1/manufacturing/boms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async explodeBOM(id: number, quantity: number) {
        return this.fetchWithAuth(`/v1/manufacturing/boms/${id}/explode?quantity=${quantity}`);
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

    async createCurrency(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/purchases/currencies', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateCurrency(id: number, data: Record<string, unknown>) {
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

    async addFxRate(data: Record<string, unknown>) {
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

    async updateLandedCost(orderId: number, data: Record<string, unknown>) {
        return this.fetchWithAuth(`/v1/purchases/orders/${orderId}/landed-cost`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Container APIs
    async getContainers() {
        return this.fetchWithAuth('/v1/purchases/containers');
    },

    async createContainer(data: Record<string, unknown>) {
        return this.fetchWithAuth('/v1/purchases/containers', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateContainer(id: number, data: Record<string, unknown>) {
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

    async savePackingList(orderId: number, data: Record<string, unknown>) {
        return this.fetchWithAuth(`/v1/purchases/orders/${orderId}/packing-list`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async createNotification(data: Record<string, unknown>) {
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
            raw_material_id?: number;
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

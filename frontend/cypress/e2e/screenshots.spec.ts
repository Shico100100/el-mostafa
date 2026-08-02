describe('📸 Auto Screenshot Capture for Documentation', () => {
  beforeEach(() => {
    cy.login();
  });

  const snap = (name: string) => {
    cy.screenshot(name, { capture: 'viewport' });
  };

  // ============= DASHBOARD =============
  it('Dashboard', () => {
    cy.visit('/dashboard');
    cy.contains('لوحة التحكم', { timeout: 15000 }).should('be.visible');
    snap('01-dashboard');
  });

  // ============= INVENTORY =============
  it('Inventory - Products', () => {
    cy.visit('/inventory/products');
    cy.contains('المنتجات', { timeout: 15000 }).should('be.visible');
    snap('02-inventory-products');
  });

  // ============= SALES =============
  it('Sales - Orders', () => {
    cy.visit('/sales/orders');
    cy.contains('أوامر البيع', { timeout: 15000 }).should('be.visible');
    snap('03-sales-orders');
  });

  it('Sales - Customers', () => {
    cy.visit('/sales/customers');
    cy.contains('العملاء', { timeout: 15000 }).should('be.visible');
    snap('04-sales-customers');
  });

  // ============= PURCHASES =============
  it('Purchases - Orders', () => {
    cy.visit('/purchases/orders');
    cy.contains('أوامر الشراء', { timeout: 15000 }).should('be.visible');
    snap('05-purchases-orders');
  });

  it('Purchases - Suppliers', () => {
    cy.visit('/purchases/suppliers');
    cy.contains('الموردين', { timeout: 15000 }).should('be.visible');
    snap('06-purchases-suppliers');
  });

  // ============= MANUFACTURING =============
  it('Manufacturing - Dashboard', () => {
    cy.visit('/manufacturing');
    cy.contains('التصنيع', { timeout: 15000 }).should('be.visible');
    snap('09-manufacturing-dashboard');
  });

  it('Manufacturing - Machines', () => {
    cy.visit('/manufacturing/machines');
    cy.contains('الماكينات', { timeout: 15000 }).should('be.visible');
    snap('10-manufacturing-machines');
  });

  it('Manufacturing - BOM', () => {
    cy.visit('/bom');
    cy.contains('قائمة', { timeout: 15000 }).should('be.visible');
    snap('11-manufacturing-bom');
  });

  it('Manufacturing - Raw Materials', () => {
    cy.visit('/manufacturing/raw-materials');
    cy.contains('خامات', { timeout: 15000 }).should('be.visible');
    snap('16-manufacturing-raw-materials');
  });

  it('Manufacturing - Daily Production', () => {
    cy.visit('/manufacturing/daily-production');
    cy.contains('إنتاج', { timeout: 15000 }).should('be.visible');
    snap('17-manufacturing-daily-production');
  });

  it('Manufacturing - Molds', () => {
    cy.visit('/manufacturing/molds');
    cy.contains('قوالب', { timeout: 15000 }).should('be.visible');
    snap('18-manufacturing-molds');
  });

  it('Manufacturing - Maintenance', () => {
    cy.visit('/manufacturing/maintenance');
    cy.contains('صيانة', { timeout: 15000 }).should('be.visible');
    snap('19-manufacturing-maintenance');
  });

  it('Manufacturing - Fixed Costs', () => {
    cy.visit('/manufacturing/fixed-costs');
    cy.contains('تكاليف', { timeout: 15000 }).should('be.visible');
    snap('20-manufacturing-fixed-costs');
  });

  it('Manufacturing - Kiosk', () => {
    cy.visit('/manufacturing/kiosk');
    cy.contains('كشك', { timeout: 15000 }).should('be.visible');
    snap('21-manufacturing-kiosk');
  });

  // ============= ACCOUNTING =============
  it('Accounting - Dashboard', () => {
    cy.visit('/accounting');
    cy.contains('محاسبة', { timeout: 15000 }).should('be.visible');
    snap('28-accounting-dashboard');
  });

  it('Accounting - Journal', () => {
    cy.visit('/accounting/journal');
    cy.contains('قيد', { timeout: 15000 }).should('be.visible');
    snap('29-accounting-journal');
  });

  // ============= REPORTS =============
  it('Reports', () => {
    cy.visit('/reports');
    cy.contains('تقارير', { timeout: 15000 }).should('be.visible');
    snap('31-reports');
  });

  it('Reports - Production', () => {
    cy.visit('/reports/production');
    cy.contains('إنتاج', { timeout: 15000 }).should('be.visible');
    snap('32-reports-production');
  });

  // ============= USERS & SETTINGS =============
  it('Users', () => {
    cy.visit('/users');
    cy.contains('مستخدمين', { timeout: 15000 }).should('be.visible');
    snap('33-users');
  });

  it('Settings', () => {
    cy.visit('/settings');
    cy.contains('إعدادات', { timeout: 15000 }).should('be.visible');
    snap('34-settings');
  });

  it('Notifications', () => {
    cy.visit('/notifications');
    cy.contains('إشعارات', { timeout: 15000 }).should('be.visible');
    snap('35-notifications');
  });
});

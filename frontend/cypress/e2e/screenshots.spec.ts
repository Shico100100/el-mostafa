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

  it('Purchases - Containers', () => {
    cy.visit('/purchases/containers');
    cy.contains('حاويات', { timeout: 15000 }).should('be.visible');
    snap('07-purchases-containers');
  });

  it('Purchases - Currencies', () => {
    cy.visit('/purchases/currencies');
    cy.contains('عملات', { timeout: 15000 }).should('be.visible');
    snap('08-purchases-currencies');
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
    cy.visit('/manufacturing/bom');
    cy.contains('قائمة', { timeout: 15000 }).should('be.visible');
    snap('11-manufacturing-bom');
  });

  it('Manufacturing - MRP', () => {
    cy.visit('/manufacturing/mrp');
    cy.contains('MRP', { timeout: 15000 }).should('be.visible');
    snap('12-manufacturing-mrp');
  });

  it('Manufacturing - Planning', () => {
    cy.visit('/manufacturing/planning');
    cy.contains('تخطيط', { timeout: 15000 }).should('be.visible');
    snap('13-manufacturing-planning');
  });

  it('Manufacturing - Schedule', () => {
    cy.visit('/manufacturing/schedule');
    cy.contains('جدولة', { timeout: 15000 }).should('be.visible');
    snap('14-manufacturing-schedule');
  });

  it('Manufacturing - QC', () => {
    cy.visit('/manufacturing/qc');
    cy.contains('جودة', { timeout: 15000 }).should('be.visible');
    snap('15-manufacturing-qc');
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

  it('Manufacturing - Traceability', () => {
    cy.visit('/manufacturing/traceability');
    cy.contains('تتبع', { timeout: 15000 }).should('be.visible');
    snap('22-manufacturing-traceability');
  });

  // ============= ASSEMBLY =============
  it('Assembly - Dashboard', () => {
    cy.visit('/assembly');
    cy.contains('تجميع', { timeout: 15000 }).should('be.visible');
    snap('23-assembly-dashboard');
  });

  it('Assembly - Accessories', () => {
    cy.visit('/assembly/accessories');
    cy.contains('أكسسوارات', { timeout: 15000 }).should('be.visible');
    snap('24-assembly-accessories');
  });

  it('Assembly - Plastic', () => {
    cy.visit('/assembly/plastic');
    cy.contains('بلاستيك', { timeout: 15000 }).should('be.visible');
    snap('25-assembly-plastic');
  });

  it('Assembly - Packaging', () => {
    cy.visit('/assembly/packaging');
    cy.contains('تغليف', { timeout: 15000 }).should('be.visible');
    snap('26-assembly-packaging');
  });

  it('Assembly - BOM', () => {
    cy.visit('/assembly/bom');
    cy.contains('قائمة', { timeout: 15000 }).should('be.visible');
    snap('27-assembly-bom');
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

  // ============= HR =============
  it('HR - Payroll', () => {
    cy.visit('/hr/payroll');
    cy.contains('مرتبات', { timeout: 15000 }).should('be.visible');
    snap('30-hr-payroll');
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

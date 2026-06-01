describe('Sales Orders (إدارة أوامر البيع)', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/sales/orders');
    cy.contains('إدارة أوامر البيع', { timeout: 10000 }).should('be.visible');
  });

  it('loads the page with filters and table', () => {
    cy.get('input[placeholder*="بحث"]').should('be.visible');
    cy.get('input[type="date"]').should('have.length.at.least', 2);
    cy.contains('إعادة ضبط').should('be.visible');
    cy.contains('أمر بيع جديد').should('be.visible');
    cy.contains('تصدير Excel').should('be.visible');
  });

  it('filters orders by search text', () => {
    cy.get('input[placeholder*="بحث"]').type('test');
    cy.get('table').should('be.visible');
  });

  it('filters orders by date range', () => {
    cy.get('input[type="date"]').first().type('2026-01-01');
    cy.get('input[type="date"]').eq(1).type('2026-12-31');
  });

  it('resets filters', () => {
    cy.get('input[placeholder*="بحث"]').type('something');
    cy.contains('إعادة ضبط').click();
    cy.get('input[placeholder*="بحث"]').should('have.value', '');
  });

  it('creates a new sales order', () => {
    cy.intercept('POST', '/api/v1/sales/orders').as('createOrder');

    cy.contains('أمر بيع جديد').click();
    cy.contains('إنشاء أمر بيع جديد').should('be.visible');

    // Open customer dropdown and select first option
    cy.contains('اختر العميل...').click();
    cy.get('[placeholder="بحث..."]').should('be.visible').type('Test');
    cy.get('[class*="rounded-lg"][class*="cursor-pointer"]').first().click({ force: true });

    // Add item
    cy.contains('إضافة صنف').click();

    // Open product dropdown
    cy.contains('اختر المنتج...').click();
    cy.get('[placeholder="بحث..."]').should('be.visible').type('Test');
    cy.get('[class*="rounded-lg"][class*="cursor-pointer"]').first().click({ force: true });

    // Set quantity and price
    cy.get('input[type="number"]').first().type('10');
    cy.get('input[type="number"]').eq(1).type('50');

    // Submit the order
    cy.contains('button', 'إنشاء').click();
    cy.wait('@createOrder');
  });

  it('duplicates an existing order', () => {
    cy.intercept('POST', '/api/v1/sales/orders').as('createOrder');

    cy.get('table tbody tr').should('have.length.at.least', 1);
    cy.get('[title="نسخ الطلب"]').first().click();
    cy.contains('إنشاء أمر بيع جديد').should('be.visible');
    cy.contains('button', 'إنشاء').click();
    cy.wait('@createOrder');
  });

  it('views order details', () => {
    cy.get('table tbody tr').should('have.length.at.least', 1);
    cy.get('[title="عرض التفاصيل"]').first().click();
    cy.contains('تفاصيل الأمر').should('be.visible');
    cy.contains('العميل').should('be.visible');
    cy.contains('المرفقات').should('be.visible');
  });

  it('records a payment', () => {
    cy.intercept('POST', '/api/v1/sales/customers/*/payments').as('addPayment');

    cy.get('table tbody tr').should('have.length.at.least', 1);
    cy.get('[title="تسجيل دفعة"]').first().click();
    cy.contains('تسجيل دفعة').should('be.visible');
    cy.get('input[type="number"]').first().type('100');
    cy.contains('button', 'تسجيل').click();
    cy.wait('@addPayment');
  });

  it('exports to Excel', () => {
    cy.intercept('GET', '/api/v1/sales/export/orders').as('exportExcel');

    cy.contains('تصدير Excel').click();
    cy.wait('@exportExcel');
  });

  it('prints an invoice', () => {
    cy.get('table tbody tr').should('have.length.at.least', 1);
    cy.get('[title="طباعة"]').first().click();
  });

  it('navigates through pagination', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.get('body').then(($body: any) => {
      if ($body.find('button:contains("التالي")').length > 0) {
        cy.intercept('GET', '/api/v1/sales/orders*').as('pageOrders');
        cy.contains('التالي').click();
        cy.wait('@pageOrders');
        cy.contains('السابق').click();
        cy.wait('@pageOrders');
      }
    });
  });
});

describe('Accessories (إدارة الأكسسوارات)', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/assembly/accessories');
    cy.contains('إدارة الأكسسوارات', { timeout: 10000 }).should('be.visible');
  });

  it('loads with stats cards', () => {
    cy.contains('إجمالي قيمة المخزون').should('be.visible');
    cy.contains('إجمالي عدد الأصناف').should('be.visible');
  });

  it('adds a new accessory', () => {
    cy.intercept('POST', '/api/v1/manufacturing/accessories').as('createAccessory');

    cy.contains('إضافة أكسسوار').click();
    cy.get('[placeholder="اسم الأكسسوار"]').type('Cypress Test Accessory');
    cy.get('[placeholder="الوحدة (قطعة، متر...)"]').type('piece');
    cy.get('[placeholder="حد الطلب"]').type('10');
    cy.get('[placeholder="وزن القطعة (جرام) - اختياري"]').type('0.5');
    cy.get('[placeholder="ملاحظات"]').type('Created by Cypress');
    cy.contains('button', 'حفظ').click();

    cy.wait('@createAccessory');
    cy.contains('Cypress Test Accessory').should('be.visible');
  });

  it('edits an existing accessory', () => {
    cy.intercept('PUT', '/api/v1/manufacturing/accessories/*').as('updateAccessory');

    cy.contains('Cypress Test Accessory').should('be.visible');
    cy.contains('Cypress Test Accessory')
      .parent('tr').within(() => {
        cy.get('[title="تعديل"]').click();
      });

    cy.get('[placeholder="اسم الأكسسوار"]').clear().type('Cypress Accessory Edited');
    cy.contains('button', 'حفظ').click();

    cy.wait('@updateAccessory');
    cy.contains('Cypress Accessory Edited').should('be.visible');
  });

  it('adds stock (purchase) to an accessory', () => {
    cy.intercept('POST', '/api/v1/manufacturing/accessories/*/stock/add').as('addStock');

    cy.contains('Cypress Accessory Edited').should('be.visible');
    cy.contains('Cypress Accessory Edited')
      .parent('tr').within(() => {
        cy.get('[title="إضافة رصيد"]').click();
      });

    cy.get('h2').contains('إضافة رصيد').should('be.visible');
    cy.get('input[type="number"]').first().type('50');
    cy.get('input[type="number"]').last().type('25');
    cy.contains('button', 'تأكيد').click();

    cy.wait('@addStock');
  });

  it('consumes stock from an accessory', () => {
    cy.intercept('POST', '/api/v1/manufacturing/accessories/*/stock/consume').as('consumeStock');

    cy.contains('Cypress Accessory Edited').should('be.visible');
    cy.contains('Cypress Accessory Edited')
      .parent('tr').within(() => {
        cy.get('[title="صرف"]').click();
      });

    cy.get('h2').contains('صرف').should('be.visible');
    cy.get('input[type="number"]').first().type('10');
    cy.contains('button', 'تأكيد').click();

    cy.wait('@consumeStock');
  });

  it('views history for an accessory', () => {
    cy.intercept('GET', '/api/v1/manufacturing/accessories/*/history').as('getHistory');

    cy.contains('Cypress Accessory Edited')
      .parent('tr').within(() => {
        cy.get('[title="سجل الحركات"]').click();
      });

    cy.wait('@getHistory');
    cy.contains('سجل الحركات').should('be.visible');
  });

  it('generates Top Consumed report', () => {
    cy.intercept('GET', '/api/v1/manufacturing/accessories/reports/top-consumed').as('getTopReport');

    cy.contains('التقارير').click();
    cy.contains('TOP').click();

    cy.wait('@getTopReport');
    cy.contains('أكثر الأكسسوارات استهلاكاً').should('be.visible');
  });

  it('generates Slow Moving report', () => {
    cy.intercept('GET', '/api/v1/manufacturing/accessories/reports/slow-moving').as('getSlowReport');

    cy.contains('التقارير').click();
    cy.contains('SLOW').click();

    cy.wait('@getSlowReport');
    cy.contains('الأكسسوارات بطيئة الحركة').should('be.visible');
  });

  it('generates Draft Purchase Order', () => {
    cy.intercept('GET', '/api/v1/manufacturing/accessories/po/draft').as('getDraftPO');

    cy.contains('مسودة طلبية').click();

    cy.wait('@getDraftPO');
    cy.contains('مسودة أمر الشراء').should('be.visible');
  });

  it('performs Bulk Stock receipt', () => {
    cy.contains('استلام مجمع').click();
    cy.contains('استلام مخزون مجمع').should('be.visible');
    cy.get('[placeholder*="بحث"]').should('be.visible');
    cy.contains('تأكيد').click();
  });

  it('exports via Excel', () => {
    cy.intercept('GET', '/api/v1/manufacturing/accessories/export/excel').as('exportExcel');

    cy.contains('Excel').should('be.visible');
    cy.contains('تصدير').click();

    cy.wait('@exportExcel');
  });

  it('deletes the test accessory', () => {
    cy.intercept('DELETE', '/api/v1/manufacturing/accessories/*').as('deleteAccessory');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cy as any).on('window:confirm', () => true);

    cy.contains('Cypress Accessory Edited')
      .parent('tr').within(() => {
        cy.get('[title="حذف"]').click();
      });

    cy.wait('@deleteAccessory');
  });
});

describe('Manufacturing Orders (أوامر التصنيع)', () => {
  beforeEach(() => {
    cy.login();
  });

  it('sends a sales order to manufacturing', () => {
    cy.intercept('POST', '/api/v1/manufacturing/manufacturing-orders/from-sales-order/*').as('createMO');
    cy.intercept('GET', '/api/v1/manufacturing/manufacturing-orders*').as('getMOs');

    cy.visit('/sales/orders');
    cy.contains('إدارة أوامر البيع', { timeout: 10000 }).should('be.visible');

    cy.get('table tbody tr').should('have.length.at.least', 1);

    cy.contains('إرسال للتصنيع').first().click();
    cy.wait('@createMO');
    cy.wait('@getMOs');
  });

  it('shows manufacturing status after sending', () => {
    cy.visit('/sales/orders');
    cy.contains('إدارة أوامر البيع', { timeout: 10000 }).should('be.visible');

    cy.contains('معلق').should('be.visible');
  });

  it('lists manufacturing orders', () => {
    cy.intercept('GET', '/api/v1/manufacturing/manufacturing-orders*').as('getMOs');

    cy.visit('/manufacturing/manufacturing-orders');
    cy.wait('@getMOs');
  });

  it('sends order with existing customer from sales page', () => {
    cy.intercept('POST', '/api/v1/manufacturing/manufacturing-orders/from-sales-order/*').as('createMO');

    cy.visit('/sales/orders');
    cy.contains('إدارة أوامر البيع', { timeout: 10000 }).should('be.visible');

    // If any "إرسال للتصنيع" exists, click it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cy.get('body').then(($body: any) => {
      if ($body.text().includes('إرسال للتصنيع')) {
        cy.contains('إرسال للتصنيع').first().click();
        cy.wait('@createMO');
      }
    });
  });
});

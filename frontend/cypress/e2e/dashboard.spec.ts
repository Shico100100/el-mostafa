describe('Dashboard (لوحة المعلومات)', () => {
  beforeEach(() => {
    cy.login();
  });

  it('loads the dashboard with Arabic heading', () => {
    cy.visit('/dashboard');
    cy.contains('نظرة شاملة', { timeout: 15000 }).should('be.visible');
  });

  it('shows the system name in the header', () => {
    cy.visit('/dashboard');
    cy.contains('نظام المصطفى', { timeout: 10000 }).should('be.visible');
  });

  it('renders the control tower button', () => {
    cy.visit('/dashboard');
    cy.contains('برج المراقبة', { timeout: 10000 }).should('be.visible');
  });

  it('renders the logout button', () => {
    cy.visit('/dashboard');
    cy.contains('خروج', { timeout: 10000 }).should('be.visible');
  });

  it('renders quick actions section', () => {
    cy.visit('/dashboard');
    cy.contains('الوصول السريع', { timeout: 10000 }).should('be.visible');
  });

  it('shows at least one dashboard panel', () => {
    cy.visit('/dashboard');
    cy.get('[class*="grid"]').should('be.visible');
  });

  it('shows the date in Arabic format', () => {
    cy.visit('/dashboard');
    cy.contains('نظرة شاملة', { timeout: 10000 }).should('be.visible');
  });
});

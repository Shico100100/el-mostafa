describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('shows the login form', () => {
    cy.contains('تسجيل الدخول').should('be.visible');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('logs in with valid credentials and redirects to dashboard', () => {
    cy.get('input[type="email"]').type('admin@admin.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains('نظرة شاملة', { timeout: 15000 }).should('be.visible');
  });

  it('shows error on invalid credentials', () => {
    cy.get('input[type="email"]').type('wrong@email.com');
    cy.get('input[type="password"]').type('wrongpass!');
    cy.get('button[type="submit"]').click();

    cy.contains(/كلمة المرور غير صحيحة|Unauthorized|غير صحيحة|invalid|failed/i, { timeout: 8000 }).should('be.visible');
  });
});

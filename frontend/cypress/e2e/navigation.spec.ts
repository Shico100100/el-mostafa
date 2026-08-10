describe('Navigation', () => {
  beforeEach(() => {
    cy.login('admin@admin.com', 'admin123');
  });

  const routes = [
    { href: '/sales', label: 'المبيعات' },
    { href: '/purchases', label: 'المشتريات' },
    { href: '/manufacturing', label: 'التصنيع' },
    { href: '/accounting', label: 'المحاسبة' },
    { href: '/reports', label: 'التقارير' },
    { href: '/inventory2', label: 'المخزون' },
    { href: '/manufacturing/boms', label: 'BOM' },
    { href: '/manufacturing/machines', label: 'الماكينات' },
    { href: '/manufacturing/molds', label: 'القوالب' },
    { href: '/manufacturing/raw-materials', label: 'الخامات' },
    { href: '/manufacturing/daily-production', label: 'إنتاج يومي' },
    { href: '/notifications', label: 'الإشعارات' },
    { href: '/users', label: 'المستخدمين' },
    { href: '/settings', label: 'الإعدادات' },
    { href: '/audit', label: 'سجل التدقيق' },
  ];

  routes.forEach(({ href, label }) => {
    it(`navigates to ${href} (${label})`, () => {
      cy.visit(href);
      cy.url({ timeout: 10000 }).should('include', href);
    });
  });

  it('navigates via sidebar links', () => {
    cy.visit('/dashboard');
    cy.contains('المبيعات').click();
    cy.contains('طلبات البيع').click();
    cy.url().should('include', '/sales/orders');
    cy.contains('المشتريات').click();
    cy.contains('أوامر الشراء').click();
    cy.url().should('include', '/purchases/orders');
  });
});

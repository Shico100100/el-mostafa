export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email?: string, password?: string) => {
  const e = email || Cypress.env('auth_email') || 'admin@example.com';
  const p = password || Cypress.env('auth_password') || 'secret';
  const apiUrl = (Cypress.env('api_url') || 'http://localhost:3001').replace(/\/+$/, '');
  cy.session([e, p], () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/api/v1/auth/email/login`,
      body: { email: e, password: p },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).then((resp: any) => {
      window.localStorage.setItem('token', resp.body.token);
    });
  });
  cy.visit('/dashboard');
});

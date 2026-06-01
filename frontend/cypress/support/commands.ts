Cypress.Commands.add('login', (email?: string, password?: string) => {
  cy.session(
    [email || 'admin@example.com', password || 'password'],
    () => {
      cy.request({
        method: 'POST',
        url: '/api/v1/auth/email/login',
        body: {
          email: email || 'admin@example.com',
          password: password || 'password',
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).then((resp: any) => {
        window.localStorage.setItem('token', resp.body.token);
      });
    },
  );
  cy.visit('/');
});

// Global support file — runs before every spec

// Custom command: login via API (bypasses UI for speed in non-auth tests)
Cypress.Commands.add('loginViaApi', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login`,
    body: {
      username: Cypress.env('adminUsername'),
      password: Cypress.env('adminPassword'),
    },
  }).then((res) => {
    expect(res.body.success).to.be.true;
    window.localStorage.setItem('crm_token', res.body.token);
  });
});

// Custom command: login via UI
Cypress.Commands.add('loginViaUI', () => {
  cy.visit('/admin/login');
  cy.get('input[type="text"]').type(Cypress.env('adminUsername'));
  cy.get('input[type="password"]').type(Cypress.env('adminPassword'));
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/admin');
});

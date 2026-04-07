describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/admin/login');
  });

  it('shows the login page', () => {
    cy.contains('Admin Login').should('be.visible');
    cy.get('input[type="text"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('shows error on invalid credentials', () => {
    cy.get('input[type="text"]').type('wronguser');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    cy.contains(/invalid|failed|incorrect|unauthorized/i).should('be.visible');
  });

  it('logs in with valid credentials and redirects to admin', () => {
    cy.get('input[type="text"]').type(Cypress.env('adminUsername'));
    cy.get('input[type="password"]').type(Cypress.env('adminPassword'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin');
    cy.contains('Car Sales CRM').should('be.visible');
  });

  it('redirects unauthenticated user from /admin to login', () => {
    cy.visit('/admin');
    cy.url().should('include', '/admin/login');
  });

  it('logs out and redirects to login page', () => {
    cy.loginViaUI();
    cy.contains('Logout').click();
    cy.url().should('include', '/admin/login');
  });
});

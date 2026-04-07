describe('Admin - Leads Management', () => {
  beforeEach(() => {
    cy.loginViaApi();
    cy.visit('/admin');
    cy.contains('nav button', 'Leads').click();
  });

  it('shows the Leads page with form and table', () => {
    cy.contains('Add Lead').should('be.visible');
    cy.contains('Leads (').should('be.visible');
  });

  it('adds a new lead', () => {
    const name = `Test Lead ${Date.now()}`;

    cy.contains('Add Lead').parents('.card').within(() => {
      cy.get('input[placeholder*="Customer Name"]').type(name);
      cy.get('input[placeholder*="Phone"]').type('0123456789');
      cy.get('button[type="submit"]').click();
    });

    cy.contains(name).should('be.visible');
  });

  it('changes lead status to contacted', () => {
    const name = `Contact Test ${Date.now()}`;

    cy.contains('Add Lead').parents('.card').within(() => {
      cy.get('input[placeholder*="Customer Name"]').type(name);
      cy.get('input[placeholder*="Phone"]').type('0199999999');
      cy.get('button[type="submit"]').click();
    });

    cy.contains(name)
      .closest('tr')
      .find('select')
      .select('contacted');

    cy.contains(name)
      .closest('tr')
      .find('select')
      .should('have.value', 'contacted');
  });
});

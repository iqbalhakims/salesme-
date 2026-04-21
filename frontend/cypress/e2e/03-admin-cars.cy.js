describe('Admin - Cars Management', () => {
  beforeEach(() => {
    cy.loginViaApi();
    cy.visit('/admin');
  });

  it('shows the Cars tab by default', () => {
    cy.contains('Add Car').should('be.visible');
    cy.contains('Car Inventory').should('be.visible');
  });

  it('adds a new car', () => {
    const model = `Test Car ${Date.now()}`;

    cy.contains('Add Car').parents('.card').within(() => {
      cy.get('input[placeholder*="Model"]').type(model);
      cy.get('input[placeholder*="Price"]').type('50000');
      cy.get('input[placeholder*="Mileage"]').type('20000');
      cy.get('input[placeholder*="Condition"]').type('Good');
      cy.get('button[type="submit"]').click();
    });

    cy.contains(model).should('be.visible');
  });

  it('changes car status to sold', () => {
    // Add a car first
    const model = `Status Test ${Date.now()}`;
    cy.contains('Add Car').parents('.card').within(() => {
      cy.get('input[placeholder*="Model"]').type(model);
      cy.get('input[placeholder*="Price"]').type('30000');
      cy.get('button[type="submit"]').click();
    });

    cy.contains(model)
      .closest('tr')
      .find('select')
      .select('sold');

    cy.contains(model)
      .closest('tr')
      .contains('sold')
      .should('be.visible');
  });

  it('shows navigation tabs for Cars, Leads, Appointments, System', () => {
    cy.contains('nav button', 'Cars').should('be.visible');
    cy.contains('nav button', 'Leads').should('be.visible');
    cy.contains('nav button', 'Appointments').should('be.visible');
    cy.contains('nav button', 'System').should('be.visible');
  });
});

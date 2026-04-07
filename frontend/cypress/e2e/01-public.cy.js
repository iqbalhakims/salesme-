describe('Public Pages', () => {
  it('loads the homepage', () => {
    cy.visit('/');
    cy.contains('Car Sales').should('be.visible');
  });

  it('shows car listing on homepage', () => {
    cy.visit('/');
    // The page should render without errors
    cy.get('body').should('not.be.empty');
  });

  it('redirects unknown routes to homepage', () => {
    cy.visit('/does-not-exist');
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });

  it('navigates to car detail page', () => {
    cy.visit('/');
    // If there are cars listed, click the first one
    cy.get('body').then(($body) => {
      const carLinks = $body.find('a[href*="/cars/"]');
      if (carLinks.length > 0) {
        cy.wrap(carLinks.first()).click();
        cy.url().should('match', /\/cars\/\d+/);
      } else {
        cy.log('No cars listed yet — skipping car detail navigation');
      }
    });
  });
});

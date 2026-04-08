# salesman

## QA - Cypress E2E Tests

### Test Specs

| File | Coverage |
|------|----------|
| `01-public.cy.js` | Homepage loads, unknown routes redirect, car detail navigation |
| `02-auth.cy.js` | Login page UI, invalid creds error, valid login redirect, unauthenticated redirect, logout |
| `03-admin-cars.cy.js` | Add car, change status, nav tabs visible |
| `04-admin-leads.cy.js` | Add lead, change lead status |

### Scripts

```bash
npm run cy:open       # interactive GUI
npm run cy:run        # headless CI mode
npm run cy:run:headed # headed browser mode
```

### Running Tests

Make sure both frontend and backend are running first:

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

Then:

```bash
cd car-sales-crm/frontend
npm run cy:open
```

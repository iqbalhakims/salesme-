# Car Sales CRM — Cypress Testing Findings

This document summarizes the bugs detected and fixed through Cypress E2E testing.

---

## Bugs Found & Fixed

### 1. Wrong `baseUrl` in Cypress config
**File:** `frontend/cypress.config.js`

Cypress was pointing to `localhost:3001` but the app was running on `localhost:3007`.

**Fix:** Updated `baseUrl` to match the actual dev server port.

---

### 2. Homepage brand text mismatch
**File:** `frontend/cypress/e2e/01-public.cy.js`

Test was asserting `cy.contains('Car Sales')` but the homepage displays `iqbalhakim` as the brand name.

**Fix:** Updated the test assertion to match the actual brand text.

---

### 3. Login button missing `type="submit"`
**File:** `frontend/src/pages/LoginPage.js`

The login form's button had no `type` attribute. Without `type="submit"`, Cypress could not find the button via `cy.get('button[type="submit"]')` and the auth test suite failed entirely.

**Fix:** Added `type="submit"` to the login button.

---

### 4. Backend 500 error when creating a car with empty mileage
**File:** `backend/src/controllers/carController.js`

When the Add Car form is submitted without filling in the optional Mileage field, the frontend sends an empty string `""`. MySQL rejects `""` for an integer column (`mileage INT`), causing a 500 Internal Server Error.

**Error:**
```
Incorrect integer value: '' for column 'mileage' at row 1
```

**Fix:** Sanitized the `mileage` and `condition` fields in the controller to convert empty strings to `null` before inserting into the database.

---

## Test Coverage

| Spec | Tests | What it covers |
|---|---|---|
| `01-public.cy.js` | 4 | Homepage loads, car listing, unknown route redirect, car detail navigation |
| `02-auth.cy.js` | 5 | Login page UI, invalid credentials, valid login, unauthenticated redirect, logout |
| `03-admin-cars.cy.js` | 4 | Add car, change car status, navigation tabs |
| `04-admin-leads.cy.js` | - | Leads management |

## Running Tests

Start the app first:
```bash
PORT=3007 npm start   # frontend
docker compose up -d  # backend + db
```

Then run Cypress:
```bash
npm run cy:open   # interactive
npm run cy:run    # headless
```
# salesme-

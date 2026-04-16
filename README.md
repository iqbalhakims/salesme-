# Car Sales CRM

A full-stack Customer Relationship Management (CRM) system for car dealerships. Provides a public-facing car listing site and a protected admin panel for managing inventory, leads, appointments, and media uploads.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [Local Development](#local-development)
  - [Docker (Production)](#docker-production)
- [CI/CD Pipeline](#cicd-pipeline)
- [Testing](#testing)
  - [Unit Tests (Jest)](#unit-tests-jest)
  - [E2E Tests (Cypress)](#e2e-tests-cypress)
  - [Load Tests (K6)](#load-tests-k6)
- [Monitoring](#monitoring)

---

## Features

### Public
- Browse all available cars with search, filtering, and sorting
- Filter by make/model, price range, year, mileage, and condition
- View car detail page with full image gallery and video
- Submit a lead (name + phone) to express interest in a car

### Admin (JWT-protected)
- Secure login with bcrypt-hashed password and 7-day JWT session
- Add, edit, and delete car listings (model, price, year, mileage, condition, grade, ref no.)
- Upload multiple images and videos per car
- Record dents and scratches with photo evidence
- Manage leads — view contact info, update status, set follow-up dates
- Create and manage appointments tied to leads (scheduled / completed / cancelled)
- Change car status (available / sold / reserved)
- Generate template-based marketing messages per car

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Uploads | Multer (images & videos, max 200 MB) |
| Reverse Proxy | Nginx |
| Containerisation | Docker, Docker Compose |
| CI/CD | GitHub Actions → DigitalOcean Droplet |
| E2E Testing | Cypress 15 |
| Unit Testing | Jest 29 |
| Load Testing | K6 |
| Monitoring | Prometheus |

---

## Project Structure

```
car-sales-crm/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app entry point
│   │   ├── config/
│   │   │   └── database.js         # MySQL connection pool (max 10)
│   │   ├── controllers/            # Request handlers & business logic
│   │   │   ├── authController.js
│   │   │   ├── carController.js
│   │   │   ├── imageController.js
│   │   │   ├── videoController.js
│   │   │   ├── dentController.js
│   │   │   ├── leadController.js
│   │   │   ├── appointmentController.js
│   │   │   └── messageController.js
│   │   ├── models/                 # Database query abstractions
│   │   │   ├── carModel.js
│   │   │   ├── imageModel.js
│   │   │   ├── videoModel.js
│   │   │   ├── dentModel.js
│   │   │   ├── leadModel.js
│   │   │   └── appointmentModel.js
│   │   ├── routes/                 # Express route definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── carRoutes.js
│   │   │   ├── imageRoutes.js
│   │   │   ├── videoRoutes.js
│   │   │   ├── leadRoutes.js
│   │   │   ├── appointmentRoutes.js
│   │   │   └── messageRoutes.js
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verification middleware
│   │   │   └── upload.js           # Multer config
│   │   └── services/
│   │       └── messageService.js   # Marketing message templates
│   ├── uploads/                    # Persisted uploaded files (volume-mounted)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js                  # Route definitions
│   │   ├── auth.js                 # Token read/write helpers
│   │   ├── ProtectedRoute.js       # Admin route guard
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── HomePage.js     # Public car listing & search
│   │   │   │   └── CarDetailPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── AdminPage.js
│   │   │   ├── CarsPage.js
│   │   │   ├── LeadsPage.js
│   │   │   └── MessagesPage.js
│   │   └── components/
│   ├── cypress/
│   │   ├── e2e/
│   │   │   ├── 01-public.cy.js
│   │   │   ├── 02-auth.cy.js
│   │   │   ├── 03-admin-cars.cy.js
│   │   │   └── 04-admin-leads.cy.js
│   │   └── support/
│   ├── public/
│   │   └── index.html
│   ├── nginx.conf                  # Nginx reverse proxy config
│   ├── cypress.config.js
│   ├── Dockerfile
│   └── package.json
│
├── k6/
│   ├── smoke-test.js               # Low-load validation (1 VU, 30s)
│   └── stress-test.js              # High-load stress test
│
├── monitoring/
│   └── prometheus.yml              # Scrape config for metrics
│
├── init.sql                        # Database initialisation script
├── docker-compose.yml              # Orchestrates all services
└── .github/
    └── workflows/
        └── deploy.yml              # CI/CD pipeline
```

---

## Database Schema

### `cars`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `model` | VARCHAR(255) | |
| `price` | INT | |
| `mileage` | INT | nullable |
| `condition` | VARCHAR(100) | nullable |
| `year` | INT | nullable |
| `grade` | VARCHAR(50) | nullable |
| `ref_no` | VARCHAR(10) UNIQUE | nullable |
| `status` | VARCHAR(50) | default `available` |
| `created_at` | TIMESTAMP | |

### `car_images`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `car_id` | INT FK → cars.id | CASCADE DELETE |
| `filename` | VARCHAR(255) | |
| `created_at` | TIMESTAMP | |

### `car_videos`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `car_id` | INT FK → cars.id | CASCADE DELETE |
| `filename` | VARCHAR(255) | |
| `created_at` | TIMESTAMP | |

### `leads`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `name` | VARCHAR(255) | |
| `phone` | VARCHAR(50) | |
| `car_id` | INT FK → cars.id | SET NULL on DELETE |
| `status` | VARCHAR(50) | default `new` |
| `next_follow_up_date` | DATE | nullable |
| `created_at` | TIMESTAMP | |

### `appointments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `lead_id` | INT FK → leads.id | CASCADE DELETE |
| `appointment_date` | DATETIME | |
| `notes` | TEXT | nullable |
| `status` | ENUM | `scheduled` / `completed` / `cancelled` |
| `created_at` | TIMESTAMP | |

> **Auto-migrations:** `carModel.js` runs ALTER TABLE on startup to add `year`, `grade`, and `ref_no` columns if missing — no manual migration needed.

---

## API Reference

All protected endpoints require the header:
```
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Admin login, returns JWT |
| GET | `/api/auth/verify` | Protected | Verify token validity |

### Cars

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cars` | Public | List all cars |
| POST | `/api/cars` | Admin | Create a new car |
| PUT | `/api/cars/:id` | Admin | Update car details |
| PATCH | `/api/cars/:id/status` | Admin | Update car status |
| DELETE | `/api/cars/:id` | Admin | Delete a car |

### Car Images

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cars/:id/images` | Public | Get images for a car |
| POST | `/api/cars/:id/images` | Admin | Upload image (`multipart/form-data`) |
| DELETE | `/api/cars/:id/images/:imageId` | Admin | Delete an image |

### Car Videos

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cars/:id/videos` | Public | Get videos for a car |
| POST | `/api/cars/:id/videos` | Admin | Upload video (`multipart/form-data`) |
| DELETE | `/api/cars/:id/videos/:videoId` | Admin | Delete a video |

### Car Dents / Scratches

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cars/:id/dents` | Public | Get dent records for a car |
| POST | `/api/cars/:id/dents` | Admin | Upload dent image |
| DELETE | `/api/cars/:id/dents/:dentId` | Admin | Delete dent record |

### Leads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads` | Admin | List all leads |
| POST | `/api/leads` | Public | Submit a new lead |
| PATCH | `/api/leads/:id` | Admin | Update lead status or follow-up date |

### Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/appointments/lead/:leadId` | Admin | Get appointments for a lead |
| POST | `/api/appointments` | Admin | Create a new appointment |
| PATCH | `/api/appointments/:id/status` | Admin | Update appointment status |
| DELETE | `/api/appointments/:id` | Admin | Delete an appointment |

### Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/messages/generate` | Admin | Generate a marketing message for a car |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | API health check |

### Response Format

All endpoints return JSON:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

HTTP status codes used: `200`, `201`, `400`, `401`, `404`, `500`.

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=carcrm

# Admin credentials (seeds the single admin user on startup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

# JWT signing secret
JWT_SECRET=your_supersecret_jwt_key
```

> For Docker deployments these are injected via `docker-compose.yml` and GitHub Actions secrets.

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MySQL 8
- Docker & Docker Compose (for containerised setup)

---

### Local Development

#### 1. Database

Start a MySQL 8 instance and run the initialisation script:

```bash
mysql -u root -p < init.sql
```

#### 2. Backend

```bash
cd backend
npm install
cp .env.example .env     # fill in your values
npm run dev              # starts with nodemon on port 3000
```

#### 3. Frontend

```bash
cd frontend
npm install
PORT=3007 npm start      # starts on localhost:3007, proxies /api → localhost:3000
```

---

### Docker (Production)

Build and start all services with a single command:

```bash
docker compose up -d
```

| Service | Exposed Port |
|---------|-------------|
| Frontend (Nginx) | `80` |
| Backend (Express) | `3000` |
| MySQL | internal only |

Uploaded files are stored in the `uploads_data` Docker volume, shared between the backend container and Nginx.

To stop and remove all volumes:

```bash
docker compose down -v
```

---

## CI/CD Pipeline

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) triggers on every push to `main`:

1. **Build & Push** — Builds Docker images and pushes to GitHub Container Registry (GHCR):
   - `ghcr.io/iqbalhakims/salesme-frontend:latest`
   - `ghcr.io/iqbalhakims/salesme-backend:latest`

2. **Deploy** — SSHs into a DigitalOcean Droplet and:
   - Pulls the latest images
   - Writes a `.env` from GitHub Secrets
   - Runs `docker compose up -d`

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DROPLET_HOST` | IP or hostname of the DigitalOcean Droplet |
| `DROPLET_USER` | SSH username |
| `DROPLET_SSH_KEY` | Private SSH key |
| `GHCR_TOKEN` | GitHub token with `read:packages` scope |
| `DB_PASSWORD` | MySQL root password |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `JWT_SECRET` | JWT signing secret |

---

## Testing

### Unit Tests (Jest)

```bash
cd backend
npm test
```

### E2E Tests (Cypress)

The frontend must be running on `localhost:3007` and the backend on `localhost:3000`.

```bash
cd frontend

# Interactive mode (opens Cypress UI)
npm run cy:open

# Headless (CI)
npm run cy:run

# Headless with browser visible
npm run cy:run:headed
```

#### Test Specs

| Spec | Coverage |
|------|----------|
| `01-public.cy.js` | Homepage load, car listing, unknown route redirect, car detail navigation |
| `02-auth.cy.js` | Login page UI, invalid credentials, valid login, auth redirect, logout |
| `03-admin-cars.cy.js` | Add car, change car status, tab navigation |
| `04-admin-leads.cy.js` | Add lead, change lead status |

### Load Tests (K6)

Requires [K6](https://k6.io/docs/get-started/installation/) installed.

```bash
# Smoke test — 1 VU for 30 seconds
k6 run k6/smoke-test.js

# Stress test
k6 run k6/stress-test.js
```

Covers: health check, login, car listing, and lead listing endpoints.

---

## Monitoring

Prometheus scrape targets are defined in [`monitoring/prometheus.yml`](monitoring/prometheus.yml):

- `node-exporter` — host-level metrics (CPU, memory, disk)
- `mysqld-exporter` — MySQL metrics
- Backend `/metrics` endpoint

---

## Frontend Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Car listing homepage |
| `/cars/:id` | Public | Car detail page |
| `/admin/login` | Public | Admin login |
| `/admin/*` | Protected | Admin panel (requires JWT) |

---

## Security Notes

- Passwords are hashed with **bcrypt** before storage.
- All admin routes are protected with **JWT Bearer token** middleware.
- Database queries use **parameterised statements** to prevent SQL injection.
- CORS is enabled; restrict the `origin` to your frontend domain in production.
- Change all default secrets (`JWT_SECRET`, `ADMIN_PASSWORD`, `DB_PASSWORD`) before deploying.

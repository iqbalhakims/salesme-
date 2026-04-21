# Car Sales CRM

A full-stack Customer Relationship Management (CRM) system for car dealerships. Provides a public-facing car listing site and a protected admin panel for managing inventory, leads, appointments, media uploads, and system health.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [User Access Control](#user-access-control)
- [System Monitor](#system-monitor)
- [Known Issues & Troubleshooting](#known-issues--troubleshooting)
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
- [Infrastructure & Scaling](#infrastructure--scaling)

---

## Features

### Public (no login required)
- Browse all available cars with search, filtering, and sorting
- Filter by make/model, price range, year, mileage, and condition
- View car detail page with full image gallery and video
- Submit a lead (name + phone) to express interest in a car
- Book an appointment online

### Admin Panel (`/admin/login`)
- Secure login with bcrypt-hashed password and 7-day JWT session
- Add, edit, and delete car listings (model, price, year, mileage, condition, grade, ref no.)
- Upload multiple images and videos per car
- Record dents and scratches with photo evidence
- Manage leads — view contact info, update status, set follow-up dates
- Create and manage appointments tied to leads (scheduled / completed / cancelled)
- Change car status (available / sold / reserved)
- **User Management** — create staff accounts with granular permissions (Read / Create / Edit / Delete)
- **System Monitor** — live CPU, RAM, Node.js heap, API traffic, DB latency, and upload storage dashboards

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
| Monitoring | Prometheus + in-app System Monitor |

---

## Project Structure

```
car-sales-crm/
├── backend/
│   ├── src/
│   │   ├── app.js                      # Express app entry point
│   │   ├── config/
│   │   │   └── database.js             # MySQL connection pool (with query latency tracking)
│   │   ├── controllers/
│   │   │   ├── authController.js       # Login, verify, admin seed on startup
│   │   │   ├── carController.js
│   │   │   ├── imageController.js
│   │   │   ├── videoController.js
│   │   │   ├── dentController.js
│   │   │   ├── leadController.js
│   │   │   ├── appointmentController.js
│   │   │   ├── messageController.js
│   │   │   ├── systemController.js     # CPU / RAM / API / DB / storage stats
│   │   │   └── userController.js       # Staff user CRUD
│   │   ├── models/
│   │   │   ├── carModel.js
│   │   │   ├── imageModel.js
│   │   │   ├── videoModel.js
│   │   │   ├── dentModel.js
│   │   │   ├── leadModel.js
│   │   │   └── appointmentModel.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── carRoutes.js
│   │   │   ├── imageRoutes.js
│   │   │   ├── videoRoutes.js
│   │   │   ├── leadRoutes.js
│   │   │   ├── appointmentRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   ├── systemRoutes.js         # GET /api/system/stats
│   │   │   └── userRoutes.js           # CRUD /api/users (admin only)
│   │   ├── middleware/
│   │   │   ├── auth.js                 # JWT verification
│   │   │   ├── upload.js               # Multer config
│   │   │   ├── requireAdmin.js         # Role guard (admin only)
│   │   │   └── requestMetrics.js       # Per-request latency + status tracking
│   │   ├── utils/
│   │   │   └── metricsStore.js         # In-memory per-minute bucket store (6h)
│   │   └── services/
│   │       └── messageService.js
│   ├── uploads/                        # Persisted uploaded files (volume-mounted)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── auth.js                     # Token helpers + authFetch
│   │   ├── PermContext.js              # React context for role + permissions
│   │   ├── ProtectedRoute.js           # Route guard + injects PermContext
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── HomePage.js
│   │   │   │   ├── CarDetailPage.js
│   │   │   │   └── BookingPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── AdminPage.js            # Navbar + tab router
│   │   │   ├── CarsPage.js             # Permission-aware
│   │   │   ├── LeadsPage.js            # Permission-aware
│   │   │   ├── AppointmentsPage.js
│   │   │   ├── SystemPage.js           # Live system monitor dashboard
│   │   │   └── UsersPage.js            # Staff user management (admin only)
│   ├── cypress/
│   │   ├── e2e/
│   │   │   ├── 01-public.cy.js
│   │   │   ├── 02-auth.cy.js
│   │   │   ├── 03-admin-cars.cy.js
│   │   │   └── 04-admin-leads.cy.js
│   │   └── support/
│   ├── public/
│   │   └── index.html
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
│
├── k6/
│   ├── smoke-test.js
│   └── stress-test.js
│
├── monitoring/
│   └── prometheus.yml
│
├── init.sql                            # DB schema (users table auto-created on startup too)
├── docker-compose.yml
└── .github/
    └── workflows/
        └── deploy.yml
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

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT PK AUTO_INCREMENT | |
| `username` | VARCHAR(100) UNIQUE | |
| `password_hash` | VARCHAR(255) | bcrypt |
| `role` | ENUM | `admin` / `staff` |
| `perm_view` | TINYINT(1) | Can log in and read data |
| `perm_create` | TINYINT(1) | Can add cars, leads, appointments |
| `perm_edit` | TINYINT(1) | Can edit records and change status |
| `perm_delete` | TINYINT(1) | Can delete records |
| `created_at` | TIMESTAMP | |

> **Auto-migrations:** `carModel.js` runs `ALTER TABLE` on startup to add `year`, `grade`, and `ref_no` columns if missing. The `users` table is also created on startup via `seedAdmin()` if it doesn't exist.

---

## API Reference

All protected endpoints require:
```
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT with role + perms |
| GET | `/api/auth/verify` | Protected | Verify token, returns username + role + perms |

### Cars

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cars` | Public | List all cars |
| POST | `/api/cars` | Staff | Create a new car |
| PUT | `/api/cars/:id` | Staff | Update car details |
| PATCH | `/api/cars/:id/status` | Staff | Update car status |
| DELETE | `/api/cars/:id` | Staff | Delete a car |

### Car Images

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cars/:id/images` | Public | Get images for a car |
| POST | `/api/cars/:id/images` | Staff | Upload image (`multipart/form-data`) |
| DELETE | `/api/cars/:id/images/:imageId` | Staff | Delete an image |

### Car Videos

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cars/:id/videos` | Public | Get videos for a car |
| POST | `/api/cars/:id/videos` | Staff | Upload video (`multipart/form-data`) |
| DELETE | `/api/cars/:id/videos/:videoId` | Staff | Delete a video |

### Car Dents / Scratches

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cars/:id/dents` | Public | Get dent records for a car |
| POST | `/api/cars/:id/dents` | Staff | Upload dent image |
| DELETE | `/api/cars/:id/dents/:dentId` | Staff | Delete dent record |

### Leads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leads` | Staff | List all leads |
| POST | `/api/leads` | Public | Submit a new lead |
| PATCH | `/api/leads/:id` | Staff | Update lead status or follow-up date |

### Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/appointments/lead/:leadId` | Staff | Get appointments for a lead |
| POST | `/api/appointments` | Staff | Create a new appointment |
| PATCH | `/api/appointments/:id/status` | Staff | Update appointment status |
| DELETE | `/api/appointments/:id` | Staff | Delete an appointment |

### Users (Admin only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users` | Admin | Create a staff user |
| PATCH | `/api/users/:id/perms` | Admin | Update user permissions |
| DELETE | `/api/users/:id` | Admin | Delete a staff user |

### System Monitor

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/system/stats` | Staff | CPU, RAM, process, API traffic, DB latency, storage |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | API health check |

### Response Format

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

HTTP status codes used: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.

---

## User Access Control

The system has two distinct areas:

| Area | URL | Access |
|------|-----|--------|
| **Customer site** | `/` | Public — no login, always accessible |
| **Admin panel** | `/admin/login` | Staff login required |

### Permissions

Staff accounts have four independently toggleable permissions:

| Permission | Color | What it controls in the admin panel |
|-----------|-------|--------------------------------------|
| **Read** | Green | Can log in and view all data. Required — without it the account is blocked |
| **Create** | Blue | Can add cars, leads, and appointments |
| **Edit** | Amber | Can edit records and change car status |
| **Delete** | Red | Can delete cars, leads, and records |

The `admin` account (seeded from `.env` on startup) always has full access and cannot be modified or deleted.

### Admin startup seeding

On every server start, `seedAdmin()`:
1. Runs `CREATE TABLE IF NOT EXISTS users` — safe to run on existing containers
2. Checks if the admin username from `.env` exists
3. If not, inserts it with a bcrypt-hashed password and full permissions

This means **you can never lose admin access** even if you restart the container or the `users` table is missing.

---

## System Monitor

Accessible via the **System** tab in the admin panel. All data is collected in-process — no external agents required.

### Dashboards

| Section | Metrics |
|---------|---------|
| **Infrastructure** | CPU usage %, load average (1/5/15m), RAM used %, Node.js heap % |
| **API Traffic** | Requests per minute (bar chart), 4xx/5xx error overlay, avg response latency |
| **Database** | Avg query latency, P95 latency, slow query count (>100ms) + timestamps |
| **Upload Storage** | Disk used (MB), file count, avg MB per file |

### How it works

- **6-hour rolling window** — up to 7,200 data points at 3-second polling intervals
- **Downsampled to 300 points** for SVG rendering (no chart library dependency)
- **Hourly x-axis timestamps** on all line and bar charts
- **Color thresholds** — metrics turn amber >60% and red >85%
- **DB latency** — `pool.query` is wrapped to record every query duration; slow queries (>100ms) are stored separately with timestamps
- **API metrics** — Express middleware records status code and latency into per-minute buckets

---

## Known Issues & Troubleshooting

This section documents real bugs encountered during development of the user management module and how each was resolved.

---

### 1. Cars not showing on homepage after user module was added

**Symptom:** The public homepage showed no cars. The admin panel was also unreachable. All API routes returned connection errors.

**Root cause:** The `users` table was added to `init.sql`, which MySQL only executes on the very first container creation. On an already-running container the table never got created. When the server started, `seedAdmin()` tried to query `SELECT id FROM users WHERE username = ?` — the table didn't exist, so it threw an error before `app.listen()` was ever called. Because the server never started listening, **all routes failed**, including the public `GET /api/cars` endpoint the homepage depends on.

**Fix:** `seedAdmin()` now runs `CREATE TABLE IF NOT EXISTS users` itself before querying it, making it safe regardless of whether the container is new or existing:

```js
// authController.js — runs on every server startup
async function seedAdmin() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users ( ... )`);
  // then check and insert admin row
}
```

**Lesson:** Never rely solely on `init.sql` for schema changes on a live container. Any new table that is queried at startup must be created defensively with `IF NOT EXISTS` in application code.

---

### 2. "View" permission confused with public car browsing

**Symptom:** When building the user permission system, naming the first permission "View" was ambiguous — customers already "view" cars on the public site without any login. Staff reviewing the Users page assumed "View" controlled what customers could see.

**Root cause:** Poor naming. The permission was meant to control whether a staff account could log in to the admin panel and read CRM data — not anything related to the public site.

**Fix:** Renamed the permission from `View` to `Read` and added a clear banner at the top of the Users page:

> **Admin Panel Access Only** — these users log in at `/admin/login` to manage the CRM. The public customer site (`/`) is always open with no login required.

The two areas are completely separate:
- `/` — public, no authentication, customers browse cars freely
- `/admin/login` — internal staff only, controlled by `Read / Create / Edit / Delete` permissions

---

### 3. JSX syntax error — cars page broke after permission guard was added

**Symptom:** After conditionally hiding the "Add Car" form for users without `create` permission, the React app crashed with:

```
JSX expressions must have one parent element.
'}' expected.
```

**Root cause:** The conditional render was written as `{perms.create && <div className="card">...</div>}` but the closing `}` was placed after the next sibling `<div>`, leaving both elements sharing the same conditional expression without a parent wrapper.

**Fix:** Closed the conditional immediately after the form div, before the inventory list div:

```jsx
{perms.create && <div className="card">
  {/* Add Car form */}
</div>}   {/* ← closing } was missing here */}

<div className="card">
  {/* Car Inventory — always visible */}
</div>
```

---

### 4. Admin account could be deleted or permission-stripped

**Symptom** (caught during development, before it could occur in production): The user delete and permission-update endpoints initially had no guard against modifying the `admin` role account. A staff user with delete access could theoretically call `DELETE /api/users/1` and remove the only admin.

**Fix:** Both `remove` and `updatePerms` in `userController.js` check the target user's role before acting:

```js
if (user.role === 'admin') {
  return res.status(403).json({ success: false, message: 'Cannot delete the admin account' });
}
```

The frontend also renders the admin row as read-only with no action buttons.

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

# Admin credentials (seeded into users table on startup)
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

On startup the server will:
- Wait for the DB to be ready
- Create the `users` table if missing
- Seed the admin user from `.env` if not already present

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

The in-app **System Monitor** (admin panel → System tab) provides real-time dashboards without any external tooling — useful during development and for quick health checks in production.

---

## Frontend Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Car listing homepage |
| `/cars/:id` | Public | Car detail page |
| `/book` | Public | Appointment booking |
| `/admin/login` | Public | Staff login |
| `/admin/*` | Protected | Admin panel (requires JWT) |

---

## Demo Access

A read-only guest account is available for exploring the admin panel:

| Field | Value |
|-------|-------|
| **URL** | `/admin/login` |
| **Username** | `guest` |
| **Password** | `guestguest` |

This account has **Read-only** permission — it can view all data but cannot create, edit, or delete anything.

---

## Infrastructure & Scaling

### File Storage — DigitalOcean Spaces

Images and videos are stored in **DigitalOcean Spaces** (S3-compatible object storage), decoupled from the Droplet.

**Pricing:**
- **$5/month** base — includes 250 GB storage + 1 TB outbound transfer
- Extra storage: $0.02/GB
- Extra transfer: $0.01/GB
- Built-in CDN included at no extra cost

**Key benefit:** Spaces is independent of your Droplet. You can scale, destroy, or replace Droplets freely without losing any files. All Droplets connect to the same Spaces bucket using the same env vars.

---

### Scaling Stages

#### Stage 1 — Starting out
```
User → Single Droplet (Node API + MySQL) → Spaces (images/videos)
```
- 1 Droplet handles everything
- Spaces for file storage
- ~$5–15/month

#### Stage 2 — Getting traffic (recommended next step)
```
User → Spaces CDN (images direct)
     → Droplet (API) → Managed MySQL (DO Database)
```
- Separate MySQL into **DO Managed Database** — DB survives Droplet restarts
- Enable **Spaces CDN** — images load from edge, zero load on your server
- ~$30–50/month

#### Stage 3 — Real scale
```
User → Spaces CDN (images/videos)
     → Load Balancer
          → Droplet 1 (API)
          → Droplet 2 (API)
     → Managed MySQL (primary + replica)
     → Redis (cache hot listings)
```
- Load balancer splits traffic across multiple API Droplets
- Read replica for MySQL — car listings are mostly reads
- Redis cache for popular listings (avoid repeated DB hits)
- ~$100–200/month

---

### Key Optimisations for Car Listing Sites

| Concern | Solution |
|---------|---------|
| Images are large | Spaces CDN + compress before upload |
| Search/filter is heavy | Add index on `model`, `price`, `condition`, `year` in MySQL |
| Listings rarely change | Cache with Redis (5–10 min TTL) |
| Videos are huge | Spaces CDN mandatory, lazy-load on frontend |
| Mobile users | CDN edge nodes serve from nearest location |

> **Recommended:** Jump straight to Stage 2. Move MySQL to DO Managed Database and enable Spaces CDN — this gives 80% of the scaling benefits at low cost, and you can add a load balancer later when needed.

---

### Required GitHub Secrets for Spaces (when enabled)

| Secret | Description |
|--------|-------------|
| `DO_SPACES_KEY` | Spaces access key |
| `DO_SPACES_SECRET` | Spaces secret key |
| `DO_SPACES_ENDPOINT` | e.g. `https://sgp1.digitaloceanspaces.com` |
| `DO_SPACES_BUCKET` | Your bucket name |
| `DO_SPACES_REGION` | e.g. `sgp1` |

---

## Security Notes

- Passwords are hashed with **bcrypt** (10 rounds) before storage.
- All admin routes are protected with **JWT Bearer token** middleware.
- The `admin` role is protected — its permissions and account cannot be modified via the API.
- Database queries use **parameterised statements** to prevent SQL injection.
- CORS is enabled; restrict the `origin` to your frontend domain in production.
- Change all default secrets (`JWT_SECRET`, `ADMIN_PASSWORD`, `DB_PASSWORD`) before deploying.

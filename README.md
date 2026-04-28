---
title: Finance Backend API
emoji: 🚀
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---
# Finance Backend API

A production-quality REST API for a finance dashboard system with role-based access control (RBAC), financial records management, and analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| Rate Limiting | express-rate-limit |
| API Docs | Swagger UI |
| Testing | Jest + Supertest |

---

## Why MongoDB?
- **Aggregation Pipeline** — native `$group`, `$match`, `$sum` make dashboard/analytics queries elegant
- **Flexible schema** — financial records with varying tags/metadata don't need migrations
- **JSON-native** — Express returns JSON, MongoDB stores BSON — no ORM impedance mismatch

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
The `.env` file is already set up with defaults. Update if needed:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/finance_db
JWT_ACCESS_SECRET=change_this_access_secret_min_32_chars
JWT_REFRESH_SECRET=change_this_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SEED_ADMIN_EMAIL=admin@finance.com
SEED_ADMIN_PASSWORD=Admin@123
```

### 3. Seed the database
Creates one user per role + 40 sample financial entries:
```bash
npm run seed
```

Seeded credentials:
| Role | Email | Password |
|---|---|---|
| admin | admin@finance.com | Admin@123 |
| analyst | analyst@finance.com | Analyst@123 |
| viewer | viewer@finance.com | Viewer@123 |

### 4. Start the dev server
```bash
npm run dev
```

Server: `http://localhost:3000`
API Docs (Swagger): `http://localhost:3000/api/docs`
Live/Deployed: https://saturn01-finance-backend-api.hf.space/api/docs/
---

## Role Permission Matrix

| Action | viewer | analyst | admin |
|---|:---:|:---:|:---:|
| View own entries | ✅ | ✅ | ✅ |
| View **all** entries | ❌ | ✅ | ✅ |
| Create entries | ❌ | ✅ | ✅ |
| Update **own** entries | ❌ | ✅ | ✅ |
| Update **any** entry | ❌ | ❌ | ✅ |
| Soft delete entries | ❌ | ❌ | ✅ |
| View analytics/dashboard | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |

---

## API Reference

### Base URL
```
http://localhost:3000/api/v1
```

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

### Auth `/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user (default role: viewer) |
| POST | `/auth/login` | ❌ | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | ❌ | Get new token pair via refresh token |
| POST | `/auth/logout` | ✅ | Invalidate refresh token |

### Users `/users`

| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/users/me` | any | Get own profile |
| PATCH | `/users/me` | any | Update name or password |
| GET | `/users` | admin | List all users (paginated) |
| GET | `/users/:id` | admin | Get user by ID |
| PATCH | `/users/:id/role` | admin | Change user role |
| PATCH | `/users/:id/status` | admin | Activate/deactivate user |

### Financial Entries `/entries`

| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/entries` | analyst+ | Create entry |
| GET | `/entries` | any | List entries (viewers see own only) |
| GET | `/entries/:id` | any | Get entry (viewers see own only) |
| PATCH | `/entries/:id` | analyst+ | Update (analysts: own; admin: any) |
| DELETE | `/entries/:id` | admin | Soft delete |

**Query filters for GET /entries:**
```
?type=income|expense|transfer
&category=Operations
&from=2024-01-01&to=2024-12-31
&search=salary
&sortBy=date|amount|createdAt
&sortOrder=asc|desc
&page=1&limit=10
```

### Analytics `/analytics`

| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/analytics/summary` | any | Total income, expense, net balance |
| GET | `/analytics/by-category` | any | Breakdown by category |
| GET | `/analytics/by-period` | any | Monthly/weekly/daily trends |
| GET | `/analytics/recent` | any | Recent N entries |

**Query params:**
```
?from=2024-01-01&to=2024-12-31
?period=monthly|weekly|daily   (for by-period)
?limit=10                      (for recent)
```

### Audit Logs `/audit`

| Method | Route | Role | Description |
|---|---|---|---|
| GET | `/audit` | admin | List audit logs with filters |

**Filters:** `?action=USER_LOGIN&userId=...&from=...&to=...&page=1&limit=10`

---

## Running Tests
```bash
npm test
```
Runs 3 integration test suites against a dedicated test DB (`finance_test_db`):
- `auth.test.ts` — register, login, refresh, logout
- `entries.test.ts` — CRUD, RBAC enforcement, pagination, soft delete
- `analytics.test.ts` — summary totals, category breakdown, period trends

---

## Project Structure

```
src/    
├── config/        env.ts, db.ts, swagger.ts, seed.ts
├── middleware/    auth, rbac, validate, error
├── models/        User, FinancialEntry, AuditLog
├── modules/
│   ├── auth/      schema, service, controller, routes
│   ├── users/     schema, service, controller, routes
│   ├── entries/   schema, service, controller, routes
│   ├── analytics/ service, controller, routes
│   └── audit/     service, controller, routes
├── routes/        index.ts (master router)
├── utils/         jwt, password, apiResponse, auditLogger
└── app.ts         Express app entry point
tests/
├── setup.ts       globalSetup (connect test DB)
├── teardown.ts    globalTeardown (drop + disconnect)
├── auth.test.ts
├── entries.test.ts
└── analytics.test.ts
```

---

## Key Design Decisions

1. **Soft Deletes** — Entries are never hard-deleted; `isDeleted` flag filters them out on all reads
2. **Refresh Token Storage** — Stored on the User document; invalidated on logout (single-device revocation)
3. **Role Hierarchy** — Numeric levels (`viewer=1, analyst=2, admin=3`) so `requireMinRole('analyst')` automatically passes admins
4. **Audit Logging** — Every mutation (create/update/delete/role change) writes an audit log; failures are swallowed so they never break the main request
5. **Aggregation Pipeline** — Analytics use MongoDB's native `$group` + `$sum` rather than loading data into JS — efficient at scale
6. **Zod Validation** — All request bodies and query params are validated at middleware level with field-level error messages

---

## Assumptions

- Single MongoDB instance (local or Atlas) — no replication/sharding needed for this scope
- No email verification required (mock auth acceptable per spec)
- All amounts stored as JS `Number` with 2-decimal precision enforced by Zod
- Analytics aggregate across **all** entries regardless of viewer role (dashboard-level data)

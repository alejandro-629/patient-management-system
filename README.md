# Patients Management System

Role-aware patient records. Admins can create, update, and delete patients. Users can view them.

- `backend/` — NestJS, TypeScript, PostgreSQL, Prisma
- `frontend/` — Next.js, TypeScript, Tailwind CSS, shadcn/ui
- `docker-compose.yml` — Postgres, API, and web app

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Compose v2
- For the manual setup only: Node.js 22 or newer and npm

## Quick start

```bash
git clone https://github.com/alejandro-629/patient-management-system.git
cd patient-management-system
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000). The API is at [http://localhost:3001](http://localhost:3001).

The API container applies migrations and seeds the database before it listens. The first build downloads images and installs dependencies, so it takes a few minutes.

Copy [`.env.example`](.env.example) to `.env` if you want to change the database password, the JWT secret, or the simulated failure rate. `NEXT_PUBLIC_API_URL` is baked into the frontend image, so changing it requires `docker compose up --build` again.

## Demo accounts

| Email | Password | Role |
| --- | --- | --- |
| admin@demo.com | Admin123! | admin |
| user@demo.com | User123! | user |

The sign-in page shows the same accounts. They are seeded data, not a production login.

## Manual setup

Start only the database, then run each app on the host:

```bash
docker compose up -d postgres

cd backend
cp .env.example .env
npm ci
npx prisma migrate dev
npm run db:seed
npm run start:dev
```

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

The API listens on port 3001 and the web app on port 3000. On Windows PowerShell, use `Copy-Item .env.example .env` (and `.env.local` for the frontend) instead of `cp`.

## Tests

Backend unit tests mock Prisma. The end-to-end tests use a separate `patients_test` database on the same Postgres instance, with simulated failures turned off.

```bash
docker compose up -d postgres
docker compose exec postgres psql -U patients -d patients -c "CREATE DATABASE patients_test"
cd backend
DATABASE_URL=postgresql://patients:patients@localhost:5432/patients_test npx prisma migrate deploy
DATABASE_URL=postgresql://patients:patients@localhost:5432/patients_test npm run db:seed
npm test
npm run test:e2e
```

`npm run test:e2e` points itself at `patients_test`. The two `DATABASE_URL=...` commands are what create and fill that database. Running the seed again does not duplicate rows. On Windows PowerShell, set `$env:DATABASE_URL` to that URL before each of those two commands instead of prefixing them.

```bash
cd frontend
npm test
```

## Architecture

```text
Browser
  → Next.js (proxy.ts checks the token cookie, React Query loads data)
  → NestJS (JWT guard, then role guard, then controller)
  → Prisma
  → PostgreSQL
```

| Method | Path | Who |
| --- | --- | --- |
| POST | `/auth/login` | anyone |
| GET | `/patients`, `/patients/:id` | admin, user |
| POST, PUT, DELETE | `/patients` | admin |

A missing or expired token returns 401. A valid token with the wrong role returns 403. A duplicate email returns 409. Every error body has the same shape: `statusCode`, `error`, `message`, `path`, `timestamp`, and `requestId`.

## Decisions

- **Secure by default.** `JwtAuthGuard` is global. A route is public only when it is marked `@Public()`, so a new endpoint is protected unless someone opts out.
- **The UI hides buttons. The API enforces the role.** Hiding Edit and Delete is presentation. `RolesGuard` is the control.
- **PUT replaces the whole record.** A partial body is a 400, which makes the contract obvious.
- **Sort columns are a fixed list** (`lastName`, `firstName`, `dob`, `createdAt`) so a query string cannot pick an arbitrary column.
- **Dates of birth are calendar dates** (`YYYY-MM-DD`), stored as a Postgres `DATE`, so a timezone cannot shift the day.
- **Reads retry. Writes do not.** The frontend retries GET requests on 5xx only. Creates, updates, and deletes update the screen immediately and roll back if the request fails.
- **Flaky dependency.** Outside of tests, the API adds random latency and fails about 10% of patient requests with 503 before the handler runs, so a failed write never half-applies. Login and `/health` are exempt. Set `CHAOS_ENABLED=false` to turn this off.
- **The token is in a `SameSite=Strict` cookie that JavaScript can read.** The frontend sends it as a Bearer token. That is exposed to XSS. An httpOnly cookie through a backend-for-frontend would be the production version. Token expiry is checked in `proxy.ts` and again by the API.

## What was left out

The brief asks for judgment about scope. These were cut:

- Cloud hosting
- Refresh tokens and httpOnly cookies
- Response caching, an audit log, soft delete, and infinite scroll
- Frontend tests beyond the patient form

## Scripts

| Where | Command | What it does |
| --- | --- | --- |
| backend | `npm run start:dev` | API with reload |
| backend | `npm test` / `npm run test:e2e` | unit tests / API tests |
| backend | `npm run db:seed` | demo users and 40 patients |
| frontend | `npm run dev` | web app with reload |
| frontend | `npm test` | patient form tests |

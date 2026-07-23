# Library Management System

A full-stack library management system with two roles — **Librarian** and
**Student** — covering the whole lending lifecycle: catalogue search, issuing
and returning books, renewals, fines, and a reservation queue.

## Stack

- **Frontend:** React (Vite) + Tailwind CSS + React Router — plain JavaScript, no TypeScript.
- **Backend:** Node.js + Express — plain JavaScript, no TypeScript.
- **Database:** PostgreSQL via Prisma ORM.
- **Auth:** JWT in an httpOnly cookie, bcrypt password hashing, role-based middleware.
- **Validation:** zod on every API input.
- **Tests:** Vitest, covering the business-rules module.

Monorepo layout: `/client` (frontend) and `/server` (backend), installed and
run independently.

## Setup

Prerequisites: Node 18+, a running PostgreSQL instance (local, Docker, or a
hosted provider like Neon/Supabase).

```bash
# 1. Server
cd server
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev    # creates the schema
node prisma/seed.js       # loads demo data (see credentials below)
npm run dev                # http://localhost:4000

# 2. Client (separate terminal)
cd client
npm install
npm run dev                # http://localhost:5173
```

Open http://localhost:5173 and log in with one of the demo accounts below.
The Vite dev server proxies `/api` to the Express server, so both must be
running.

Run the business-rules test suite:

```bash
cd server
npm test
```

## Deployment

Deployed as three separate services — a Postgres database (Neon), the
Express API (Render), and the static Vite build (Vercel) — connected in
that order, since each later step needs a URL/connection string from the
one before it.

**1. Database — Neon**

Create a free Neon project and copy its connection string (Neon appends
`?sslmode=require`, which Prisma needs — keep it). You'll paste this into
Render's environment variables in the next step.

**2. Server — Render**

Create a **Web Service** from the GitHub repo, root directory `server`:

| Setting | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Environment variables | `DATABASE_URL` (from Neon), `JWT_SECRET` (long random string), `LIBRARIAN_SIGNUP_KEY`, `CLIENT_ORIGIN` (your Vercel URL, added after step 3), `PORT` (Render sets this automatically — don't override it) |

`npm run build` runs `prisma generate && prisma migrate deploy`, applying
committed migrations to the Neon database — it does not create new
migrations or touch data beyond that. Once the service is live, run the
seed script **once**, from your machine, pointed at the Neon connection
string, if you want the same demo data as local dev:

```bash
cd server
DATABASE_URL="<neon connection string>" node prisma/seed.js
```

`node prisma/seed.js` **wipes and recreates all data** — never run it
against a database that has real users on it.

**3. Client — Vercel**

Create a project from the same GitHub repo, root directory `client`
(Vercel auto-detects the Vite build command/output). Before deploying,
edit [`client/vercel.json`](client/vercel.json) and replace the
placeholder `destination` with your actual Render URL — this is what
proxies `/api/*` requests to the backend so the browser only ever talks
to one origin (your Vercel domain), which keeps the httpOnly auth cookie
working without cross-site cookie configuration.

After the first deploy, go back to Render and set `CLIENT_ORIGIN` to the
Vercel URL, then redeploy the server so CORS reflects the real origin.

## Demo login credentials

Seeded by `server/prisma/seed.js` — running it wipes and recreates all data.

| Role      | Email                     | Password        |
|-----------|---------------------------|-----------------|
| Librarian | librarian1@library.com    | Librarian@123   |
| Librarian | librarian2@library.com    | Librarian@123   |
| Student   | student1@library.com … student10@library.com | Student@123 |

The seed data includes a deliberate mix of active, overdue, and returned
rentals, paid and unpaid fines, and a reservation queue, so every screen has
something to show on first load. Notably:

- **student1** (Alice) — clean standing, 2 active rentals.
- **student3** (Carol) — has an overdue rental, blocked from borrowing/renewing.
- **student4** (David) — has an unpaid fine, blocked from borrowing/renewing.
- **student6** (Farhan) — active rental already renewed once (renew disabled).
- **student7** (Gita) — fresh account, nothing borrowed yet.
- **student8** (Harish) & **student9** (Isha) — both queued (`WAITING`) on the
  same fully-issued title; Isha also has a `READY` reservation waiting for
  pickup.
- **student10** (Jatin) — a deactivated account, to demo the login block.

## Business rules

All tunable constants and eligibility logic live in one place:
[`server/src/rules.js`](server/src/rules.js). Nothing enforces these on the
client — every write route re-derives eligibility server-side, so the UI
disabling a button is only ever a hint.

| Rule | Value |
|---|---|
| Max active rentals per student | 3 (returned rentals never count) |
| Loan period | 14 days |
| Renewal extension | 7 days |
| Max renewals per rental | 1 |
| Fine | ₹5 per day late |

- A rental can only be renewed if it isn't overdue, hasn't already hit the
  renewal limit, and no other student is waiting on that title.
- A student with *any* overdue rental or unpaid fine anywhere in their
  account is blocked from borrowing, renewing, **and** reserving.
- `dueDate` is always computed on the server (`issueDate + 14 days`, or
  `dueDate + 7 days` on renewal) — the client can never set it directly.
- Returning a book is a single database transaction: it closes the rental,
  frees the copy, files a fine if late, and promotes the oldest waiting
  reservation on that title to `READY` with a 48-hour pickup window.
- Issuing and returning are librarian-only actions (a physical handover
  needs a librarian to confirm it); renewing and reserving are
  student-initiated.
- If a title has any open (`WAITING`/`READY`) reservations, an available
  copy can only be issued to one of those reserved students — never to a
  student with no reservation on that title. It does *not* have to be
  whoever reserved first: a no-show shouldn't block the line, so a
  librarian can issue to any reserved student who actually shows up. The
  librarian dashboard's Reservations page has a one-click "Allot" button
  for this; it just skips the manual student/copy search, it isn't a
  separate rule.
- Public self-registration (`/register`) only ever creates `STUDENT`
  accounts. Librarian self-signup is a separate page/endpoint
  (`/register-librarian`) gated by a shared secret, `LIBRARIAN_SIGNUP_KEY`,
  checked server-side only — it's never sent to the browser and must be
  set in `server/.env` (see `.env.example`) for librarian signup to work at
  all. Share that key out-of-band with actual library staff only.

## API

REST endpoints under `/api`, grouped by domain:

- `auth` — register (student self-signup), register-librarian (key-gated), login, logout, me
- `books`, `copies` — librarian-only CRUD, including marking a copy lost/damaged
- `catalogue` — search by title/author/ISBN/category (both roles)
- `rentals` — issue, barcode lookup + return (librarian); renew, my-rentals, history (student); overdue report + CSV export (librarian)
- `reservations` — reserve, my reservations with queue position (student)
- `fines` — my fines (student), collect (librarian)
- `students` — list, activate/deactivate (librarian)
- `reports` — dashboard stats, activity log (librarian)

Every response is shaped `{ data: ... }` on success or `{ error: { message, details? } }`
on failure, with the matching HTTP status code.

## Project structure

```
library-management/
  server/
    prisma/            schema, migrations, seed script
    src/
      rules.js           business-rule constants + pure eligibility checks
      app.js              Express app assembly
      index.js            entrypoint
      lib/                shared Prisma client, auth/JWT helpers, standing checks
      middleware/         auth, role gating, error handling
      routes/              one file per domain area
    test/
      rules.test.js       Vitest unit tests for rules.js
  client/
    src/
      pages/librarian/    dashboard, books, students, activity log
      pages/student/       my rentals, catalogue, reservations, fines, history
      components/          shared UI (Layout, cards, forms, panels)
      lib/                 API client, auth context
```

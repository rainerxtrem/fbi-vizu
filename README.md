# Federal Bureau of Investigation (FBI) — Portail

A full-stack federal investigations portal for a GTA RP server. The **UI is in
French**; rank titles and a fixed set of institutional terms (Most Wanted,
Special Agent, Agent, Case Number, Field Office, Submit a Tip, Apply, At Large,
Captured, Seeking Information…) stay in English. Two experiences in one
application:

- **Public site** (`/`) — an institutional government-style portal: Most Wanted,
  investigations, newsroom, careers, tip submission, about/contact.
- **Agent console** (`/agent`) — an authenticated investigative workspace:
  case management, suspects, evidence, Most Wanted workflow, applications, tips,
  agent administration, and a tamper-evident audit log.

> The FBI is a **fictional agency**. All names, cases, and content are invented
> for role-play. Nothing here is affiliated with any real agency.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS, Lucide icons, Recharts |
| DB | PostgreSQL |
| ORM | Prisma |
| Auth | Custom JWT session (`jose`) in an httpOnly cookie, bcrypt password hashing |
| Files | Local filesystem (`/public/uploads`), S3-swappable via `src/lib/storage.ts` |

## Local development

```bash
npm install
cp .env.example .env          # set DATABASE_URL + AUTH_SECRET (32+ chars)
npx prisma db push            # create the schema
npm run db:seed               # load demo data
npm run dev
```

Open http://localhost:3000 (public) and http://localhost:3000/agent/login.

### Demo accounts

All seeded users share the password **`Password123!`**.

| Role | Email |
| --- | --- |
| Director | `d.reyes@fbi.gov` |
| Special Agent in Charge | `j.mercer@fbi.gov` |
| Supervisory Special Agent | `t.boone@fbi.gov` |
| Special Agent | `c.duval@fbi.gov` |
| New Agent Trainee | `n.frost@fbi.gov` |
| Platform Admin (technical) | `admin@fbi.gov` |

## Architecture

```
src/
  app/
    (public)/            public institutional site
    agent/
      login/             unauthenticated sign-in
      (console)/         authenticated console (guarded by layout)
    api/                 REST API (auth, investigations, most-wanted, tips, …)
  components/
    ui/                  design-system primitives (button, card, toast, …)
    public/              public-site components
    agent/               console components (sidebar, charts, forms, …)
  lib/
    rbac.ts              ranks, permissions, data-visibility rules
    auth.ts              session → Actor, server guards
    access.ts            per-record investigation access (anti-IDOR)
    db.ts / session.ts / audit.ts / storage.ts / validation.ts / ids.ts
  middleware.ts          same-origin (CSRF) guard for mutating API calls
prisma/
  schema.prisma          relational model
  seed.ts                demo data
scripts/release.mjs      deploy step: db push + conditional seed
```

### RBAC

12-level agent hierarchy (`NAT → SA → Senior SA → SSA → ASAC → SAC → AD → AEAD →
EAD → ADD → DD → Director`) plus an independent **Admin** platform role.
Permissions are granular (`investigation.create`, `mostwanted.publish`,
`agents.promote`, …), derived from rank, and adjustable per-agent by an Admin
(grant/revoke overrides). **Every permission is checked server-side.** Data
visibility additionally depends on rank + assignment + field office +
classification — see `canViewInvestigation` / `investigationVisibilityFilter`.

### Security

- bcrypt password hashing, httpOnly + `SameSite=Lax` session cookie, 8h expiry
- Session revocation: `User.tokenVersion` in the JWT; bumped on password change,
  agent suspension, or "sign out everywhere"
- Server-side permission checks on every private route + record-level access
  checks (changing an ID in the URL returns 404)
- Rank → permission baseline is code-owned; the Director tunes it per rank at
  `/agent/roles` (stored as `RolePermissionOverride`)
- Same-origin enforcement for mutating API requests (CSRF)
- In-memory rate limiting on auth, tips, applications, uploads, agent creation,
  person search, trash actions
- Zod input validation, file type/size validation on upload
- Uploaded files are **never served statically** — `/uploads/*` is blocked and
  every file goes through `GET /api/files/[id]`, which checks the caller against
  the file's evidence / document / tip / application link
- Content-Security-Policy + security headers (`next.config.mjs`)
- Append-only audit log; no UI or API path deletes audit rows
- Soft delete (`deletedAt`) on investigations, persons, evidence, warrants,
  arrests — recoverable from `/agent/trash`

## Deployment (Railway)

1. Create a project and add a **PostgreSQL** database (persistent volume-backed).
2. Deploy this repo. Railway runs `npm run build`, then
   `node scripts/release.mjs && npm run start` (see `railway.json`).
3. Set environment variables on the app service:
   - `DATABASE_URL` → reference the Postgres service (`${{Postgres.DATABASE_URL}}`)
   - `AUTH_SECRET` → a 32+ character random string
   - `NEXT_PUBLIC_SITE_URL` → the app's public URL
   - `SEED_DATABASE` → `true` for the first deploy (auto-seeds an empty DB),
     then `false`. `force` wipes and re-seeds; in production it is ignored
     unless `ALLOW_DESTRUCTIVE_SEED=yes` is also set for that deploy.
   - `UPLOAD_DIR` *(optional)* → absolute path for uploaded files. Defaults to
     `public/uploads`; set it to a non-public path (e.g. `/app/data/uploads`)
     and mount the volume there for defence in depth.
4. Add a volume for persistent file uploads, mounted at whatever `UPLOAD_DIR`
   points to (default `/app/public/uploads`), or wire `src/lib/storage.ts` to
   S3-compatible storage.

### Backups

`prisma db push` is used instead of migrations for simplicity; switch to
`prisma migrate deploy` + committed migrations for a production workflow.

Soft delete protects against operator mistakes, **not** against losing the
Postgres volume. Schedule a `pg_dump` to object storage (Railway cron or an
external job) and test a restore periodically.

`scripts/release.mjs` also creates the `pg_trgm` search indexes and purges read
notifications older than 60 days on every deploy.

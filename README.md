# FinPilot AI

Self-hosted personal finance tracking with AI-powered analysis and a local SQLite/libSQL data model.

---

## Features

- Dashboard analytics for spending, categories, and trends
- Transaction management with account and category ownership checks
- CSV import workflow with row and size limits
- AI chat powered by Anthropic using authenticated user-scoped tools
- Better Auth email/password authentication with admin role enforcement
- Admin overview, users, analytics, imports, audit log, and health surfaces

---

## Current architecture

- Next.js 16.2.6
- React 19.2.4
- TypeScript 5
- Better Auth 1.6.11
- SQLite/libSQL locally and PostgreSQL in production via Drizzle ORM
- tRPC API with protected and admin procedures
- Anthropic via the Vercel AI SDK

Local database default:
- `DATABASE_URL=./data/finpilot.db`
- file-backed SQLite under the `data/` directory

Production guidance:
- Local development uses `./data/finpilot.db`.
- Render production uses PostgreSQL through the `DATABASE_URL` environment variable.
- The selected Drizzle dialect, schema, and Better Auth adapter follow the `DATABASE_URL` protocol.

---

## Quick start

### Prerequisites

- Node.js 20+
- npm

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

```bash
cp .env.example .env.local
```

Required values:

```bash
DATABASE_URL=./data/finpilot.db
BETTER_AUTH_SECRET=<generate-a-32-byte-secret>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
```

### 3) Initialize the database

```bash
npm run db:push
```

### 4) Optional demo seed

```bash
npm run db:seed
```

### 5) Run the app

```bash
npm run dev
```

Open http://localhost:3000

---

## Render deployment

Create a Render PostgreSQL database and attach its Internal Database URL to the web service as `DATABASE_URL`. Do not upload `data/finpilot.db`; it is local development data and is ignored by Git.

Build command:

```text
npm install && npm run build
```

Start command:

```text
npm start
```

Required Render environment variables:

```text
DATABASE_URL=<Render PostgreSQL Internal Database URL>
BETTER_AUTH_SECRET=<long random production secret>
BETTER_AUTH_URL=https://<your-service>.onrender.com
NEXT_PUBLIC_APP_URL=https://<your-service>.onrender.com
ANTHROPIC_API_KEY=<server-only Anthropic key>
NODE_ENV=production
```

Before the first production start, run the safe migration command from a deployment shell with the production `DATABASE_URL`:

```bash
npm run db:migrate
```

The health check endpoint is `/api/health`. Provision the first admin through the application and promote the account using the protected admin workflow; no email address is hardcoded as an authorization rule.

The existing Docker Compose file remains a local SQLite deployment option:

```bash
docker compose up --build -d
```

The container mounts the local `data/` directory to preserve the SQLite database between restarts.

---

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint check
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — apply migrations for the dialect selected by `DATABASE_URL`
- `npm run db:push` — quick schema sync for local development
- `npm run db:seed` — seed demo data
- `npm run db:studio` — inspect local SQLite database

---

## Backup and restore

Back up the SQLite file without shutting down the app if the database is idle, or stop the app before copying for a consistent snapshot:

```bash
cp ./data/finpilot.db ./data/finpilot-backup.db
```

Restore:

```bash
cp ./data/finpilot-backup.db ./data/finpilot.db
```

For containerized deployments, back up the mounted `data` directory or copy the db file from inside the container.

---

## Security notes

- Secrets must be stored in environment variables and never committed.
- The AI API key remains server-only; it is not exposed to the browser bundle.
- User-scoped database queries are enforced by authenticated IDs and ownership checks.
- Admin routes require an authenticated admin session.

---

## License

MIT

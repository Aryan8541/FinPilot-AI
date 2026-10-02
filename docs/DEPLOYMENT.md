# Deployment Guide

This project currently uses SQLite/libSQL for local and containerized hosting. The active deployment model is a single-instance app with a persistent file-backed database, not PostgreSQL.

---

## Architecture

- Framework: Next.js 16
- Database: SQLite via @libsql/client and Drizzle ORM
- Auth: Better Auth
- AI: Anthropic via the Vercel AI SDK
- Deployment target: a Node process with persistent filesystem storage

The default database path is:

```bash
./data/finpilot.db
```

This is intentionally file-backed so the app can run in Docker or a VM with a mounted volume.

---

## Required environment variables

Create a `.env.local` or `.env` file based on `.env.example`:

```bash
DATABASE_URL=./data/finpilot.db
BETTER_AUTH_SECRET=<generate-a-strong-random-secret>
BETTER_AUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=production
```

For local development, `http://localhost:3000` is fine.

---

## Docker deployment

The included `docker-compose.yml` mounts a persistent `./data` directory for the SQLite database.

```bash
docker compose up --build -d
```

The app should run on port 3000 and the database stays on disk because of the volume mount.

---

## Bare metal deployment

1. Install Node.js 20+
2. Install dependencies: `npm install`
3. Configure `.env.local`
4. Run the schema sync: `npm run db:push`
5. Start the app: `npm run start`

Example:

```bash
npm install
npm run build
npm run db:push
npm run start
```

---

## Migrations and schema updates

Use Drizzle for schema changes:

```bash
npm run db:generate
npm run db:migrate
```

For local development and quick schema alignment, `npm run db:push` is also supported. Do not run destructive resets in production.

---

## Backup and restore

### SQLite backup

```bash
cp ./data/finpilot.db ./data/finpilot-backup.db
```

### Restore

```bash
cp ./data/finpilot-backup.db ./data/finpilot.db
```

For a consistent snapshot, stop the app before copying the database file.

---

## Security notes

- Keep `BETTER_AUTH_SECRET` in environment variables only.
- Use HTTPS in production and set `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` to the public domain.
- Avoid exposing secrets in logs or client bundles.
- Keep the `data/` directory on a persistent, backed-up volume.
- If a deployment requires multi-node writes or very high concurrency, move to a managed database intentionally rather than silently changing the architecture.

---

## Operational checks

- Health endpoint: `/api/health`
- Admin health dashboard: `/admin/health`
- AI configuration status is reported without exposing the API key.

---

## Troubleshooting

- Missing login/session issues: check `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
- Database unreadable: verify `DATABASE_URL` points to a valid SQLite file or file path.
- AI route failing: verify `ANTHROPIC_API_KEY` is set in the server environment.
- Build failures: ensure the app is started with all required env vars and Node 20+.

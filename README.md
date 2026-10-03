# FinPilot-AI

FinPilot-AI is a personal finance management application for tracking accounts, transactions, categories, spending patterns, and financial trends in one authenticated workspace. It also provides an AI financial assistant that answers questions using fixed, user-scoped financial tools rather than unrestricted database access.

The project is designed as a single Next.js application:

- SQLite is used for local development.
- PostgreSQL is used for Render production.
- Better Auth manages email/password authentication and sessions.
- Drizzle ORM provides the database schemas, queries, and migrations.
- OpenRouter is the only external AI provider.

## Table of contents

- [Project overview](#project-overview)
- [Core features](#core-features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Authentication and authorization](#authentication-and-authorization)
- [AI assistant](#ai-assistant)
- [Local development](#local-development)
- [Database workflows](#database-workflows)
- [Production deployment](#production-deployment)
- [Environment variables](#environment-variables)
- [Repository structure](#repository-structure)
- [Operational and security notes](#operational-and-security-notes)
- [Validation](#validation)

## Project overview

FinPilot-AI solves a practical personal-finance workflow: users can record or import financial activity, organize it by account and category, inspect trends, and ask questions about their own data.

The application is multi-user. Financial records are associated with a user ID, and server-side queries apply ownership checks before returning or changing records. The dashboard combines database-backed analytics with charts, while the AI chat route exposes a deliberately limited set of read-oriented financial tools.

The major architectural idea is to keep the application in one deployable TypeScript codebase while separating responsibilities:

1. Next.js renders the web application and exposes server routes.
2. Better Auth authenticates users and manages sessions.
3. tRPC handles typed application operations.
4. Drizzle maps those operations to SQLite or PostgreSQL.
5. OpenRouter provides model access only from the server-side chat route.

## Core features

### Authentication and user accounts

- Email/password registration and login through Better Auth.
- Cookie-backed sessions with protected application routes.
- User profile fields including name, email, email verification status, image, and role.
- Logout from the primary navigation.

### Financial records

- User-owned financial accounts with checking, savings, credit, cash, investment, and currency fields.
- User-owned income and expense categories with names, colors, icons, and types.
- Transactions with amount, date, description, account, category, and recurring status.
- Create, edit, delete, filter, and search workflows for transactions.
- Account and category ownership checks in server procedures.

### CSV import

- Upload and map CSV columns to transaction fields.
- CSV parsing with header normalization and row-level parse errors.
- Input limits of 5,000 rows and 1,000,000 bytes.
- Import validation before transaction insertion.
- Import history with successful and failed row counts.

### Dashboard and analytics

- Current account balance summary.
- Monthly income, expenses, and net movement.
- Six-month income/expense trend visualization.
- Current-month spending breakdown by category.
- Category bar and spending pie visualizations.
- Recent transaction activity.
- A calculated financial-health summary and activity insights.

### AI financial assistant

- Streaming chat UI at `/chat`.
- OpenRouter model access through the Vercel AI SDK.
- User-scoped tools for:
  - financial summaries
  - transaction lists
  - spending by category
  - monthly trends
  - account balances
  - transaction search
  - recurring transactions
- A server-side system prompt that requires tools for data questions and prohibits invented financial data.
- Existing tool authorization is preserved by passing the authenticated user ID into every tool execution.

### Administration

- Admin-only layout and tRPC procedures.
- User list and role management.
- Protection against removing the final administrator.
- Aggregate counts for users, accounts, categories, transactions, imports, and chat messages.
- Import and audit-log queries.
- AI configuration and application health status for administrators.

### User experience

- Responsive desktop and mobile navigation.
- Light, dark, and system theme support.
- Reusable Tailwind-based UI components.
- Recharts visualizations.
- Toast infrastructure through Sonner.
- Loading, empty, retry, and error states in major application views.

## Technology stack

| Layer | Technology | Why it is used |
| --- | --- | --- |
| Application framework | Next.js 16 App Router | Provides the full-stack web application, server routes, layouts, and production build. |
| Language | TypeScript | Gives the UI, server procedures, schemas, and AI tools static type checking. |
| UI | React 19 | Implements interactive pages and client components such as the chat and forms. |
| Styling | Tailwind CSS 4 | Supplies utility-based responsive styling and the project design system. |
| Authentication | Better Auth | Provides email/password authentication, sessions, and the user/account/verification model. |
| API/RPC | tRPC | Exposes typed protected and admin procedures to the client without duplicating request contracts. |
| ORM | Drizzle ORM | Defines dialect-specific schemas and provides typed relational queries and migrations. |
| Local database | SQLite via `@libsql/client` | Keeps local development simple and file-backed at `data/finpilot.db`. |
| Production database | PostgreSQL via `postgres` | Provides the Render production persistence layer. |
| AI SDK | Vercel AI SDK | Handles model messages, streaming responses, tool definitions, and UI message transport. |
| AI provider | OpenRouter | Provides the single server-side model gateway using its OpenAI-compatible API. |
| Charts | Recharts | Renders dashboard trend, pie, and category visualizations. |
| Validation | Zod | Validates tRPC inputs, CSV mappings, and AI tool parameters. |
| CSV parsing | Papa Parse | Parses uploaded CSV text with headers and parse errors. |
| Dates | date-fns | Performs date ranges, month boundaries, formatting, and recurring-data calculations. |
| Notifications | Sonner | Provides the application toast notification infrastructure. |
| Testing | Vitest | Supports the repository's unit-test setup, including CSV parser tests. |

## Architecture

```mermaid
flowchart TD
    Browser[Browser / React UI] --> Next[Next.js App Router]
    Next --> Auth[Better Auth]
    Next --> Chat[/api/chat]
    Next --> RPC[tRPC route]
    RPC --> Procedures[Protected and admin procedures]
    Procedures --> Drizzle[Drizzle ORM]
    Drizzle --> SQLite[(SQLite: data/finpilot.db)]
    Drizzle --> PostgreSQL[(PostgreSQL: Render)]
    Chat --> Provider[Server-side OpenRouter provider]
    Provider --> OpenRouter[OpenRouter API]
    OpenRouter --> Model[OPENROUTER_MODEL]
    Chat --> Tools[Fixed financial tools]
    Tools --> Drizzle
```

### Database selection

The database protocol is selected from `DATABASE_URL`:

- A path such as `./data/finpilot.db` uses the SQLite schema and libSQL client.
- A `postgres://` or `postgresql://` URL uses the PostgreSQL schema and `postgres` client.
- In production, a missing `DATABASE_URL` throws an error instead of silently creating a local SQLite database.

Drizzle Kit applies the same selection to configuration:

- Local SQLite: `server/db/schema.sqlite.ts` and the SQLite migration directory.
- PostgreSQL: `server/db/schema.postgres.ts` and `server/db/migrations/postgres`.

### Request boundaries

- Pages under `app/(app)` require a Better Auth session.
- The `/api/chat` route checks the session before constructing the AI request.
- tRPC `protectedProcedure` checks authentication.
- tRPC `adminProcedure` additionally requires `user.role === "admin"`.
- Database queries use the authenticated user ID for ownership filtering.

## Data model

The active schemas are maintained in parallel for SQLite and PostgreSQL while exposing the same application entities:

| Table | Purpose |
| --- | --- |
| `users` | Better Auth users plus the application role. |
| `session` | Better Auth sessions and expiry data. |
| `auth_account` | Better Auth provider and password credentials. |
| `verification` | Better Auth verification records. |
| `accounts` | User-owned financial accounts and balances. |
| `categories` | User-owned income and expense categories. |
| `transactions` | User-owned account activity. |
| `chat_sessions` | User chat session metadata. |
| `chat_messages` | Chat message content and structured tool/chart data. |
| `import_logs` | CSV import results and error metadata. |
| `admin_audit_logs` | Administrative actions and metadata. |

The PostgreSQL schema uses PostgreSQL-native types where appropriate, including `numeric(18, 2)`, `boolean`, `jsonb`, and timezone-aware timestamps. Foreign keys enforce ownership relationships and configured cascade/restrict behavior.

## Authentication and authorization

Better Auth is configured in `server/auth.ts` with the Drizzle adapter. The adapter maps the Better Auth models to the project's `users`, `session`, `auth_account`, and `verification` tables.

Passwords are handled by Better Auth and stored as credentials in the auth account table as hashes. FinPilot application code does not print or compare plaintext passwords.

Authorization is enforced at multiple layers:

- Protected page layouts redirect unauthenticated users to `/login`.
- Protected tRPC procedures reject unauthenticated requests.
- Admin procedures reject non-admin users.
- Financial queries filter by `userId`.
- Account and category references are checked against the current user before transaction operations.

## AI assistant

OpenRouter is the only AI provider:

```text
Chat UI
  -> /api/chat
  -> Vercel AI SDK
  -> OpenRouter provider
  -> https://openrouter.ai/api/v1
  -> OPENROUTER_MODEL
```

The provider is centralized in `server/ai/provider.ts`:

- Base URL: `https://openrouter.ai/api/v1`
- API key: `OPENROUTER_API_KEY`
- Model: `OPENROUTER_MODEL`, defaulting to `openrouter/free`

The API key is read only by server-side code. There is no `NEXT_PUBLIC_OPENROUTER_API_KEY`, and the key is not returned by health checks or chat responses.

The chat route preserves the existing streaming and tool-calling architecture:

1. The client sends UI messages to `/api/chat`.
2. The route verifies the Better Auth session.
3. The route converts messages to model messages.
4. Fixed Zod-defined tools are attached to the request.
5. Each tool receives the authenticated user ID.
6. The response streams back through the AI SDK UI message transport.

The model cannot issue arbitrary SQL or directly access the database. It can only invoke the audited functions in `server/ai/tools.ts`.

## Local development

### Prerequisites

- Node.js 20 or newer
- npm

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env.local` and provide local values. The local database should remain:

```text
DATABASE_URL=./data/finpilot.db
```

The AI variables are documented below. The OpenRouter key must be supplied through the environment and must not be committed.

### Initialize and run

```bash
npm run db:push
npm run dev
```

Open `http://localhost:3000`, register a user, and use the application routes.

The optional seed creates demo data and a demo user. It is intended for local development only:

```bash
npm run db:seed
```

## Database workflows

| Command | Use |
| --- | --- |
| `npm run db:push` | Synchronize the local SQLite schema during development. |
| `npm run db:generate` | Generate a Drizzle migration from schema changes. |
| `npm run db:migrate` | Apply migrations for the dialect selected by `DATABASE_URL`. |
| `npm run db:check-auth` | Read-only PostgreSQL authentication diagnostic; refuses SQLite URLs. |
| `npm run db:studio` | Open Drizzle Studio using the selected database configuration. |
| `npm run db:seed` | Create local demo authentication and financial data; do not use automatically in production. |

For an empty Render PostgreSQL database, run `npm run db:migrate` manually after confirming the production `DATABASE_URL`. Do not run `db:push` against production, and do not run the seed unless production demo data is explicitly required.

## Production deployment

The deployed model is a Render Web Service backed by Render PostgreSQL:

1. Configure the Render service environment variables.
2. Build with `npm install && npm run build`.
3. Apply the PostgreSQL migration with `npm run db:migrate`.
4. Start with `npm start`.

Production must use the PostgreSQL Internal Database URL in `DATABASE_URL`. The local `data/finpilot.db` file is ignored by Git and must not be uploaded or used as production persistence.

The repository also includes a Docker Compose configuration for a local/containerized SQLite deployment. It mounts `./data` so the local database persists across container restarts.

## Environment variables

### Database and authentication

```text
DATABASE_URL=./data/finpilot.db
BETTER_AUTH_SECRET=<server-only random secret>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

For Render, replace `DATABASE_URL`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL` with the production values and use a production-only `BETTER_AUTH_SECRET`.

### AI configuration

Required:

```text
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
```

- `OPENROUTER_API_KEY` is a private server-side API key.
- `OPENROUTER_MODEL` selects the OpenRouter model used by the chat route.
- `openrouter/free` is the initial development configuration.
- Supply the actual key through local or deployment environment variables.
- Never commit API keys, place them in source code, or expose them through a `NEXT_PUBLIC_` variable.

Render requires `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in addition to the database and Better Auth variables. Values are entered manually in Render; no secret belongs in this repository.

## Repository structure

```text
app/
  (auth)/                 Login and registration pages
  (app)/                  Authenticated finance application pages
  admin/                  Admin-only pages
  api/auth/[...all]/      Better Auth handler
  api/chat/               Streaming OpenRouter chat route
  api/health/             Database, auth, and AI configuration health route
components/
  charts/                 Recharts dashboard visualizations
  chat/                   Chat message presentation
  nav/                    Responsive application navigation
  ui/                     Reusable UI primitives
lib/
  auth-client.ts          Browser Better Auth client
  csv-parser.ts           CSV parsing and mapping helpers
  trpc-client.tsx         Browser tRPC provider
server/
  ai/provider.ts          Central OpenRouter provider configuration
  ai/system-prompt.ts     Financial assistant behavior
  ai/tools.ts              User-scoped financial tools
  db/                     Runtime database and dialect-specific schemas
  trpc/                   Application and admin procedures
scripts/
  seed.ts                 Local demo data seed
  check-production-auth.ts Read-only PostgreSQL auth diagnostic
drizzle.config.ts         Dialect-aware Drizzle Kit configuration
```

## Operational and security notes

- Keep `OPENROUTER_API_KEY`, `BETTER_AUTH_SECRET`, and database credentials in environment variables only.
- Never print or commit secret values.
- Do not expose the OpenRouter key to client-side JavaScript.
- Keep `data/finpilot.db` local and backed up separately.
- Use `npm run db:push` only for local SQLite development.
- Use `npm run db:migrate` for production PostgreSQL migrations.
- The production migration is schema-only; application user creation remains a separate operation.
- The read-only auth diagnostic reports table and credential presence without printing password hashes or credentials.
- The `/api/health` route reports AI provider/model configuration status, not the API key.

## Validation

The repository uses these checks before deployment:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The AI provider migration preserves the existing chat UI, authenticated route, streaming response format, financial tools, and user-scoped authorization. A live OpenRouter response requires a valid server-side `OPENROUTER_API_KEY` and is not performed by the build or type-check commands.

# FinPilot AI — Project Build Plan

> **Prompt for AI coding agent.** Build this project from scratch following the plan below. Every section is actionable. Do not skip steps. When ambiguity arises, default to the simplest implementation that satisfies the requirement. Ask only if blocked.

---

## 1. Project Overview

**FinPilot AI** is a self-hostable, open-source personal finance tracker with a REST API, a polished Next.js dashboard, and an AI chat interface that lets users query their financial data in natural language ("how much did I spend on groceries last month?", "what's my biggest recurring expense?").

The product solves three problems at once:
- **Privacy:** users own their data — no third-party syncing, no cloud lock-in.
- **Visibility:** a clean dashboard with charts, category breakdowns, and trend analysis.
- **Querying:** natural language access to financial data via an LLM-backed chat, removing the need to click through reports or write SQL.

Target audience: developers, indie hackers, and privacy-conscious users who want a Mint/Copilot/YNAB alternative they can self-host. Also serves as a portfolio piece demonstrating full-stack, AI-integrated engineering.

---

## 2. Core Features (MVP)

1. **Manual transaction entry** — Add/edit/delete transactions (amount, date, category, description, account). **Must-have**
2. **CSV import** — Upload bank/credit card CSVs and map columns to fields. **Must-have**
3. **Categories & accounts** — User-defined categories and accounts (checking, credit, cash, etc.). **Must-have**
4. **Dashboard** — Monthly spending overview, category breakdown (pie/bar), income vs. expense trend (line), recent transactions. **Must-have**
5. **Transaction list with filtering** — Search, filter by date range, category, account, amount. **Must-have**
6. **AI chat interface** — Natural language queries over the user's data, with streaming responses and inline chart rendering when relevant. **Must-have**
7. **Auth** — Email/password authentication, single-user or multi-user mode. **Must-have**
8. **Seed data script** — One command populates the DB with realistic sample data so the app is demo-able immediately after install. **Must-have**
9. **Dark mode** — Toggle, persisted. **Should-have**
10. **Recurring transaction detection** — Auto-flag transactions that repeat monthly. **Should-have**

---

## 3. Future Features (Post-MVP)

- Bank syncing via Plaid/Teller (US) or SaltEdge (international)
- Budget creation and tracking (e.g., "$500/month for groceries")
- Goals (savings targets, debt payoff tracking)
- Multi-currency support with exchange rate sync
- Receipt OCR (upload a photo, extract amount/date/merchant)
- Mobile app (React Native or PWA)
- Shared accounts (couples, households)
- Export to QIF/OFX
- Webhooks for transaction events
- Browser extension for quick entry
- Scheduled email reports
- Tags (in addition to categories)
- Split transactions

---

## 4. Recommended Tech Stack

- **Frontend:** Next.js 15 (App Router) + React 19 — server components for performance, modern data fetching, file-based routing.
- **UI:** Tailwind CSS + shadcn/ui — fast to build, looks professional out of the box, easy to theme.
- **Charts:** Recharts — composable, React-native, handles everything MVP needs.
- **Backend:** Next.js API routes + tRPC — single repo, type-safe end-to-end, no separate server to deploy. Avoids the overhead of a Python backend for this scope.
- **Database:** PostgreSQL — robust, free, supports the analytical queries the dashboard and chat need.
- **ORM:** Drizzle ORM — type-safe, lightweight, plays well with Postgres and TypeScript.
- **Auth:** Better Auth — modern, self-hostable, no external dependency, supports email/password out of the box.
- **AI:** Vercel AI SDK + Anthropic Claude (Sonnet for chat) — streaming responses, tool calling for structured data queries, easy provider swap if needed.
- **Hosting/Infra:** Docker + docker-compose — one command to self-host. Optional Vercel deploy for the demo instance.
- **Testing:** Vitest — unit + integration tests on critical paths (auth, CSV import, AI tool calls).
- **Other:**
 - `papaparse` for CSV parsing
 - `zod` for schema validation
 - `date-fns` for date handling
 - `lucide-react` for icons

---

## 5. High-Level Architecture

FinPilot AI is a single Next.js application with three main subsystems:

**1. Web app (Next.js App Router).** Server components render the dashboard, transaction lists, and settings pages. Client components handle interactivity (forms, charts, chat). Authentication is enforced via middleware on protected routes.

**2. API layer (tRPC).** All data operations — CRUD for transactions, categories, accounts; CSV import processing; analytics queries for the dashboard — go through tRPC routers. This gives the frontend full type safety and gives external consumers a clean REST-equivalent layer (we expose tRPC routes as HTTP endpoints for the public API).

**3. AI subsystem.** The chat UI sends user messages to a streaming endpoint that wraps Claude Sonnet. The model has access to a set of **tools** — typed functions that query the user's data (`getTransactions`, `getSpendingByCategory`, `getMonthlyTrend`, etc.). The model decides which tools to call, receives structured results, and synthesizes a response. When the result is best visualized, the model returns a chart spec that the frontend renders inline with Recharts.

**Data flow for a user adding a transaction:**
1. User submits form on `/transactions/new`
2. Client calls `trpc.transactions.create` with validated payload
3. tRPC handler authenticates session → validates with Zod → inserts via Drizzle → returns new row
4. Client invalidates dashboard query cache → UI refreshes

**Data flow for an AI chat query:**
1. User types "how much did I spend on groceries last month?"
2. Frontend POSTs to `/api/chat` with message history
3. Server initializes Claude streaming session with available tools
4. Claude calls `getSpendingByCategory({ category: "groceries", month: "2025-11" })`
5. Tool handler runs Drizzle query, returns `{ total: 487.23, transactionCount: 23 }`
6. Claude streams natural language response back to client
7. If chart is appropriate, Claude returns a structured `chartSpec` that the frontend renders below the message

**External services:** Anthropic API only. No Plaid/Teller in MVP — all data is manual or CSV-imported.

---

## 6. Data Model

| Entity | Key Fields | Relationships |
|---|---|---|
| **User** | `id` (uuid), `email` (string, unique), `passwordHash` (string), `createdAt` | Has many Accounts, Categories, Transactions, ChatSessions |
| **Account** | `id`, `userId`, `name` (string), `type` (enum: checking/savings/credit/cash/investment), `balance` (decimal), `currency` (string, default USD) | Belongs to User; Has many Transactions |
| **Category** | `id`, `userId`, `name`, `color` (hex), `icon` (string), `type` (enum: income/expense) | Belongs to User; Has many Transactions |
| **Transaction** | `id`, `userId`, `accountId`, `categoryId`, `amount` (decimal), `date` (date), `description` (string), `isRecurring` (bool), `createdAt` | Belongs to User, Account, Category |
| **ChatSession** | `id`, `userId`, `title`, `createdAt`, `updatedAt` | Belongs to User; Has many ChatMessages |
| **ChatMessage** | `id`, `sessionId`, `role` (user/assistant), `content` (text), `toolCalls` (jsonb), `chartSpec` (jsonb, nullable), `createdAt` | Belongs to ChatSession |
| **ImportLog** | `id`, `userId`, `filename`, `rowCount`, `successCount`, `errorCount`, `errors` (jsonb), `createdAt` | Belongs to User |

Decimals stored as `numeric(12,2)`. All `userId` foreign keys cascade on user delete.

---

## 7. Project Structure

```
FinPilot AI/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── README.md
├── LICENSE # MIT
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── components.json # shadcn config
├── public/
│ └── og-image.png
├── scripts/
│ ├── seed.ts # demo data generator
│ └── reset-db.ts
├── src/
│ ├── app/
│ │ ├── (auth)/
│ │ │ ├── login/page.tsx
│ │ │ └── register/page.tsx
│ │ ├── (app)/ # auth-protected layout
│ │ │ ├── layout.tsx
│ │ │ ├── dashboard/page.tsx
│ │ │ ├── transactions/
│ │ │ │ ├── page.tsx
│ │ │ │ ├── new/page.tsx
│ │ │ │ └── [id]/page.tsx
│ │ │ ├── accounts/page.tsx
│ │ │ ├── categories/page.tsx
│ │ │ ├── import/page.tsx
│ │ │ ├── chat/page.tsx
│ │ │ └── settings/page.tsx
│ │ ├── api/
│ │ │ ├── trpc/[trpc]/route.ts
│ │ │ ├── chat/route.ts # streaming AI endpoint
│ │ │ └── auth/[...all]/route.ts
│ │ ├── layout.tsx
│ │ └── page.tsx # marketing landing
│ ├── components/
│ │ ├── ui/ # shadcn components
│ │ ├── charts/
│ │ │ ├── spending-pie.tsx
│ │ │ ├── trend-line.tsx
│ │ │ └── category-bar.tsx
│ │ ├── chat/
│ │ │ ├── chat-window.tsx
│ │ │ ├── message.tsx
│ │ │ └── inline-chart.tsx
│ │ ├── transactions/
│ │ │ ├── transaction-form.tsx
│ │ │ ├── transaction-table.tsx
│ │ │ └── csv-import.tsx
│ │ └── nav/sidebar.tsx
│ ├── server/
│ │ ├── db/
│ │ │ ├── schema.ts # Drizzle schema
│ │ │ ├── index.ts # db client
│ │ │ └── migrations/
│ │ ├── trpc/
│ │ │ ├── trpc.ts
│ │ │ ├── context.ts
│ │ │ └── routers/
│ │ │ ├── _app.ts
│ │ │ ├── transactions.ts
│ │ │ ├── accounts.ts
│ │ │ ├── categories.ts
│ │ │ ├── analytics.ts
│ │ │ ├── import.ts
│ │ │ └── chat.ts
│ │ ├── ai/
│ │ │ ├── tools.ts # tool definitions for Claude
│ │ │ ├── system-prompt.ts
│ │ │ └── chart-spec.ts
│ │ └── auth.ts # Better Auth config
│ ├── lib/
│ │ ├── utils.ts
│ │ ├── csv-parser.ts
│ │ ├── recurring-detector.ts
│ │ └── trpc-client.ts
│ └── types/
│ └── index.ts
└── tests/
 ├── unit/
 │ ├── csv-parser.test.ts
 │ └── recurring-detector.test.ts
 └── integration/
 ├── transactions.test.ts
 └── chat-tools.test.ts
```

---

## 8. Development Phases

### Phase 1 — Foundation & Auth (2–3 days)
- Initialize Next.js, Tailwind, shadcn, Drizzle, Postgres via docker-compose
- Define DB schema, run first migration
- Implement Better Auth with email/password
- Build login/register pages
- Build protected `(app)` layout with sidebar nav
- **Deliverable:** running app, user can register, log in, see an empty dashboard placeholder
- **Dependencies:** none

### Phase 2 — Core CRUD (3–4 days)
- Accounts: list, create, edit, delete
- Categories: list, create, edit, delete (with color/icon)
- Transactions: list with filters, create, edit, delete
- tRPC routers + Zod schemas for all of the above
- **Deliverable:** user can fully manage their finances manually
- **Dependencies:** Phase 1

### Phase 3 — Dashboard & Analytics (2–3 days)
- Analytics tRPC router with aggregation queries
- Dashboard page: total income/expense (current month), category pie chart, monthly trend line, recent transactions table
- Date range selector
- **Deliverable:** dashboard renders real charts from real data
- **Dependencies:** Phase 2

### Phase 4 — CSV Import (2 days)
- Upload UI with drag-and-drop
- Column-mapping interface (user maps CSV columns to fields)
- Server-side parsing with `papaparse` + Zod validation
- Import log with error reporting
- **Deliverable:** user can import a real bank CSV end-to-end
- **Dependencies:** Phase 2

### Phase 5 — AI Chat (4–5 days)
- Define AI tools: `getTransactions`, `getSpendingByCategory`, `getMonthlyTrend`, `getAccountBalances`, `searchTransactions`, `getRecurringTransactions`
- System prompt with financial context and chart-spec instructions
- Streaming `/api/chat` endpoint using Vercel AI SDK + Anthropic
- Chat UI with message history, streaming text, tool-call indicators
- Inline chart rendering when model returns `chartSpec`
- Persist sessions to DB
- **Deliverable:** working conversational query interface with charts
- **Dependencies:** Phase 3

### Phase 6 — Polish & Demo Readiness (2–3 days)
- Seed script generating 12 months of realistic transactions across multiple categories and accounts
- Recurring transaction detection (heuristic: same amount ±5%, same description fuzzy-matched, monthly cadence)
- Dark mode
- Landing page (`/`) explaining the project, with screenshots
- README with install instructions, screenshots, demo credentials
- Tests on critical paths (CSV import, AI tool execution, auth)
- **Deliverable:** repo is presentable, anyone can clone + run in 5 minutes
- **Dependencies:** Phase 5

### Phase 7 — Deploy & Document (1–2 days)
- Production Dockerfile
- One-command docker-compose deploy
- Deploy a live demo instance (Vercel + Neon/Supabase Postgres, or a small VPS)
- Write blog post / case study for portfolio
- **Deliverable:** live demo URL + production-ready repo
- **Dependencies:** Phase 6

**Total estimate:** ~3 weeks of focused solo work.

---

## 9. API Endpoints

All endpoints exposed via tRPC at `/api/trpc/*`. AI chat at `/api/chat`. Auth at `/api/auth/*`.

**Transactions**
- `transactions.list({ filters })` — list with filters · Auth: Yes
- `transactions.get({ id })` — single transaction · Auth: Yes
- `transactions.create({ ...fields })` · Auth: Yes
- `transactions.update({ id, ...fields })` · Auth: Yes
- `transactions.delete({ id })` · Auth: Yes

**Accounts**
- `accounts.list()` · Auth: Yes
- `accounts.create({ name, type, balance })` · Auth: Yes
- `accounts.update({ id, ...fields })` · Auth: Yes
- `accounts.delete({ id })` · Auth: Yes

**Categories**
- `categories.list()` · Auth: Yes
- `categories.create({ name, color, icon, type })` · Auth: Yes
- `categories.update({ id, ...fields })` · Auth: Yes
- `categories.delete({ id })` · Auth: Yes

**Analytics**
- `analytics.dashboard({ dateRange })` — totals + breakdowns · Auth: Yes
- `analytics.spendingByCategory({ dateRange })` · Auth: Yes
- `analytics.monthlyTrend({ months })` · Auth: Yes
- `analytics.recurring()` — detected recurring transactions · Auth: Yes

**Import**
- `import.preview({ csvText })` — parse + return rows for mapping · Auth: Yes
- `import.commit({ rows, mapping })` — insert validated rows · Auth: Yes

**Chat**
- `POST /api/chat` — streaming endpoint, accepts `{ messages, sessionId? }` · Auth: Yes
- `chat.listSessions()` · Auth: Yes
- `chat.getSession({ id })` · Auth: Yes
- `chat.deleteSession({ id })` · Auth: Yes

**Auth (Better Auth)**
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-out`
- `GET /api/auth/session`

---

## 10. Key Technical Decisions & Trade-offs

**Next.js full-stack over Next.js + separate Python API.** Earlier draft considered a Python backend to mirror the Loganix BI dashboard pattern. Rejected — for a portfolio project, splitting into two services adds deployment friction and doesn't demonstrate anything new. A single TypeScript codebase is faster to build, easier to self-host (one container), and the AI tools layer works just as well in Node.

**tRPC over REST or GraphQL.** End-to-end type safety eliminates an entire class of bugs and removes the need for OpenAPI specs. The "REST API" benefit is preserved because tRPC procedures can be called over HTTP — for users who want to integrate, we document the endpoints in the README. GraphQL would be overkill for this data shape.

**Drizzle over Prisma.** Lighter, faster, fewer build-time surprises, and the SQL-like API makes the analytical queries (which are core to this app) more natural to write. Prisma's generated client is heavier than this project needs.

**Claude tool calling over RAG or text-to-SQL.** RAG doesn't fit — financial data isn't documents. Text-to-SQL works but exposes a footgun (model writes bad SQL, queries fail or worse). Defining a fixed set of typed tools constrains the model to safe, audited query paths and gives much more predictable results. This is the same pattern used in the SPP MCP Server work.

**Manual entry + CSV over Plaid integration.** Plaid requires US-only data, vendor approval, and ongoing API costs. For MVP and as a portfolio piece, manual + CSV import covers the demo case and works internationally. Plaid is the obvious post-MVP add.

---

## 11. Risks & Open Questions

- **AI cost on demo instance.** If the live demo gets traffic, Anthropic API costs accumulate. Mitigation: rate-limit chat endpoint by IP, cap tokens per response, consider a "bring your own API key" mode for the demo.
- **CSV format chaos.** Bank CSVs vary wildly. The column-mapping UI handles this, but edge cases (multi-line descriptions, weird date formats, currency symbols in amount fields) will appear. Plan to iterate on the parser based on real CSVs.
- **Recurring detection is heuristic.** Won't be perfect. Acceptable for MVP — surface detected ones as suggestions the user can confirm/reject, don't auto-flag without review.
- **Single-tenant vs. multi-tenant decision.** Plan assumes multi-user from the start (each user's data isolated by `userId`). This is more useful for self-hosting in households and adds negligible complexity. Confirmed.
- **Self-host complexity for non-developers.** Docker-compose lowers the bar but doesn't eliminate it. A one-click deploy template (Railway, Coolify) is a future add.

---

## 12. Implementation Checklist

- [ ] Initialize Next.js 15 project with TypeScript, App Router
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure shadcn/ui (button, input, card, dialog, select, table, toast, etc.)
- [ ] Set up docker-compose.yml with Postgres service
- [ ] Install Drizzle ORM + drizzle-kit
- [ ] Define schema for User, Account, Category, Transaction, ChatSession, ChatMessage, ImportLog
- [ ] Generate and run initial migration
- [ ] Configure Better Auth with email/password adapter
- [ ] Build `/login` and `/register` pages
- [ ] Build auth middleware protecting `(app)` routes
- [ ] Build sidebar navigation component
- [ ] Set up tRPC server + client with React Query
- [ ] Implement `accounts` router (CRUD)
- [ ] Build accounts management page
- [ ] Implement `categories` router (CRUD) with seed of default categories on user signup
- [ ] Build categories management page
- [ ] Implement `transactions` router (CRUD + filtered list)
- [ ] Build transactions table with filters (date, category, account, search)
- [ ] Build transaction create/edit form
- [ ] Implement `analytics` router (dashboard, spendingByCategory, monthlyTrend, recurring)
- [ ] Build dashboard page with Recharts components (pie, line, bar)
- [ ] Build CSV upload component with drag-and-drop
- [ ] Build column-mapping UI
- [ ] Implement `import` router with papaparse + Zod validation
- [ ] Build import log / error review screen
- [ ] Define AI tools in `server/ai/tools.ts` with Zod schemas
- [ ] Write system prompt covering tool usage and chart-spec format
- [ ] Implement `/api/chat` streaming endpoint with Vercel AI SDK + Anthropic
- [ ] Build chat UI with streaming, message history, tool-call indicators
- [ ] Build inline chart rendering from chartSpec
- [ ] Persist chat sessions and messages to DB
- [ ] Build chat session list / history sidebar
- [ ] Implement recurring transaction detection heuristic
- [ ] Add dark mode toggle with persistence
- [ ] Write seed script generating 12 months of realistic data
- [ ] Build landing page at `/` with screenshots and feature list
- [ ] Write unit tests for CSV parser and recurring detector
- [ ] Write integration tests for transactions and AI tools
- [ ] Write README: features, screenshots, install, demo credentials, env vars
- [ ] Add MIT LICENSE
- [ ] Add `.env.example` with all required vars
- [ ] Write production Dockerfile
- [ ] Test full docker-compose up flow from clean state
- [ ] Deploy live demo instance
- [ ] Add demo link, GitHub link, and screenshots to sgarza.com portfolio

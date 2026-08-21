# FinPilot AI

**Self-hostable, open-source personal finance tracker with AI-powered insights.**

![FinPilot AI Banner](./docs/banner.png)

---

## 🌟 Features

- **📊 Beautiful Dashboard** — Track spending with charts, category breakdowns, and monthly trends
- **💳 Transaction Management** — Add, edit, and organize all your income and expenses
- **📁 Multi-Account Support** — Manage checking, savings, credit cards, and more
- **🏷️ Smart Categories** — Organize transactions with customizable categories and colors
- **📥 CSV Import** — Bulk-import transactions from your bank with flexible column mapping
- **🤖 AI Chat Assistant** — Ask questions in natural language and get instant financial insights
- **🔒 Privacy First** — Self-host your data, no third-party tracking or cloud lock-in
- **🌙 Dark Mode** — Beautiful interface in light and dark themes
- **📱 Responsive** — Works perfectly on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/FinPilot AI.git
   cd FinPilot AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL` — Your PostgreSQL connection string
   - `ANTHROPIC_API_KEY` — Your Anthropic API key for AI chat (optional)

4. Push the database schema:
   ```bash
   npm run db:push
   ```

5. Seed the database with demo data (optional):
   ```bash
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Credentials

After running `npm run db:seed`, you can log in with:
- **Email:** demo@FinPilot AI.app
- **Password:** demo123

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 + React 19 + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts
- **Backend:** Next.js API Routes + tRPC
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth
- **AI:** Vercel AI SDK + Anthropic Claude Sonnet

---

## 📖 Usage

### Adding Transactions

1. Navigate to **Transactions** → **New Transaction**
2. Fill in the amount, date, description, account, and category
3. Click **Create Transaction**

### Importing from CSV

1. Navigate to **Import**
2. Upload your bank's CSV file
3. Map the CSV columns to transaction fields
4. Click **Import**

### AI Chat

Ask natural language questions like:
- "How much did I spend on groceries last month?"
- "What's my biggest expense category?"
- "Show me my income vs expenses for the last 6 months"

---

## 🐳 Docker Deployment

A `docker-compose.yml` file is included for easy deployment:

```bash
docker-compose up -d
```

This will start both PostgreSQL and the FinPilot AI app.

---

## 🧪 Testing

Run tests:
```bash
npm test
```

---

## 📝 Development

### Project Structure

```
FinPilot AI/
├── app/                  # Next.js App Router pages
│   ├── (app)/           # Protected app routes (dashboard, transactions, etc.)
│   ├── (auth)/          # Auth pages (login, register)
│   └── api/             # API routes (tRPC, chat)
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── charts/         # Chart components
│   ├── chat/           # Chat components
│   └── nav/            # Navigation components
├── server/              # Backend code
│   ├── db/             # Database schema and client
│   ├── trpc/           # tRPC routers
│   └── ai/             # AI tools and prompts
├── lib/                 # Utility functions
├── scripts/             # Seed and migration scripts
└── docs/                # Documentation
```

### Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run db:push` — Push schema changes to database
- `npm run db:seed` — Seed database with demo data
- `npm run db:studio` — Open Drizzle Studio (database GUI)
- `npm test` — Run tests

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a PR.

---

## 📄 License

MIT © 2026 FinPilot AI

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- AI powered by [Anthropic Claude](https://anthropic.com)
- Inspired by Mint, YNAB, and Copilot

---

## 🔗 Links

- [Documentation](./docs/BUILD_PLAN.md)
- [Issue Tracker](https://github.com/yourusername/FinPilot AI/issues)
- [Live Demo](https://FinPilot AI-demo.vercel.app) *(coming soon)*

---

Made with ❤️ by developers, for developers.

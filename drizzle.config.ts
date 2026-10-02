import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "./data/finpilot.db";
const isPostgres = /^postgres(?:ql)?:\/\//i.test(databaseUrl);

export default defineConfig({
  out: isPostgres ? "./server/db/migrations/postgres" : "./server/db/migrations/sqlite",
  schema: isPostgres ? "./server/db/schema.postgres.ts" : "./server/db/schema.sqlite.ts",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: {
    url: databaseUrl,
  },
});

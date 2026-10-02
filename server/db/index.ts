import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import postgres from "postgres";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import * as sqliteSchema from "./schema.sqlite";

const configuredUrl = process.env.DATABASE_URL || "./data/finpilot.db";
const isPostgres = /^postgres(?:ql)?:\/\//i.test(configuredUrl);
let db: ReturnType<typeof drizzle<typeof sqliteSchema>>;
let migrationClient: ReturnType<typeof createClient> | ReturnType<typeof postgres>;

if (isPostgres) {
	const client = postgres(configuredUrl, { max: 5, idle_timeout: 20 });
	db = drizzlePostgres(client, { schema }) as unknown as typeof db;
	migrationClient = client;
} else {
	const databaseUrl = configuredUrl.startsWith("file:") ? configuredUrl : `file:${configuredUrl}`;
	const client = createClient({ url: databaseUrl });
	db = drizzle(client, { schema: sqliteSchema });
	migrationClient = client;
}

export { db, migrationClient };

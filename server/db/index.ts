import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const configuredUrl = process.env.DATABASE_URL || "./data/finpilot.db";
const databaseUrl = configuredUrl.startsWith("file:") ? configuredUrl : `file:${configuredUrl}`;

const client = createClient({ url: databaseUrl });
export const db = drizzle(client, { schema });

// Kept as an exported alias for existing database tooling integrations.
export const migrationClient = client;

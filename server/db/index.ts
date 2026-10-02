import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import postgres from "postgres";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import * as sqliteSchema from "./schema.sqlite";

type Database = ReturnType<typeof drizzle<typeof sqliteSchema>>;
type MigrationClient = Client | ReturnType<typeof postgres>;

function configuredDatabaseUrl() {
	const configuredUrl = process.env.DATABASE_URL;
	if (configuredUrl) return configuredUrl;
	if (process.env.NODE_ENV === "production") {
		throw new Error("DATABASE_URL must be configured for production runtime.");
	}
	return "./data/finpilot.db";
}

function isPostgresUrl(url: string) {
	return /^postgres(?:ql)?:\/\//i.test(url);
}

function isLibsqlUrl(url: string) {
	return /^libsql:\/\//i.test(url);
}

function isFileUrl(url: string) {
	return /^(?:file:|sqlite:)/i.test(url);
}

let database: Database | undefined;
let clientForMigration: MigrationClient | undefined;

function createDatabase(): Database {
	const databaseUrl = configuredDatabaseUrl();

	if (isPostgresUrl(databaseUrl)) {
		const client = postgres(databaseUrl, { max: 5, idle_timeout: 20 });
		clientForMigration = client;
		return drizzlePostgres(client, { schema }) as unknown as Database;
	}

	const sqliteUrl = isFileUrl(databaseUrl) || isLibsqlUrl(databaseUrl)
		? databaseUrl
		: `file:${databaseUrl}`;
	const client = createClient({ url: sqliteUrl });
	clientForMigration = client;
	return drizzle(client, { schema: sqliteSchema });
}

function getDatabase() {
	return database ?? (database = createDatabase());
}

function getMigrationClient() {
	getDatabase();
	return clientForMigration as MigrationClient;
}

export const db = new Proxy({} as Database, {
	get(_target, property, receiver) {
		const value = Reflect.get(getDatabase() as object, property, receiver);
		return typeof value === "function" ? value.bind(getDatabase()) : value;
	},
});

export const migrationClient = new Proxy({} as MigrationClient, {
	get(_target, property, receiver) {
		return Reflect.get(getMigrationClient() as object, property, receiver);
	},
});

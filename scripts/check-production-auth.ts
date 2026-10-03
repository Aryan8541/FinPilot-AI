import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.AUTH_CHECK_EMAIL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set for this read-only PostgreSQL diagnostic.");
}

if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error("This diagnostic only accepts a PostgreSQL DATABASE_URL and will not inspect SQLite.");
}

const sql = postgres(databaseUrl, { max: 1, idle_timeout: 5 });

async function tableExists(tableName: string) {
  const rows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${tableName}
    ) AS exists
  `;
  return rows[0]?.exists === true;
}

async function countRows(tableName: string) {
  const rows = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count
    FROM ${sql(tableName)}
  `;
  return rows[0]?.count ?? "0";
}

async function main() {
  const tableNames = [
    "users",
    "auth_account",
    "session",
    "verification",
    "accounts",
    "categories",
    "transactions",
    "chat_sessions",
    "chat_messages",
    "import_logs",
    "admin_audit_logs",
  ] as const;

  const tableStatus = new Map<string, boolean>();
  for (const tableName of tableNames) {
    tableStatus.set(tableName, await tableExists(tableName));
  }

  console.log("Production database: PostgreSQL");
  console.log("This diagnostic is read-only and does not print credentials, secrets, or password hashes.");

  for (const tableName of tableNames) {
    const exists = tableStatus.get(tableName) === true;
    console.log(`${tableName} table exists: ${exists ? "YES" : "NO"}`);
    if (exists) {
      console.log(`${tableName} row count: ${await countRows(tableName)}`);
    }
  }

  if (email) {
    if (!tableStatus.get("users") || !tableStatus.get("auth_account")) {
      console.log("Requested user check: cannot run because users or auth_account is missing.");
    } else {
      const users = await sql<{ id: string }[]>`
        SELECT id
        FROM users
        WHERE email = ${email}
        LIMIT 1
      `;
      const user = users[0];

      console.log(`User matching AUTH_CHECK_EMAIL exists: ${user ? "YES" : "NO"}`);
      if (user) {
        const accounts = await sql<{ has_password: boolean }[]>`
          SELECT EXISTS (
            SELECT 1
            FROM auth_account
            WHERE user_id = ${user.id}
              AND provider_id = 'credential'
              AND password IS NOT NULL
              AND password <> ''
          ) AS has_password
        `;
        console.log(`Credential account with password exists: ${accounts[0]?.has_password ? "YES" : "NO"}`);
      }
    }
  } else {
    console.log("Per-user check: skipped; set AUTH_CHECK_EMAIL in this PowerShell session to inspect one email.");
  }
}

main()
  .catch((error) => {
    console.error("Read-only production auth diagnostic failed:", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 2 });
  });

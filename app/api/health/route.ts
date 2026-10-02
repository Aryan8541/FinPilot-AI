import { headers } from "next/headers";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { users } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  let databaseStatus = "down";
  let authenticationStatus = "unavailable";

  try {
    await db.select({ id: users.id }).from(users).limit(1);
    databaseStatus = "connected";
  } catch {
    databaseStatus = "error";
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    authenticationStatus = session ? "available" : "unauthenticated";
  } catch {
    authenticationStatus = "error";
  }

  const status = databaseStatus === "connected" ? "ok" : "degraded";

  return Response.json({
    status,
    timestamp: new Date().toISOString(),
    checks: {
      application: "ok",
      database: databaseStatus,
      authentication: authenticationStatus,
      ai: process.env.ANTHROPIC_API_KEY ? "configured" : "not-configured",
    },
  });
}

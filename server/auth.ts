import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

const authSecret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
const authBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const isPostgres = /^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");
const trustedOrigins = [
  authBaseUrl,
  ...(process.env.AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

if (!authSecret) {
  throw new Error("Missing BETTER_AUTH_SECRET environment variable.");
}

export const auth = betterAuth({
  secret: authSecret,
  baseURL: authBaseUrl,
  trustedOrigins: [...new Set(trustedOrigins)],
  database: drizzleAdapter(db, {
    provider: isPostgres ? "pg" : "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.authAccounts,
      verification: schema.verification,
    },
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        input: false,
        defaultValue: "user",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

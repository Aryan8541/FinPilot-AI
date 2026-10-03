import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

const authBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const isPostgres = /^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");
const trustedOrigins = [
  authBaseUrl,
  ...(process.env.AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

function createAuth() {
  const authSecret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!authSecret) {
    throw new Error("Missing BETTER_AUTH_SECRET environment variable.");
  }

  return betterAuth({
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
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  });
}

type Auth = ReturnType<typeof createAuth>;
let authInstance: Auth | undefined;

function getAuth(): Auth {
  return authInstance ?? (authInstance = createAuth());
}

export const auth = new Proxy({} as Auth, {

  has(_target, property) {
    return property === "handler";
  },

  get(_target, property, receiver) {
    const value = Reflect.get(getAuth() as object, property, receiver);
    return typeof value === "function" ? value.bind(getAuth()) : value;
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

import { auth, type User } from "../auth";
import { headers } from "next/headers";

export async function createContext() {
  const headersList = await headers();
  
  try {
    const session = await auth.api.getSession({
      headers: headersList,
    });

    return {
      user: session?.user as User | null,
      session: session?.session || null,
    };
  } catch {
    return {
      user: null,
      session: null,
    };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

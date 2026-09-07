import { router } from "../trpc";
import { accountsRouter } from "./accounts";
import { categoriesRouter } from "./categories";
import { transactionsRouter } from "./transactions";
import { analyticsRouter } from "./analytics";
import { importRouter } from "./import";
import { adminRouter } from "./admin";

export const appRouter = router({
  accounts: accountsRouter,
  categories: categoriesRouter,
  transactions: transactionsRouter,
  analytics: analyticsRouter,
  import: importRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

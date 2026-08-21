import { router } from "../trpc";
import { accountsRouter } from "./accounts";
import { categoriesRouter } from "./categories";
import { transactionsRouter } from "./transactions";
import { analyticsRouter } from "./analytics";
import { importRouter } from "./import";

export const appRouter = router({
  accounts: accountsRouter,
  categories: categoriesRouter,
  transactions: transactionsRouter,
  analytics: analyticsRouter,
  import: importRouter,
});

export type AppRouter = typeof appRouter;

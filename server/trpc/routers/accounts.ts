import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

function currentBalance(account: {
  balance: string;
  transactions: { amount: string; category: { type: "income" | "expense" } }[];
}) {
  return account.transactions.reduce((balance, transaction) => {
    const amount = parseFloat(transaction.amount);
    return balance + (transaction.category.type === "income" ? amount : -Math.abs(amount));
  }, parseFloat(account.balance));
}

export const accountsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const accountList = await db.query.accounts.findMany({
      where: eq(accounts.userId, ctx.user.id),
      with: {
        transactions: {
          with: {
            category: true,
          },
        },
      },
      orderBy: (accounts, { desc }) => [desc(accounts.createdAt)],
    });

    return accountList.map((account) => ({
      ...account,
      balance: currentBalance(account).toFixed(2),
      transactions: undefined,
    }));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const account = await db.query.accounts.findFirst({
        where: and(
          eq(accounts.id, input.id),
          eq(accounts.userId, ctx.user.id)
        ),
        with: {
          transactions: {
            with: {
              category: true,
            },
          },
        },
      });
      if (!account) {
        throw new Error("Account not found");
      }
      return {
        ...account,
        balance: currentBalance(account).toFixed(2),
        transactions: undefined,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        type: z.enum(["checking", "savings", "credit", "cash", "investment"]),
        balance: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
        currency: z.string().length(3).default("USD"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [account] = await db
        .insert(accounts)
        .values({
          userId: ctx.user.id,
          name: input.name,
          type: input.type,
          balance: input.balance,
          currency: input.currency,
        })
        .returning();
      return account;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        type: z.enum(["checking", "savings", "credit", "cash", "investment"]).optional(),
        balance: z.string().regex(/^-?\d+(\.\d{1,2})?$/).optional(),
        currency: z.string().length(3).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      const [account] = await db
        .update(accounts)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(eq(accounts.id, id), eq(accounts.userId, ctx.user.id)))
        .returning();
      if (!account) {
        throw new Error("Account not found");
      }
      return account;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [deleted] = await db
        .delete(accounts)
        .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.user.id)))
        .returning();
      if (!deleted) {
        throw new Error("Account not found");
      }
      return { success: true };
    }),
});

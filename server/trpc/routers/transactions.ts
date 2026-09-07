import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { accounts, categories, transactions } from "@/server/db/schema";
import { eq, and, gte, lte, desc, like, exists } from "drizzle-orm";
import { endOfDay, parseISO } from "date-fns";

async function assertOwnedReferences(
  userId: string,
  accountId: string,
  categoryId: string
) {
  const [account, category] = await Promise.all([
    db.query.accounts.findFirst({
      where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
      columns: { id: true },
    }),
    db.query.categories.findFirst({
      where: and(eq(categories.id, categoryId), eq(categories.userId, userId)),
      columns: { id: true },
    }),
  ]);

  if (!account || !category) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Account or category is not available",
    });
  }
}

export const transactionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        type: z.enum(["income", "expense"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const conditions = [eq(transactions.userId, ctx.user.id)];

      if (input.accountId) {
        conditions.push(eq(transactions.accountId, input.accountId));
      }
      if (input.categoryId) {
        conditions.push(eq(transactions.categoryId, input.categoryId));
      }
      if (input.type) {
        conditions.push(
          exists(
            db.select({ id: categories.id }).from(categories).where(
              and(
                eq(categories.id, transactions.categoryId),
                eq(categories.userId, ctx.user.id),
                eq(categories.type, input.type)
              )
            )
          )
        );
      }
      if (input.startDate) {
        conditions.push(gte(transactions.date, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(transactions.date, endOfDay(parseISO(input.endDate))));
      }
      if (input.search) {
        conditions.push(like(transactions.description, `%${input.search}%`));
      }

      const results = await db.query.transactions.findMany({
        where: and(...conditions),
        with: {
          account: true,
          category: true,
        },
        orderBy: [desc(transactions.date), desc(transactions.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return results;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const transaction = await db.query.transactions.findFirst({
        where: and(
          eq(transactions.id, input.id),
          eq(transactions.userId, ctx.user.id)
        ),
        with: {
          account: true,
          category: true,
        },
      });
      if (!transaction) {
        throw new Error("Transaction not found");
      }
      return transaction;
    }),

  create: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        categoryId: z.string().uuid(),
        amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
        date: z.string(),
        description: z.string().min(1),
        isRecurring: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertOwnedReferences(ctx.user.id, input.accountId, input.categoryId);

      const [transaction] = await db
        .insert(transactions)
        .values({
          userId: ctx.user.id,
          accountId: input.accountId,
          categoryId: input.categoryId,
          amount: input.amount,
          date: new Date(input.date),
          description: input.description,
          isRecurring: input.isRecurring,
        })
        .returning();
      return transaction;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/).optional(),
        date: z.string().optional(),
        description: z.string().min(1).optional(),
        isRecurring: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, date, ...updates } = input;

      if (updates.accountId || updates.categoryId) {
        const existing = await db.query.transactions.findFirst({
          where: and(
            eq(transactions.id, id),
            eq(transactions.userId, ctx.user.id)
          ),
          columns: { accountId: true, categoryId: true },
        });

        if (!existing) {
          throw new Error("Transaction not found");
        }

        await assertOwnedReferences(
          ctx.user.id,
          updates.accountId ?? existing.accountId,
          updates.categoryId ?? existing.categoryId
        );
      }

      const [transaction] = await db
        .update(transactions)
        .set({
          ...updates,
          ...(date && { date: new Date(date) }),
          updatedAt: new Date(),
        })
        .where(and(eq(transactions.id, id), eq(transactions.userId, ctx.user.id)))
        .returning();
      if (!transaction) {
        throw new Error("Transaction not found");
      }
      return transaction;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [deleted] = await db
        .delete(transactions)
        .where(and(eq(transactions.id, input.id), eq(transactions.userId, ctx.user.id)))
        .returning();
      if (!deleted) {
        throw new Error("Transaction not found");
      }
      return { success: true };
    }),
});

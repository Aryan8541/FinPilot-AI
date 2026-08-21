import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { transactions } from "@/server/db/schema";
import { eq, and, gte, lte, desc, sql, like } from "drizzle-orm";

export const transactionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
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
      if (input.startDate) {
        conditions.push(gte(transactions.date, new Date(input.startDate)));
      }
      if (input.endDate) {
        conditions.push(lte(transactions.date, new Date(input.endDate)));
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

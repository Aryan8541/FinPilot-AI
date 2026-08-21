import { z } from "zod";
import { db } from "@/server/db";
import { transactions } from "@/server/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { startOfMonth, endOfMonth, format } from "date-fns";

export const tools = {
  getTransactions: {
    description:
      "Get a list of transactions for the user. Can filter by date range, account, or category.",
    parameters: z.object({
      limit: z.number().min(1).max(100).default(10).describe("Number of transactions to return"),
      accountId: z.string().uuid().optional().describe("Filter by account ID"),
      categoryId: z.string().uuid().optional().describe("Filter by category ID"),
      startDate: z.string().optional().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
    }),
    execute: async (params: any, userId: string) => {
      const conditions = [eq(transactions.userId, userId)];

      if (params.accountId) {
        conditions.push(eq(transactions.accountId, params.accountId));
      }
      if (params.categoryId) {
        conditions.push(eq(transactions.categoryId, params.categoryId));
      }
      if (params.startDate) {
        conditions.push(gte(transactions.date, new Date(params.startDate)));
      }
      if (params.endDate) {
        conditions.push(lte(transactions.date, new Date(params.endDate)));
      }

      const results = await db.query.transactions.findMany({
        where: and(...conditions),
        with: {
          account: true,
          category: true,
        },
        orderBy: [desc(transactions.date)],
        limit: params.limit || 10,
      });

      return results.map((t) => ({
        id: t.id,
        date: format(new Date(t.date), "yyyy-MM-dd"),
        amount: parseFloat(t.amount),
        description: t.description,
        account: t.account.name,
        category: t.category.name,
        categoryType: t.category.type,
      }));
    },
  },

  getSpendingByCategory: {
    description:
      "Get total spending grouped by category for a given time period. Returns expense categories only.",
    parameters: z.object({
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().describe("End date in YYYY-MM-DD format"),
    }),
    execute: async (params: any, userId: string) => {
      const results = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          gte(transactions.date, new Date(params.startDate)),
          lte(transactions.date, new Date(params.endDate))
        ),
        with: {
          category: true,
        },
      });

      const breakdown: { [key: string]: { name: string; total: number; count: number } } = {};

      results.forEach((t) => {
        if (t.category.type === "expense") {
          if (!breakdown[t.category.id]) {
            breakdown[t.category.id] = {
              name: t.category.name,
              total: 0,
              count: 0,
            };
          }
          breakdown[t.category.id].total += Math.abs(parseFloat(t.amount));
          breakdown[t.category.id].count += 1;
        }
      });

      return Object.values(breakdown).sort((a, b) => b.total - a.total);
    },
  },

  getMonthlyTrend: {
    description:
      "Get monthly income vs expenses trend for the past N months. Useful for visualizing financial trends over time.",
    parameters: z.object({
      months: z.number().min(1).max(12).default(6).describe("Number of months to include"),
    }),
    execute: async (params: any, userId: string) => {
      const months = [];
      const now = new Date();

      for (let i = params.months - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        months.push({
          month: format(date, "MMM yyyy"),
          startDate: startOfMonth(date),
          endDate: endOfMonth(date),
        });
      }

      const trendData = await Promise.all(
        months.map(async ({ month, startDate, endDate }) => {
          const monthTransactions = await db.query.transactions.findMany({
            where: and(
              eq(transactions.userId, userId),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            ),
            with: {
              category: true,
            },
          });

          let income = 0;
          let expenses = 0;

          monthTransactions.forEach((t) => {
            const amount = parseFloat(t.amount);
            if (t.category.type === "income") {
              income += amount;
            } else {
              expenses += Math.abs(amount);
            }
          });

          return {
            month,
            income,
            expenses,
            net: income - expenses,
          };
        })
      );

      return trendData;
    },
  },

  getAccountBalances: {
    description: "Get current balance for all accounts or a specific account.",
    parameters: z.object({
      accountId: z.string().uuid().optional().describe("Specific account ID (optional)"),
    }),
    execute: async (params: any, userId: string) => {
      const accounts = await db.query.accounts.findMany({
        where: params.accountId
          ? and(eq(transactions.userId, userId), eq(transactions.id, params.accountId))
          : eq(transactions.userId, userId),
      });

      return accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: parseFloat(a.balance),
        currency: a.currency,
      }));
    },
  },

  searchTransactions: {
    description: "Search transactions by description text. Returns matching transactions.",
    parameters: z.object({
      query: z.string().describe("Search query (partial match on description)"),
      limit: z.number().min(1).max(50).default(10).describe("Number of results to return"),
    }),
    execute: async (params: any, userId: string) => {
      const results = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          sql`lower(${transactions.description}) like ${`%${params.query.toLowerCase()}%`}`
        ),
        with: {
          account: true,
          category: true,
        },
        orderBy: [desc(transactions.date)],
        limit: params.limit,
      });

      return results.map((t) => ({
        id: t.id,
        date: format(new Date(t.date), "yyyy-MM-dd"),
        amount: parseFloat(t.amount),
        description: t.description,
        account: t.account.name,
        category: t.category.name,
      }));
    },
  },

  getRecurringTransactions: {
    description:
      "Get all transactions marked as recurring. Useful for finding subscriptions and regular bills.",
    parameters: z.object({}),
    execute: async (_params: any, userId: string) => {
      const results = await db.query.transactions.findMany({
        where: and(eq(transactions.userId, userId), eq(transactions.isRecurring, true)),
        with: {
          account: true,
          category: true,
        },
        orderBy: [desc(transactions.amount)],
      });

      return results.map((t) => ({
        id: t.id,
        amount: parseFloat(t.amount),
        description: t.description,
        account: t.account.name,
        category: t.category.name,
      }));
    },
  },
};

export type ToolName = keyof typeof tools;

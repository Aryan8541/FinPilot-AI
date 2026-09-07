import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { transactions } from "@/server/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { startOfMonth, endOfMonth, subMonths, format, endOfDay, parseISO } from "date-fns";

export const analyticsRouter = router({
  dashboard: protectedProcedure
    .input(
      z.object({
        month: z.string().optional(), // YYYY-MM format
      })
    )
    .query(async ({ input, ctx }) => {
      const targetDate = input.month ? new Date(input.month) : new Date();
      const startDate = startOfMonth(targetDate);
      const endDate = endOfMonth(targetDate);

      // Get all transactions for the month with categories
      const monthTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, ctx.user.id),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        ),
        with: {
          category: true,
        },
      });

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;

      monthTransactions.forEach((t) => {
        const amount = parseFloat(t.amount);
        if (t.category.type === "income") {
          totalIncome += amount;
        } else {
          totalExpenses += Math.abs(amount);
        }
      });

      // Get category breakdown
      const categoryBreakdown: { [key: string]: { name: string; amount: number; color: string; type: string } } = {};
      
      monthTransactions.forEach((t) => {
        if (t.category.type !== "expense") {
          return;
        }

        if (!categoryBreakdown[t.category.id]) {
          categoryBreakdown[t.category.id] = {
            name: t.category.name,
            amount: 0,
            color: t.category.color,
            type: t.category.type,
          };
        }
        categoryBreakdown[t.category.id].amount += Math.abs(parseFloat(t.amount));
      });

      const categoryData = Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount);

      // Get recent transactions
      const recentTransactions = monthTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      return {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        categoryBreakdown: categoryData,
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          date: t.date,
          description: t.description,
          amount: t.amount,
          category: t.category,
        })),
      };
    }),

  spendingByCategory: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const results = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, ctx.user.id),
          gte(transactions.date, new Date(input.startDate)),
          lte(transactions.date, endOfDay(parseISO(input.endDate)))
        ),
        with: {
          category: true,
        },
      });

      const breakdown: { [key: string]: { name: string; amount: number; color: string } } = {};

      results.forEach((t) => {
        if (t.category.type === "expense") {
          if (!breakdown[t.category.id]) {
            breakdown[t.category.id] = {
              name: t.category.name,
              amount: 0,
              color: t.category.color,
            };
          }
          breakdown[t.category.id].amount += Math.abs(parseFloat(t.amount));
        }
      });

      return Object.values(breakdown).sort((a, b) => b.amount - a.amount);
    }),

  monthlyTrend: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(24).default(6),
      })
    )
    .query(async ({ input, ctx }) => {
      const months = [];
      const now = new Date();

      // Generate last N months
      for (let i = input.months - 1; i >= 0; i--) {
        const date = subMonths(now, i);
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
              eq(transactions.userId, ctx.user.id),
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
    }),

  recurring: protectedProcedure.query(async ({ ctx }) => {
    return await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, ctx.user.id),
        eq(transactions.isRecurring, true)
      ),
      with: {
        category: true,
        account: true,
      },
      orderBy: [desc(transactions.amount)],
    });
  }),
});

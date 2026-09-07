import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { transactions } from "@/server/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { startOfMonth, endOfMonth, subMonths, format, endOfDay, parseISO } from "date-fns";

export const analyticsRouter = router({
  intelligence: protectedProcedure
    .input(z.object({ month: z.string().optional() }).default({}))
    .query(async ({ input, ctx }) => {
      const targetDate = input.month ? new Date(`${input.month}-01T00:00:00`) : new Date();
      const currentStart = startOfMonth(targetDate);
      const currentEnd = endOfMonth(targetDate);
      const previousDate = subMonths(targetDate, 1);
      const previousStart = startOfMonth(previousDate);
      const previousEnd = endOfMonth(previousDate);
      const [current, previous] = await Promise.all([
        db.query.transactions.findMany({ where: and(eq(transactions.userId, ctx.user.id), gte(transactions.date, currentStart), lte(transactions.date, currentEnd)), with: { category: true } }),
        db.query.transactions.findMany({ where: and(eq(transactions.userId, ctx.user.id), gte(transactions.date, previousStart), lte(transactions.date, previousEnd)), with: { category: true } }),
      ]);

      const summarize = (items: typeof current) => {
        const byCategory: Record<string, { name: string; amount: number; color: string }> = {};
        let income = 0;
        let expenses = 0;
        for (const transaction of items) {
          const amount = parseFloat(transaction.amount);
          if (transaction.category.type === "income") income += amount;
          else {
            const expense = Math.abs(amount);
            expenses += expense;
            const category = byCategory[transaction.category.id] ?? { name: transaction.category.name, amount: 0, color: transaction.category.color };
            category.amount += expense;
            byCategory[transaction.category.id] = category;
          }
        }
        return { income, expenses, net: income - expenses, transactionCount: items.length, categories: Object.values(byCategory).sort((a, b) => b.amount - a.amount) };
      };

      const currentSummary = summarize(current);
      const previousSummary = summarize(previous);
      const percentChange = (now: number, before: number) => before === 0 ? null : ((now - before) / before) * 100;
      const expenseChange = percentChange(currentSummary.expenses, previousSummary.expenses);
      const health = currentSummary.transactionCount === 0
        ? { status: "Insufficient Data" as const, reason: "Add transactions to build a financial health view." }
        : currentSummary.net > 0 && currentSummary.expenses <= currentSummary.income * 0.8
          ? { status: "Healthy" as const, reason: "This month is cash-flow positive with expenses below 80% of income." }
          : currentSummary.net >= 0
            ? { status: "Stable" as const, reason: "Income covers recorded expenses this month." }
            : { status: "Needs Attention" as const, reason: "Recorded expenses are higher than income this month." };
      const insights: Array<{ title: string; detail: string; tone: "positive" | "neutral" | "attention" }> = [];
      if (currentSummary.categories[0]) insights.push({ title: `${currentSummary.categories[0].name} leads spending`, detail: `${currentSummary.categories[0].amount.toFixed(2)} recorded this month.`, tone: "neutral" });
      if (expenseChange !== null && Math.abs(expenseChange) >= 10) insights.push({ title: `Expenses ${expenseChange > 0 ? "increased" : "decreased"}`, detail: `${Math.abs(expenseChange).toFixed(1)}% compared with last month.`, tone: expenseChange > 0 ? "attention" : "positive" });
      if (currentSummary.net > 0) insights.push({ title: "Positive cash flow", detail: `${currentSummary.net.toFixed(2)} remains after recorded expenses.`, tone: "positive" });
      if (!insights.length) insights.push({ title: "Not enough change to highlight", detail: "Keep recording activity to reveal meaningful patterns.", tone: "neutral" });

      return { current: currentSummary, previous: previousSummary, comparisons: { expenseChange, incomeChange: percentChange(currentSummary.income, previousSummary.income), netChange: currentSummary.net - previousSummary.net }, health, insights, period: { currentStart, currentEnd, previousStart, previousEnd } };
    }),

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

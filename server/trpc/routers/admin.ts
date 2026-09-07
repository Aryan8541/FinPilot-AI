import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { count, desc, eq, like } from "drizzle-orm";
import { db } from "@/server/db";
import { accounts, adminAuditLogs, categories, chatMessages, importLogs, transactions, users } from "@/server/db/schema";
import { adminProcedure, router } from "../trpc";

export const adminRouter = router({
  overview: adminProcedure.query(async () => {
    const [userCount, accountCount, categoryCount, transactionCount, importCount, messageCount] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(accounts),
      db.select({ value: count() }).from(categories),
      db.select({ value: count() }).from(transactions),
      db.select({ value: count() }).from(importLogs),
      db.select({ value: count() }).from(chatMessages),
    ]);

    return {
      users: userCount[0]?.value ?? 0,
      accounts: accountCount[0]?.value ?? 0,
      categories: categoryCount[0]?.value ?? 0,
      transactions: transactionCount[0]?.value ?? 0,
      imports: importCount[0]?.value ?? 0,
      chatMessages: messageCount[0]?.value ?? 0,
      status: {
        database: "connected" as const,
        authentication: "configured" as const,
        analytics: "available" as const,
      },
    };
  }),

  analytics: adminProcedure.query(async () => {
    const [recentUsers, recentTransactions, recentImports, recentMessages] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(transactions),
      db.select({ value: count() }).from(importLogs),
      db.select({ value: count() }).from(chatMessages),
    ]);
    return {
      totals: { users: recentUsers[0]?.value ?? 0, transactions: recentTransactions[0]?.value ?? 0, imports: recentImports[0]?.value ?? 0, aiMessages: recentMessages[0]?.value ?? 0 },
      note: "Historical activity trends are limited by the current event data model.",
    };
  }),

  imports: adminProcedure.query(async () => {
    const logs = await db.query.importLogs.findMany({ orderBy: (logs, { desc }) => [desc(logs.createdAt)], limit: 50, columns: { id: true, filename: true, rowCount: true, successCount: true, errorCount: true, createdAt: true } });
    return { total: logs.length, successfulRows: logs.reduce((sum, log) => sum + Number(log.successCount), 0), failedRows: logs.reduce((sum, log) => sum + Number(log.errorCount), 0), logs };
  }),

  usage: adminProcedure.query(async () => {
    const [messages, imports] = await Promise.all([db.select({ value: count() }).from(chatMessages), db.select({ value: count() }).from(importLogs)]);
    return { aiMessages: messages[0]?.value ?? 0, importRuns: imports[0]?.value ?? 0, costTracking: "not configured" as const, apiConfigured: Boolean(process.env.ANTHROPIC_API_KEY) };
  }),

  health: adminProcedure.query(async () => ({
    database: "connected" as const,
    authentication: "available" as const,
    ai: process.env.ANTHROPIC_API_KEY ? "configured" as const : "not configured" as const,
    imports: "available" as const,
    application: "healthy" as const,
  })),

  audit: adminProcedure.query(async () => db.query.adminAuditLogs.findMany({ orderBy: (logs, { desc }) => [desc(logs.createdAt)], limit: 100, with: { actor: { columns: { name: true, email: true } } } })),

  users: adminProcedure
    .input(z.object({ search: z.string().trim().max(100).optional() }).default({}))
    .query(async ({ input }) => {
      return db.query.users.findMany({
        where: input.search ? like(users.email, `%${input.search}%`) : undefined,
        columns: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: [desc(users.createdAt)],
      });
    }),

  setRole: adminProcedure
    .input(z.object({ userId: z.string().uuid(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id && input.role !== "admin") {
        const admins = await db.select({ value: count() }).from(users).where(eq(users.role, "admin"));
        if ((admins[0]?.value ?? 0) <= 1) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You cannot remove the final admin role." });
        }
      }

      const [updated] = await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId))
        .returning({ id: users.id, role: users.role });
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      await db.insert(adminAuditLogs).values({ actorId: ctx.user.id, action: "role_changed", targetType: "user", targetId: input.userId, result: "success", metadata: { role: input.role } });
      return updated;
    }),
});

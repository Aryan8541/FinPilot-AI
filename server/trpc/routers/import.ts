import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { accounts, categories, transactions, importLogs } from "@/server/db/schema";
import { parseCSV, mapRow } from "@/lib/csv-parser";
import { and, eq } from "drizzle-orm";

export const importRouter = router({
  preview: protectedProcedure
    .input(
      z.object({
        csvText: z.string(),
      })
    )
    .mutation(({ input }) => {
      const result = parseCSV(input.csvText);
      return {
        headers: result.headers,
        sampleRows: result.data.slice(0, 5), // Return first 5 rows for preview
        totalRows: result.data.length,
        errors: result.errors,
      };
    }),

  commit: protectedProcedure
    .input(
      z.object({
        csvText: z.string(),
        mapping: z.object({
          amount: z.string(),
          date: z.string(),
          description: z.string(),
          accountId: z.string().uuid(),
          categoryId: z.string().uuid(),
        }),
        filename: z.string().default("import.csv"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [account, category] = await Promise.all([
        db.query.accounts.findFirst({
          where: and(
            eq(accounts.id, input.mapping.accountId),
            eq(accounts.userId, ctx.user.id)
          ),
          columns: { id: true },
        }),
        db.query.categories.findFirst({
          where: and(
            eq(categories.id, input.mapping.categoryId),
            eq(categories.userId, ctx.user.id)
          ),
          columns: { id: true },
        }),
      ]);

      if (!account || !category) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Account or category is not available",
        });
      }

      const result = parseCSV(input.csvText);
      const errors: string[] = [];
      let successCount = 0;

      // Process each row
      for (let i = 0; i < result.data.length; i++) {
        const row = result.data[i];
        const mapped = mapRow(row, input.mapping);

        if (!mapped) {
          errors.push(`Row ${i + 1}: Failed to map fields`);
          continue;
        }

        try {
          // Validate and insert
          await db.insert(transactions).values({
            userId: ctx.user.id,
            accountId: mapped.accountId,
            categoryId: mapped.categoryId,
            amount: mapped.amount,
            date: new Date(mapped.date),
            description: mapped.description,
            isRecurring: false,
          });
          successCount++;
        } catch {
          errors.push(`Row ${i + 1}: Failed to import transaction`);
        }
      }

      // Log the import
      await db.insert(importLogs).values({
        userId: ctx.user.id,
        filename: input.filename,
        rowCount: result.data.length.toString(),
        successCount: successCount.toString(),
        errorCount: errors.length.toString(),
        errors: errors.length > 0 ? errors : null,
      });

      return {
        success: true,
        imported: successCount,
        failed: errors.length,
        errors: errors.slice(0, 10), // Return first 10 errors
      };
    }),

  logs: protectedProcedure.query(async ({ ctx }) => {
    return await db.query.importLogs.findMany({
      where: (logs, { eq }) => eq(logs.userId, ctx.user.id),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      limit: 20,
    });
  }),
});

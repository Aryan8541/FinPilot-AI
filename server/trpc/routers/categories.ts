import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export const categoriesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.query.categories.findMany({
      where: eq(categories.userId, ctx.user.id),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const category = await db.query.categories.findFirst({
        where: and(
          eq(categories.id, input.id),
          eq(categories.userId, ctx.user.id)
        ),
      });
      if (!category) {
        throw new Error("Category not found");
      }
      return category;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        icon: z.string().max(50).optional(),
        type: z.enum(["income", "expense"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [category] = await db
        .insert(categories)
        .values({
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
          icon: input.icon || null,
          type: input.type,
        })
        .returning();
      return category;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icon: z.string().max(50).optional(),
        type: z.enum(["income", "expense"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      const [category] = await db
        .update(categories)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(and(eq(categories.id, id), eq(categories.userId, ctx.user.id)))
        .returning();
      if (!category) {
        throw new Error("Category not found");
      }
      return category;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const [deleted] = await db
        .delete(categories)
        .where(and(eq(categories.id, input.id), eq(categories.userId, ctx.user.id)))
        .returning();
      if (!deleted) {
        throw new Error("Category not found");
      }
      return { success: true };
    }),
});

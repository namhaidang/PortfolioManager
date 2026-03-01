import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "@repo/db";
import { recurringRules, categories, accounts, users } from "@repo/db/schema";
import { newId } from "@repo/shared";
import type { AppEnv } from "../types.js";
import { getNextDueDate, type Frequency } from "../utils/recurring.js";

const router = new Hono<AppEnv>();

router.get("/", async (c) => {
  const sp = c.req.query();
  const type = sp.type;
  const userId = sp.userId;
  const isActive = sp.isActive;

  const conditions = [];
  if (type) conditions.push(eq(recurringRules.type, type as "income" | "expense"));
  if (userId) conditions.push(eq(recurringRules.userId, userId));
  if (isActive !== undefined) conditions.push(eq(recurringRules.isActive, isActive === "true"));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: recurringRules.id,
      userId: recurringRules.userId,
      recordedByUserId: recurringRules.recordedByUserId,
      type: recurringRules.type,
      categoryId: recurringRules.categoryId,
      accountId: recurringRules.accountId,
      amount: recurringRules.amount,
      currency: recurringRules.currency,
      frequency: recurringRules.frequency,
      startDate: recurringRules.startDate,
      endDate: recurringRules.endDate,
      maxOccurrences: recurringRules.maxOccurrences,
      occurrenceCount: recurringRules.occurrenceCount,
      description: recurringRules.description,
      notes: recurringRules.notes,
      isActive: recurringRules.isActive,
      createdAt: recurringRules.createdAt,
      categoryName: categories.name,
      accountName: accounts.name,
      userName: users.name,
    })
    .from(recurringRules)
    .leftJoin(categories, eq(recurringRules.categoryId, categories.id))
    .leftJoin(accounts, eq(recurringRules.accountId, accounts.id))
    .leftJoin(users, eq(recurringRules.userId, users.id))
    .where(where)
    .orderBy(recurringRules.createdAt);

  const withNextDue = rows.map((r) => ({
    ...r,
    nextDueDate: getNextDueDate(r.startDate, r.frequency as Frequency, r.occurrenceCount),
  }));

  return c.json(withNextDue);
});

router.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const {
    userId,
    type,
    categoryId,
    accountId,
    amount,
    currency,
    frequency,
    startDate,
    endDate,
    maxOccurrences,
    description,
    notes,
  } = body;

  if (!userId || !type || !categoryId || !accountId || amount == null || !frequency || !startDate || !description) {
    return c.json(
      { error: "userId, type, categoryId, accountId, amount, frequency, startDate, and description are required" },
      400,
    );
  }

  if (type !== "income" && type !== "expense") {
    return c.json({ error: "type must be income or expense" }, 400);
  }

  if (maxOccurrences != null) {
    const n = typeof maxOccurrences === "number" ? maxOccurrences : parseInt(String(maxOccurrences), 10);
    if (isNaN(n) || n < 1 || !Number.isInteger(n)) {
      return c.json({ error: "maxOccurrences must be a positive integer" }, 400);
    }
  }

  const [row] = await db
    .insert(recurringRules)
    .values({
      id: newId(),
      userId,
      recordedByUserId: user.id,
      type,
      categoryId,
      accountId,
      amount: String(amount),
      currency: currency || "VND",
      frequency,
      startDate,
      endDate: endDate || null,
      maxOccurrences: maxOccurrences ?? null,
      description: description.trim(),
      notes: notes?.trim() || null,
    })
    .returning();

  return c.json(
    {
      ...row,
      nextDueDate: getNextDueDate(row.startDate, row.frequency as Frequency, 0),
    },
    201,
  );
});

router.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const updates: Record<string, unknown> = {};
  if (body.userId) updates.userId = body.userId;
  if (body.categoryId) updates.categoryId = body.categoryId;
  if (body.accountId) updates.accountId = body.accountId;
  if (body.amount != null) updates.amount = String(body.amount);
  if (body.currency) updates.currency = body.currency;
  if (body.frequency) updates.frequency = body.frequency;
  if (body.startDate) updates.startDate = body.startDate;
  if (body.endDate !== undefined) updates.endDate = body.endDate || null;
  if (body.maxOccurrences !== undefined) updates.maxOccurrences = body.maxOccurrences ?? null;
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

  if (body.maxOccurrences !== undefined && body.maxOccurrences != null) {
    const n =
      typeof body.maxOccurrences === "number"
        ? body.maxOccurrences
        : parseInt(String(body.maxOccurrences), 10);
    if (isNaN(n) || n < 1 || !Number.isInteger(n)) {
      return c.json({ error: "maxOccurrences must be a positive integer" }, 400);
    }
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  const [row] = await db.update(recurringRules).set(updates).where(eq(recurringRules.id, id)).returning();

  if (!row) return c.json({ error: "Recurring rule not found" }, 404);
  return c.json({
    ...row,
    nextDueDate: getNextDueDate(row.startDate, row.frequency as Frequency, row.occurrenceCount),
  });
});

router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db.delete(recurringRules).where(eq(recurringRules.id, id)).returning();

  if (!row) return c.json({ error: "Recurring rule not found" }, 404);
  return c.json({ success: true });
});

export default router;

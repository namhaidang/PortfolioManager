import { Hono } from "hono";
import { eq, and, gte, lte, ilike, desc, asc, sql } from "drizzle-orm";
import { db } from "@repo/db";
import { transactions, categories, accounts, users } from "@repo/db/schema";
import { newId } from "@repo/shared";
import type { AppEnv } from "../types.js";
import { getMonthlySummary } from "../services/cashflow.js";

const router = new Hono<AppEnv>();

const PAGE_SIZE = 20;

router.get("/", async (c) => {
  const sp = c.req.query();
  const type = sp.type;
  const userId = sp.userId;
  const categoryId = sp.categoryId;
  const accountId = sp.accountId;
  const dateFrom = sp.dateFrom;
  const dateTo = sp.dateTo;
  const recurringRuleId = sp.recurringRuleId;
  const search = sp.search;
  const sortBy = sp.sortBy || "date";
  const sortOrder = sp.sortOrder || "desc";
  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit || String(PAGE_SIZE), 10)));

  type TxType = "income" | "expense" | "buy" | "sell" | "dividend" | "transfer";
  const conditions = [];
  if (type) conditions.push(eq(transactions.type, type as TxType));
  if (userId) conditions.push(eq(transactions.userId, userId));
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
  if (accountId) conditions.push(eq(transactions.accountId, accountId));
  if (dateFrom) conditions.push(gte(transactions.date, dateFrom));
  if (dateTo) conditions.push(lte(transactions.date, dateTo));
  if (recurringRuleId) conditions.push(eq(transactions.recurringRuleId, recurringRuleId));
  if (search) conditions.push(ilike(transactions.notes, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortCol =
    sortBy === "amount" ? transactions.amount :
    sortBy === "category" ? categories.name :
    transactions.date;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        recordedByUserId: transactions.recordedByUserId,
        accountId: transactions.accountId,
        type: transactions.type,
        categoryId: transactions.categoryId,
        recurringRuleId: transactions.recurringRuleId,
        date: transactions.date,
        amount: transactions.amount,
        notes: transactions.notes,
        tags: transactions.tags,
        createdAt: transactions.createdAt,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        accountName: accounts.name,
        accountCurrency: accounts.currency,
        userName: users.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(where)
      .orderBy(orderFn(sortCol), desc(transactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(where),
  ]);

  return c.json({ data: rows, total: Number(countResult[0].count), page, limit });
});

router.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { userId, accountId, type, categoryId, date, amount, notes, tags } = body;

  if (!userId || !accountId || !type || !categoryId || !date || amount == null) {
    return c.json({ error: "userId, accountId, type, categoryId, date, and amount are required" }, 400);
  }

  if (type !== "income" && type !== "expense") {
    return c.json({ error: "type must be income or expense" }, 400);
  }

  const [row] = await db
    .insert(transactions)
    .values({
      id: newId(),
      userId,
      recordedByUserId: user.id,
      accountId,
      type,
      categoryId,
      date,
      amount: String(amount),
      notes: notes || null,
      tags: tags || null,
    })
    .returning();

  return c.json(row, 201);
});

router.get("/summary", async (c) => {
  const sp = c.req.query();
  const now = new Date();
  const month = parseInt(sp.month || String(now.getMonth() + 1), 10);
  const year = parseInt(sp.year || String(now.getFullYear()), 10);
  const userId = sp.userId || undefined;

  const summary = await getMonthlySummary(month, year, userId);
  return c.json(summary);
});

router.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const updates: Record<string, unknown> = {};
  if (body.userId) updates.userId = body.userId;
  if (body.accountId) updates.accountId = body.accountId;
  if (body.categoryId) updates.categoryId = body.categoryId;
  if (body.date) updates.date = body.date;
  if (body.amount != null) updates.amount = String(body.amount);
  if (body.notes !== undefined) updates.notes = body.notes || null;
  if (body.tags !== undefined) updates.tags = body.tags || null;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  const [row] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();

  if (!row) return c.json({ error: "Transaction not found" }, 404);
  return c.json(row);
});

router.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db.delete(transactions).where(eq(transactions.id, id)).returning();

  if (!row) return c.json({ error: "Transaction not found" }, 404);
  return c.json({ success: true });
});

export default router;

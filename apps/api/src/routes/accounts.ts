import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@repo/db";
import { accounts } from "@repo/db/schema";
import { newId } from "@repo/shared";
import type { AppEnv } from "../types.js";

const router = new Hono<AppEnv>();

router.get("/", async (c) => {
  const userId = c.req.query("userId");

  const rows = await db
    .select()
    .from(accounts)
    .where(userId ? eq(accounts.userId, userId) : undefined)
    .orderBy(accounts.createdAt);

  return c.json(rows);
});

router.post("/", async (c) => {
  const user = c.get("user");
  const { name, type, currency, userId } = await c.req.json();

  if (!name || !type || !currency) {
    return c.json({ error: "name, type, and currency are required" }, 400);
  }

  const [row] = await db
    .insert(accounts)
    .values({
      id: newId(),
      userId: userId || user.id,
      name: name.trim(),
      type,
      currency,
    })
    .returning();

  return c.json(row, 201);
});

router.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const updates: Record<string, unknown> = {};
  if (body.name && typeof body.name === "string") updates.name = body.name.trim();
  if (body.type) updates.type = body.type;
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  const [row] = await db.update(accounts).set(updates).where(eq(accounts.id, id)).returning();

  if (!row) return c.json({ error: "Account not found" }, 404);
  return c.json(row);
});

export default router;

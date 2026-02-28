import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@repo/db";
import { categories } from "@repo/db/schema";
import type { AppEnv } from "../types.js";

const router = new Hono<AppEnv>();

router.get("/", async (c) => {
  const type = c.req.query("type");

  const rows = await db
    .select()
    .from(categories)
    .where(type === "income" || type === "expense" ? eq(categories.type, type) : undefined)
    .orderBy(categories.sortOrder);

  return c.json(rows);
});

export default router;

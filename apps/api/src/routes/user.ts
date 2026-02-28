import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@repo/db";
import { users } from "@repo/db/schema";
import type { AppEnv } from "../types.js";
import { issueToken } from "./auth.js";

const router = new Hono<AppEnv>();

router.get("/", async (c) => {
  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users);
  return c.json(rows);
});

router.patch("/profile", async (c) => {
  const user = c.get("user");
  const { name, theme } = await c.req.json();

  const updates: Partial<{ name: string; theme: "light" | "dark" }> = {};
  if (name && typeof name === "string") updates.name = name.trim();
  if (theme === "light" || theme === "dark") updates.theme = theme;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  await db.update(users).set(updates).where(eq(users.id, user.id));

  const updatedUser = { ...user, ...updates };
  const token = await issueToken(updatedUser);
  return c.json({ success: true, token });
});

export default router;

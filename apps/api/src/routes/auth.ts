import { Hono } from "hono";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";
import { db } from "@repo/db";
import { users } from "@repo/db/schema";
import type { AppEnv, AuthUser } from "../types.js";

const auth = new Hono<AppEnv>();

const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function issueToken(user: AuthUser) {
  const secret = process.env.JWT_SECRET!;
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { sub: user.id, name: user.name, email: user.email, role: user.role, theme: user.theme, iat: now, exp: now + JWT_EXPIRY_SECONDS },
    secret,
    "HS256",
  );
}

auth.post("/login", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await compare(password, user.passwordHash);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  const token = await issueToken({ id: user.id, name: user.name, email: user.email, role: user.role, theme: user.theme });
  return c.json({ token });
});

auth.get("/me", async (c) => {
  const user = c.get("user");
  return c.json(user);
});

export default auth;

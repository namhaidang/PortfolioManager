import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";
import type { AppEnv } from "../types.js";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.req.path === "/auth/login" || c.req.path === "/health") return next();

  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const token = header.slice(7);
    const secret = process.env.JWT_SECRET!;
    const payload = await verify(token, secret, "HS256");
    c.set("user", {
      id: payload.sub as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
      theme: payload.theme as string,
    });
    return next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
};

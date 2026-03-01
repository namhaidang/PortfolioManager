import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types.js";
import { authMiddleware } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import recurringRulesRoutes from "./routes/recurring-rules.js";
import accountRoutes from "./routes/accounts.js";
import categoryRoutes from "./routes/categories.js";
import userRoutes from "./routes/user.js";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("*", authMiddleware);

app.route("/auth", authRoutes);
app.route("/transactions", transactionRoutes);
app.route("/recurring-rules", recurringRulesRoutes);
app.route("/accounts", accountRoutes);
app.route("/categories", categoryRoutes);
app.route("/user", userRoutes);

app.get("/health", (c) => c.json({ status: "ok" }));

// Runs daily at 08:00 UTC (vercel.json). "Today" is UTC date; users in other timezones may see ±1 day offset.
app.get("/cron/recurring-generate", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const { runRecurringGenerator } = await import("./services/recurring-generator.js");
  const today = new Date().toISOString().slice(0, 10);
  const { generated, errors } = await runRecurringGenerator(today);
  return c.json({ generated, errors });
});

export default app;

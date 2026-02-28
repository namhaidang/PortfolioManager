import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types.js";
import { authMiddleware } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
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
app.route("/accounts", accountRoutes);
app.route("/categories", categoryRoutes);
app.route("/user", userRoutes);

app.get("/health", (c) => c.json({ status: "ok" }));

export default app;

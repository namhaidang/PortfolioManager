import { pgTable, text, boolean, timestamp, date, numeric, integer, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

// ─── User ──────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["owner", "member"] }).notNull().default("member"),
  theme: text("theme", { enum: ["light", "dark"] }).notNull().default("light"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// ─── Account ───────────────────────────────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["brokerage", "bank", "cash", "crypto_wallet", "property"],
  }).notNull(),
  currency: text("currency", { enum: ["VND", "SGD"] }).notNull().default("VND"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// ─── Category ──────────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── Asset ─────────────────────────────────────────────────────────────────────

export const assets = pgTable("assets", {
  id: text("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  assetClass: text("asset_class", {
    enum: ["stock", "etf", "bond", "gold", "crypto", "real_estate", "cash", "other"],
  }).notNull(),
  market: text("market", {
    enum: ["HOSE", "HNX", "UPCOM", "SGX", "CRYPTO", "OTHER"],
  }).notNull(),
  currency: text("currency", { enum: ["VND", "SGD"] }).notNull().default("VND"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// ─── AssetPrice ────────────────────────────────────────────────────────────────

export const assetPrices = pgTable(
  "asset_prices",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id").notNull().references(() => assets.id),
    date: date("date", { mode: "string" }).notNull(),
    price: numeric("price", { precision: 18, scale: 4 }).notNull(),
    source: text("source", { enum: ["scraper", "manual"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("asset_price_unique").on(table.assetId, table.date)],
);

// ─── Transaction ───────────────────────────────────────────────────────────────

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  recordedByUserId: text("recorded_by_user_id").references(() => users.id),
  accountId: text("account_id").notNull().references(() => accounts.id),
  type: text("type", {
    enum: ["income", "expense", "buy", "sell", "dividend", "transfer"],
  }).notNull(),
  categoryId: text("category_id").references(() => categories.id),
  assetId: text("asset_id").references(() => assets.id),
  recurringRuleId: text("recurring_rule_id"),
  date: date("date", { mode: "string" }).notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 6 }),
  unitPrice: numeric("unit_price", { precision: 18, scale: 4 }),
  fee: numeric("fee", { precision: 18, scale: 2 }).default("0"),
  realizedPnl: numeric("realized_pnl", { precision: 18, scale: 2 }),
  notes: text("notes"),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// ─── Holding ───────────────────────────────────────────────────────────────────

export const holdings = pgTable(
  "holdings",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => accounts.id),
    assetId: text("asset_id").notNull().references(() => assets.id),
    quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("0"),
    avgCostBasis: numeric("avg_cost_basis", { precision: 18, scale: 4 }).notNull().default("0"),
    totalCost: numeric("total_cost", { precision: 18, scale: 2 }).notNull().default("0"),
    status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  },
  (table) => [uniqueIndex("holding_unique").on(table.accountId, table.assetId)],
);

// ─── ClosedPosition ────────────────────────────────────────────────────────────

export const closedPositions = pgTable("closed_positions", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id),
  assetId: text("asset_id").notNull().references(() => assets.id),
  totalQuantity: numeric("total_quantity", { precision: 18, scale: 6 }).notNull(),
  totalCost: numeric("total_cost", { precision: 18, scale: 2 }).notNull(),
  totalProceeds: numeric("total_proceeds", { precision: 18, scale: 2 }).notNull(),
  realizedPnl: numeric("realized_pnl", { precision: 18, scale: 2 }).notNull(),
  openDate: date("open_date", { mode: "string" }).notNull(),
  closeDate: date("close_date", { mode: "string" }).notNull(),
  holdingPeriodDays: integer("holding_period_days").notNull(),
});

// ─── RecurringRule ─────────────────────────────────────────────────────────────

export const recurringRules = pgTable("recurring_rules", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  accountId: text("account_id").notNull().references(() => accounts.id),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: text("currency", { enum: ["VND", "SGD"] }).notNull().default("VND"),
  frequency: text("frequency", { enum: ["monthly", "quarterly", "yearly"] }).notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  maxOccurrences: integer("max_occurrences"),
  occurrenceCount: integer("occurrence_count").notNull().default(0),
  description: text("description").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// ─── Budget ────────────────────────────────────────────────────────────────────

export const budgets = pgTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    categoryId: text("category_id").notNull().references(() => categories.id),
    year: integer("year").notNull(),
    yearlyAmount: numeric("yearly_amount", { precision: 18, scale: 2 }).notNull(),
    monthlyBaseLimit: numeric("monthly_base_limit", { precision: 18, scale: 2 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("budget_unique").on(table.userId, table.categoryId, table.year)],
);

// ─── BudgetMonthSnapshot ───────────────────────────────────────────────────────

export const budgetMonthSnapshots = pgTable(
  "budget_month_snapshots",
  {
    id: text("id").primaryKey(),
    budgetId: text("budget_id").notNull().references(() => budgets.id),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    baseLimit: numeric("base_limit", { precision: 18, scale: 2 }).notNull(),
    rolloverAmount: numeric("rollover_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    effectiveLimit: numeric("effective_limit", { precision: 18, scale: 2 }).notNull(),
    manualOverride: numeric("manual_override", { precision: 18, scale: 2 }),
    spent: numeric("spent", { precision: 18, scale: 2 }).notNull().default("0"),
    remaining: numeric("remaining", { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("snapshot_unique").on(table.budgetId, table.month, table.year)],
);

// ─── ExchangeRate ──────────────────────────────────────────────────────────────

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: text("id").primaryKey(),
    fromCurrency: text("from_currency").notNull(),
    toCurrency: text("to_currency").notNull(),
    rate: numeric("rate", { precision: 18, scale: 6 }).notNull(),
    date: date("date", { mode: "string" }).notNull(),
    source: text("source", { enum: ["scraper", "manual"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("fx_rate_unique").on(table.fromCurrency, table.toCurrency, table.date),
  ],
);

// ─── PriceRefreshLog ───────────────────────────────────────────────────────────

export const priceRefreshLogs = pgTable("price_refresh_logs", {
  id: text("id").primaryKey(),
  triggerType: text("trigger_type", { enum: ["manual", "scheduled"] }).notNull(),
  triggeredByUserId: text("triggered_by_user_id").references(() => users.id),
  market: text("market").notNull(),
  assetsRequested: integer("assets_requested").notNull().default(0),
  assetsUpdated: integer("assets_updated").notNull().default(0),
  assetsFailed: integer("assets_failed").notNull().default(0),
  failureDetails: jsonb("failure_details"),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  status: text("status", { enum: ["success", "partial", "failed"] }).notNull(),
});

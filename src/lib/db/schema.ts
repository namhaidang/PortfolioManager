import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// ─── User ──────────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["owner", "member"] }).notNull().default("member"),
  theme: text("theme", { enum: ["light", "dark"] }).notNull().default("light"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── Account ───────────────────────────────────────────────────────────────────

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["brokerage", "bank", "cash", "crypto_wallet", "property"],
  }).notNull(),
  currency: text("currency", { enum: ["VND", "SGD"] }).notNull().default("VND"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── Category ──────────────────────────────────────────────────────────────────

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── Asset ─────────────────────────────────────────────────────────────────────

export const assets = sqliteTable("assets", {
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
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── AssetPrice ────────────────────────────────────────────────────────────────

export const assetPrices = sqliteTable(
  "asset_prices",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id").notNull().references(() => assets.id),
    date: text("date").notNull(), // YYYY-MM-DD
    price: real("price").notNull(),
    source: text("source", { enum: ["scraper", "manual"] }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("asset_price_unique").on(table.assetId, table.date)],
);

// ─── Transaction ───────────────────────────────────────────────────────────────

export const transactions = sqliteTable("transactions", {
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
  date: text("date").notNull(), // YYYY-MM-DD
  amount: real("amount").notNull(),
  quantity: real("quantity"),
  unitPrice: real("unit_price"),
  fee: real("fee").default(0),
  realizedPnl: real("realized_pnl"),
  notes: text("notes"),
  tags: text("tags"), // JSON string array
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── Holding ───────────────────────────────────────────────────────────────────

export const holdings = sqliteTable(
  "holdings",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().references(() => accounts.id),
    assetId: text("asset_id").notNull().references(() => assets.id),
    quantity: real("quantity").notNull().default(0),
    avgCostBasis: real("avg_cost_basis").notNull().default(0),
    totalCost: real("total_cost").notNull().default(0),
    status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  },
  (table) => [uniqueIndex("holding_unique").on(table.accountId, table.assetId)],
);

// ─── ClosedPosition ────────────────────────────────────────────────────────────

export const closedPositions = sqliteTable("closed_positions", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id),
  assetId: text("asset_id").notNull().references(() => assets.id),
  totalQuantity: real("total_quantity").notNull(),
  totalCost: real("total_cost").notNull(),
  totalProceeds: real("total_proceeds").notNull(),
  realizedPnl: real("realized_pnl").notNull(),
  openDate: text("open_date").notNull(),
  closeDate: text("close_date").notNull(),
  holdingPeriodDays: integer("holding_period_days").notNull(),
});

// ─── RecurringRule ─────────────────────────────────────────────────────────────

export const recurringRules = sqliteTable("recurring_rules", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  accountId: text("account_id").notNull().references(() => accounts.id),
  amount: real("amount").notNull(),
  currency: text("currency", { enum: ["VND", "SGD"] }).notNull().default("VND"),
  frequency: text("frequency", { enum: ["monthly", "quarterly", "yearly"] }).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  maxOccurrences: integer("max_occurrences"),
  occurrenceCount: integer("occurrence_count").notNull().default(0),
  description: text("description").notNull(),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// ─── Budget ────────────────────────────────────────────────────────────────────

export const budgets = sqliteTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    categoryId: text("category_id").notNull().references(() => categories.id),
    year: integer("year").notNull(),
    yearlyAmount: real("yearly_amount").notNull(),
    monthlyBaseLimit: real("monthly_base_limit").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("budget_unique").on(table.userId, table.categoryId, table.year)],
);

// ─── BudgetMonthSnapshot ───────────────────────────────────────────────────────

export const budgetMonthSnapshots = sqliteTable(
  "budget_month_snapshots",
  {
    id: text("id").primaryKey(),
    budgetId: text("budget_id").notNull().references(() => budgets.id),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    baseLimit: real("base_limit").notNull(),
    rolloverAmount: real("rollover_amount").notNull().default(0),
    effectiveLimit: real("effective_limit").notNull(),
    manualOverride: real("manual_override"),
    spent: real("spent").notNull().default(0),
    remaining: real("remaining").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("snapshot_unique").on(table.budgetId, table.month, table.year)],
);

// ─── ExchangeRate ──────────────────────────────────────────────────────────────

export const exchangeRates = sqliteTable(
  "exchange_rates",
  {
    id: text("id").primaryKey(),
    fromCurrency: text("from_currency").notNull(),
    toCurrency: text("to_currency").notNull(),
    rate: real("rate").notNull(),
    date: text("date").notNull(),
    source: text("source", { enum: ["scraper", "manual"] }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("fx_rate_unique").on(table.fromCurrency, table.toCurrency, table.date),
  ],
);

// ─── PriceRefreshLog ───────────────────────────────────────────────────────────

export const priceRefreshLogs = sqliteTable("price_refresh_logs", {
  id: text("id").primaryKey(),
  triggerType: text("trigger_type", { enum: ["manual", "scheduled"] }).notNull(),
  triggeredByUserId: text("triggered_by_user_id").references(() => users.id),
  market: text("market").notNull(),
  assetsRequested: integer("assets_requested").notNull().default(0),
  assetsUpdated: integer("assets_updated").notNull().default(0),
  assetsFailed: integer("assets_failed").notNull().default(0),
  failureDetails: text("failure_details"), // JSON
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  status: text("status", { enum: ["success", "partial", "failed"] }).notNull(),
});

# Portfolio & Asset Management System

> A household wealth management system for two users to track income, expenses, investments, and net worth across Vietnam and Singapore markets — reported in VND.

---

## 1. Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 16 (App Router) · TypeScript |
| API | Hono · TypeScript |
| UI | Tailwind CSS · shadcn/ui · Recharts |
| Database | PostgreSQL (Neon serverless) · Drizzle ORM |
| Auth | JWT (signed, localStorage) — standalone API auth |
| Scraping | Cheerio + server-side fetch |
| AI Vision | OpenAI GPT-4o / Google Gemini (screenshot extraction) |
| Scheduling | node-cron (in-process) |
| Hosting | Vercel (Next.js + Hono serverless) · Neon (Postgres, Singapore region) |
| Testing | Vitest (API integration) · Playwright (E2E) |
| CI/CD | GitHub Actions · Turborepo remote caching |

---

## 2. Project Structure (Monorepo)

npm workspaces monorepo with Turborepo for task orchestration.

```
PortfolioManager/
├── .github/
│   └── workflows/                  # CI/CD pipelines
│       └── ci.yml                  # Build on push & PR
├── apps/
│   ├── api/                        # Hono API server (Vercel serverless)
│   │   ├── src/
│   │   │   ├── index.ts            # Hono app entry, route registration
│   │   │   ├── routes/             # Route handlers
│   │   │   │   ├── auth.ts         # POST /auth/login
│   │   │   │   ├── transactions.ts # CRUD + summary
│   │   │   │   ├── accounts.ts     # CRUD
│   │   │   │   ├── categories.ts   # List
│   │   │   │   └── user.ts         # Profile update
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts         # JWT verification middleware
│   │   │   └── services/           # Business logic
│   │   │       └── cashflow.ts     # Monthly summary aggregation
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                        # Next.js 16 frontend (pure UI, no DB access)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/         # Login page
│       │   │   └── (app)/          # Authenticated shell
│       │   │       ├── dashboard/
│       │   │       ├── income/
│       │   │       ├── expenses/
│       │   │       ├── portfolio/
│       │   │       ├── budgets/
│       │   │       ├── reports/
│       │   │       └── settings/
│       │   ├── components/
│       │   │   ├── ui/             # shadcn/ui primitives
│       │   │   ├── transactions/   # TransactionPage, Form, Table, Filters, Summary
│       │   │   ├── settings/       # AccountsSection
│       │   │   ├── charts/
│       │   │   └── layout/         # Shell, sidebar, nav
│       │   ├── lib/
│       │   │   ├── api-client.ts   # Typed fetch wrapper (attaches JWT, handles errors)
│       │   │   ├── auth-context.tsx # AuthProvider, useAuth() hook
│       │   │   └── utils.ts        # Re-exports from @repo/shared
│       │   └── hooks/
│       ├── next.config.ts
│       └── package.json
├── packages/
│   ├── db/                         # Database layer (used by apps/api only)
│   │   ├── src/
│   │   │   ├── schema.ts           # Drizzle 13-table Postgres schema
│   │   │   ├── index.ts            # Neon DB client
│   │   │   └── seed.ts             # Seed script
│   │   ├── drizzle/                # Generated migrations
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   └── shared/                     # Shared utilities & types
│       ├── src/
│       │   ├── utils.ts            # cn(), newId(), formatCurrency()
│       │   └── types.ts            # Domain types (Currency, AccountType, etc.)
│       └── package.json
├── package.json                    # Workspace root
├── turbo.json                      # Turborepo task config
└── ARCHITECTURE.md
```

Internal packages use `@repo/db` and `@repo/shared` import aliases. `@repo/db` is consumed only by `apps/api`; `@repo/shared` is consumed by both apps.

**Database migrations**: After schema changes, run `npm run db:push` (or `db:generate` + migrate) before first use.

**Environment variables** (set in Vercel dashboard and local `.env`):

| Variable | App | Purpose |
|----------|-----|---------|
| `DATABASE_URL` | `apps/api` | Neon Postgres connection string |
| `JWT_SECRET` | `apps/api` | JWT signing key |
| `CRON_SECRET` | `apps/api` | Secret for Vercel cron auth (recurring generator) |
| `CORS_ORIGIN` | `apps/api` | Allowed frontend origin(s) |
| `NEXT_PUBLIC_API_URL` | `apps/web` | API base URL (e.g. `https://portfolio-api.vercel.app`) |

---

## 3. Authentication & Users

- **Two household users** (husband and wife) with email + password login.
- **Roles**: `owner` (full admin) · `member` (full access to own data + shared household views).
- **Views**: Dashboard supports **My View**, **Partner View**, and **Household** (combined).
- Either user can record transactions on behalf of the other.
- Theme preference per user (light default, dark optional) in Settings.

### Auth Architecture

The API server owns authentication. No NextAuth — pure JWT flow.

1. Frontend `POST`s credentials to `API_URL/auth/login`.
2. API verifies password (bcrypt), returns signed JWT (`{ id, name, email, role, theme }`, HS256, long-lived).
3. Frontend stores JWT in `localStorage`, includes it as `Authorization: Bearer <token>` on all API calls.
4. API middleware verifies JWT signature + expiry on every protected route.
5. Frontend `AuthProvider` context reads/decodes the JWT, provides `useAuth()` hook, redirects to `/login` if missing/expired.
6. Logout = clear `localStorage` + redirect.

---

## 4. Currency

- **Primary**: VND — all dashboards, totals, and reports display in VND.
- **Secondary**: SGD — used for Singapore-based accounts and assets.
- SGD values convert to VND using the latest scraped exchange rate.
- Historical net worth snapshots preserve the exchange rate at time of capture.

---

## 5. Data Model

### Entity Relationships

```
User ──1:N── Transaction, RecurringRule, Budget
Account ──1:N── Transaction, Holding
Asset ──1:N── Holding, AssetPrice, ClosedPosition, Transaction
Category ──1:N── Transaction, RecurringRule, Budget
Budget ──1:N── BudgetMonthSnapshot
RecurringRule ──1:N── Transaction (generated)
```

### Type Conventions

With Postgres (via Neon), the schema uses proper native types:

| Domain | Postgres Type | Drizzle Builder | Notes |
|--------|--------------|-----------------|-------|
| Primary keys | `TEXT` | `text()` | ULID strings |
| Strings & enums | `TEXT` | `text()` | Postgres enums are an option but TEXT keeps it simple |
| Booleans | `BOOLEAN` | `boolean()` | Native `true`/`false` (replaces SQLite `INTEGER 0/1`) |
| Timestamps | `TIMESTAMP` | `timestamp()` | Native timestamp with time zone |
| Dates | `DATE` | `date()` | Native `YYYY-MM-DD` (replaces SQLite `TEXT`) |
| Money / amounts | `NUMERIC(18,2)` | `numeric()` | Exact decimal — no floating-point rounding |
| Prices | `NUMERIC(18,4)` | `numeric()` | 4 decimal places for unit prices |
| Quantities | `NUMERIC(18,6)` | `numeric()` | 6 decimal places for fractional shares / crypto |
| Exchange rates | `NUMERIC(18,6)` | `numeric()` | High precision for currency conversion |
| Integers | `INTEGER` | `integer()` | Counts, sort orders, periods |
| JSON | `JSONB` | `jsonb()` | Binary JSON with indexing (replaces SQLite `TEXT` JSON) |

### Entities

**User**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| name | TEXT | Display name |
| email | TEXT | Unique, login |
| passwordHash | TEXT | |
| role | TEXT | `owner` · `member` |
| theme | TEXT | `light` · `dark` |
| createdAt | TIMESTAMP | |

**Account**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| userId | TEXT | FK → User |
| name | TEXT | e.g. "VPS Securities", "DBS Savings" |
| type | TEXT | `brokerage` · `bank` · `cash` · `crypto_wallet` · `property` |
| currency | TEXT | `VND` · `SGD` |
| isActive | BOOLEAN | Soft-delete |
| createdAt | TIMESTAMP | |

**Category**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| name | TEXT | |
| type | TEXT | `income` · `expense` |
| icon | TEXT | Icon identifier |
| sortOrder | INTEGER | Display order |

Income categories: Salary, Business Income, Dividends, Interest, Rental Income, Investment Income / Capital Gains, Freelance, Gifts, Other.

Expense categories (flat): Housing, Food, Transport, Utilities, Insurance, Healthcare, Entertainment, Education, Subscriptions, Childcare, Gifts, Travel, Clothing, Personal Care, Donations, Taxes, Loan Repayment, Other.

**Asset**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| symbol | TEXT | e.g. `VNM`, `D05.SI` |
| name | TEXT | e.g. "Vinamilk", "DBS Group" |
| assetClass | TEXT | `stock` · `etf` · `bond` · `gold` · `crypto` · `real_estate` · `cash` · `other` |
| market | TEXT | `HOSE` · `HNX` · `UPCOM` · `SGX` · `CRYPTO` · `OTHER` |
| currency | TEXT | `VND` · `SGD` |
| isActive | BOOLEAN | |
| createdAt | TIMESTAMP | |

**AssetPrice**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| assetId | TEXT | FK → Asset |
| date | DATE | Closing date |
| price | NUMERIC(18,4) | Closing price in asset currency |
| source | TEXT | `scraper` · `manual` |
| createdAt | TIMESTAMP | |

**Transaction**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| userId | TEXT | FK → User (owner) |
| recordedByUserId | TEXT | FK → User (who entered it) |
| accountId | TEXT | FK → Account |
| type | TEXT | `income` · `expense` · `buy` · `sell` · `dividend` · `transfer` |
| categoryId | TEXT | FK → Category (income/expense only) |
| assetId | TEXT | FK → Asset (buy/sell/dividend — links dividends to source stock) |
| recurringRuleId | TEXT | FK → RecurringRule (if auto-generated) |
| date | DATE | Transaction date |
| amount | NUMERIC(18,2) | Total in account currency |
| quantity | NUMERIC(18,6) | Units (asset txns) |
| unitPrice | NUMERIC(18,4) | Per-unit price (asset txns) |
| fee | NUMERIC(18,2) | Commission |
| realizedPnl | NUMERIC(18,2) | Auto-calculated on sell |
| notes | TEXT | |
| tags | JSONB | Array of tag strings |
| createdAt | TIMESTAMP | |

**Holding**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| accountId | TEXT | FK → Account |
| assetId | TEXT | FK → Asset |
| quantity | NUMERIC(18,6) | Current units |
| avgCostBasis | NUMERIC(18,4) | Average cost per unit |
| totalCost | NUMERIC(18,2) | Total invested |
| status | TEXT | `open` · `closed` |

**ClosedPosition**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| accountId | TEXT | FK → Account |
| assetId | TEXT | FK → Asset |
| totalQuantity | NUMERIC(18,6) | Total shares held |
| totalCost | NUMERIC(18,2) | Total cost basis |
| totalProceeds | NUMERIC(18,2) | Total sale proceeds |
| realizedPnl | NUMERIC(18,2) | Net gain/loss |
| openDate | DATE | First buy date |
| closeDate | DATE | Final sell date |
| holdingPeriodDays | INTEGER | |

**RecurringRule**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| userId | TEXT | FK → User |
| type | TEXT | `income` · `expense` |
| categoryId | TEXT | FK → Category |
| accountId | TEXT | FK → Account |
| amount | NUMERIC(18,2) | Per occurrence |
| currency | TEXT | `VND` · `SGD` |
| frequency | TEXT | `monthly` · `quarterly` · `yearly` |
| startDate | DATE | |
| endDate | DATE | Nullable |
| maxOccurrences | INTEGER | Nullable (alternative to endDate) |
| occurrenceCount | INTEGER | Generated so far |
| description | TEXT | e.g. "Monthly Salary" |
| notes | TEXT | |
| isActive | BOOLEAN | Can be paused |
| createdAt | TIMESTAMP | |

**Budget**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| userId | TEXT | FK → User |
| categoryId | TEXT | FK → Category |
| year | INTEGER | e.g. 2026 |
| yearlyAmount | NUMERIC(18,2) | Annual total (VND) |
| monthlyBaseLimit | NUMERIC(18,2) | yearlyAmount ÷ 12 |
| isActive | BOOLEAN | |
| createdAt | TIMESTAMP | |

**BudgetMonthSnapshot**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| budgetId | TEXT | FK → Budget |
| month | INTEGER | 1–12 |
| year | INTEGER | |
| baseLimit | NUMERIC(18,2) | From Budget |
| rolloverAmount | NUMERIC(18,2) | Surplus/deficit from previous month |
| effectiveLimit | NUMERIC(18,2) | baseLimit + rolloverAmount |
| manualOverride | NUMERIC(18,2) | Nullable user override |
| spent | NUMERIC(18,2) | Running total |
| remaining | NUMERIC(18,2) | |
| createdAt | TIMESTAMP | |

**ExchangeRate**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| fromCurrency | TEXT | e.g. `SGD` |
| toCurrency | TEXT | e.g. `VND` |
| rate | NUMERIC(18,6) | High precision for currency conversion |
| date | DATE | Rate date |
| source | TEXT | `scraper` · `manual` |
| createdAt | TIMESTAMP | |

**PriceRefreshLog**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| triggerType | TEXT | `manual` · `scheduled` |
| triggeredByUserId | TEXT | Null for scheduled |
| market | TEXT | `HOSE` · `HNX` · `SGX` · `FX` · `ALL` |
| assetsRequested | INTEGER | |
| assetsUpdated | INTEGER | |
| assetsFailed | INTEGER | |
| failureDetails | JSONB | Array of `{ symbol, error }` objects |
| startedAt | TIMESTAMP | |
| completedAt | TIMESTAMP | |
| status | TEXT | `success` · `partial` · `failed` |

---

## 6. User Flows

### 6.1 Record Income

Either user can record income for themselves **or on behalf of their partner**.

**Form fields**: For User (default: self), Date (default: today), Category, Asset Link (required for Dividends and Investment Income — ties to source stock), Amount + Currency, Account, Notes, Tags.

**Recurring toggle** reveals: Frequency (monthly / quarterly / yearly), Start Date, End Condition ("no end" / specific date / after N occurrences). Creates a **Recurring Rule** that auto-generates transactions on each due date.

**Manage Recurring Income** page: list all rules (active/paused), edit amounts (e.g. salary adjustment), change end dates, pause/resume, view generated transaction history.

**Dividend income**: Recorded with category "Dividends" + required Asset Link. Appears in both Income history and Portfolio dividend analytics for the linked stock.

**Investment income**: When a sell transaction closes (Flow 6.4), the realized P&L is auto-recorded as Investment Income (gain) or Investment Loss (loss), linked to the asset.

---

### 6.2 Record Expense

Either user can record expenses for themselves **or on behalf of their partner**.

**Form fields**: For User, Date, Category (flat dropdown), Amount + Currency, Account, Notes, Tags (needs / wants / tax-deductible).

On save, if a budget exists for the category → check against limit → warn if near or over budget.

**Recurring toggle** and **Manage Recurring Expenses** page — identical mechanics to income (frequency, end condition, edit, pause, history).

---

### 6.3 Buy Asset

1. Select brokerage account.
2. Search/create asset (symbol, name, class, market, currency).
3. Enter: Date, Quantity, Unit Price, Fee.
4. System shows auto-calculated **Total Cost** = Qty × Price + Fee.
5. Save → `buy` transaction created → Holding created or updated (quantity up, average cost recalculated).

**Screenshot shortcut**: Upload brokerage screenshot → AI extracts ticker, qty, price, fee, date → pre-fills form → user reviews and confirms. Image is **not stored**.

---

### 6.4 Sell Asset

1. Select holding → "Sell".
2. Pre-filled: asset, account, current quantity.
3. Enter: Date, Quantity (≤ holding), Sell Price, Fee.
4. System shows **Net Proceeds** = Qty × Price − Fee and **Realized P&L** = Proceeds − (Qty × Avg Cost).
5. Save → `sell` transaction created → Holding reduced (closed if qty = 0) → P&L auto-recorded as Investment Income (Flow 6.1).

**Closed Positions**: All fully sold positions preserved with total cost, proceeds, P&L, holding period — for audit, tax, and analytics.

---

### 6.5 Refresh Prices

**On-demand**: User clicks "Refresh Prices" → system scrapes Vietnam (cafef.vn etc.), Singapore (SGX sources), and SGD/VND exchange rate → progress indicator → summary of results → failed assets flagged for manual entry.

**Scheduled**: Daily cron runs silently after market close (Vietnam ~15:15 ICT, Singapore ~17:15 SGT). No user notification.

**Audit log**: Every refresh (manual or scheduled) logs: timestamp, trigger type, market, counts (requested / updated / failed), failure details. Viewable and filterable from the UI.

**Price history charts**: Each asset detail page shows closing price over time (1M, 3M, 6M, 1Y, all-time), built from scraped and manual entries.

**Manual entry**: Fallback for assets without scrapeable sources.

---

### 6.6 Screenshot Trade Entry

A shortcut for Flows 6.3/6.4 — not a separate feature.

1. Upload screenshot (PNG / JPG / WEBP) via drag-and-drop or file picker.
2. AI vision API extracts: action (buy/sell), ticker, quantity, price, fee, date.
3. Extracted data pre-fills the buy or sell form.
4. User reviews, corrects if needed, and saves normally.
5. Image discarded — only the confirmed transaction is persisted.

---

### 6.7 Dashboard

**Default landing page** after login. Light theme by default (dark available in Settings).

| Section | Content |
|---------|---------|
| **Header** | Total net worth (VND), change vs last month, view toggle (My / Partner / Household) |
| **KPI Cards** | Monthly Income · Monthly Expenses · Net Cash Flow · Savings Rate · Portfolio Value · Return MTD · Return YTD |
| **Charts** | Net worth trend (line, monthly, 1–2 yr) · Wealth composition (donut by asset class/market) |
| **Portfolio** | Top 5–10 holdings by value with current price, daily change, unrealized P&L |
| **Activity** | Latest 10 transactions across all types |
| **Budgets** | Mini progress bars for top categories (spent vs limit) |

**User Settings** (profile menu): theme toggle, display name, password, currency display preference.

---

### 6.8 Budgets

**Create**: Select expense category → enter **Yearly Budget** (VND) → system calculates Monthly Base Limit (÷ 12) → assign to a year.

**Monthly lifecycle**: Each month auto-creates a snapshot. Unspent surplus (or deficit) from the previous month **rolls over** into the next month's effective limit.

> Example: Jan limit 5M, spent 4M → Feb effective = 5M + 1M rollover = 6M.

**Yearly lifecycle**: Year-end remaining budget rolls into next year. User can accept or adjust.

**Monthly override**: Any month's effective limit can be manually overridden (e.g. higher budget for Tet).

**Budget dashboard**: All active budgets with progress bars per category. Color: green (<70%), yellow (70–90%), red (>90%), over-budget marker. Columns: category, base limit, rollover, effective limit, spent, remaining.

---

### 6.9 Reports

**Priority** (built first): Asset Allocation, Portfolio Performance.

| Report | Description |
|--------|-------------|
| **Asset Allocation** | Breakdown by asset class, market (VN/SG), holding. Target vs actual. Rebalancing suggestions. Pie/donut + table. |
| **Portfolio Performance** | By asset, class, market. Metrics: return %, XIRR, unrealized/realized P&L. Periods: MTD, QTD, YTD, 1Y, 3Y, custom. Line charts + tables. |
| **Income vs Expense** | Monthly/quarterly/annual comparison by category. Trend charts. |
| **Dividend Summary** | By asset and period. Yield per holding. Growth over time. |
| **Cash Flow Statement** | Monthly inflows vs outflows. Net cash flow trend. |
| **Financial Health Score** | Composite: savings rate, diversification, emergency fund, debt ratio. Gauge + breakdown. |

**Parameters**: Date range (month / quarter / year / custom) · User filter (me / partner / household) · Export (CSV / PDF).

---

## 7. Market Data

### Sources

| Market | Sources | Schedule |
|--------|---------|----------|
| Vietnam (HOSE, HNX, UPCOM) | cafef.vn · vietstock.vn · stockbiz.vn · simplize.vn | Daily ~15:15 ICT or on-demand |
| Singapore (SGX) | sgx.com · shareinvestor.com · Yahoo Finance | Daily ~17:15 SGT or on-demand |
| FX (SGD ↔ VND) | x-rates.com · exchangerate.host · VN bank sites | Daily or on-demand |

### Collection Modes

| Mode | Trigger |
|------|---------|
| On-demand | "Refresh Prices" button in UI |
| Scheduled | Daily cron (silent, logged to audit) |
| Manual | Direct price entry in UI |

Method: Server-side fetch + Cheerio HTML parsing.

---

## 8. Testing

Two testing layers: **API integration tests** (Vitest, in-process) and **browser E2E tests** (Playwright, full-stack).

### Structure

```
apps/
├── api/__tests__/              # API integration tests (Vitest)
│   ├── helpers.ts              # Shared: getTestToken(), authHeaders(), app instance
│   ├── health.test.ts          # GET /health
│   ├── auth.test.ts            # POST /auth/login, GET /auth/me
│   ├── categories.test.ts      # GET /categories
│   ├── accounts.test.ts        # CRUD /accounts
│   ├── transactions.test.ts    # CRUD /transactions, GET /transactions/summary
│   └── user.test.ts            # GET /user, PATCH /user/profile
├── api/vitest.config.ts        # Vitest config (custom .env loader, timeouts)
└── web/e2e/                    # Browser E2E tests (Playwright)
    ├── helpers.ts              # login(), API helpers for test data setup/teardown
    ├── phase1.spec.ts          # Login, navigation, theme, sign-out (10 tests)
    ├── phase3.spec.ts          # Income/expense CRUD, filters, accounts, dashboard KPIs (10 tests)
    └── phase4.spec.ts          # JWT lifecycle, API connectivity, profile updates (9 tests)
```

### API Integration Tests (Vitest)

- **35 tests** across 6 test files covering all API endpoints
- Uses Hono's `app.request()` for in-process testing — no HTTP server needed
- Connects to real Neon database (requires `DATABASE_URL` and `JWT_SECRET` in `.env`)
- Shared `getTestToken()` caches a JWT from `/auth/login` for authenticated requests
- Run: `npm run test:api` (root) or `vitest run` (from `apps/api`)

### E2E Tests (Playwright)

- **29 tests** across 3 spec files testing full browser flows
- Playwright auto-starts both servers via `webServer` config (API on `:3001`, frontend on `:3000`)
- `data-testid` attributes on key UI elements for stable selectors (select-category, select-account, edit-transaction, delete-transaction, filter-user, filter-category, accounts-section, kpi-net-worth, user-menu-trigger)
- **Test isolation**: dependent tests use API-level setup (`createTransactionViaAPI`) instead of relying on prior test state
- **Per-test cleanup**: each test cleans up its created data via API helpers (`deleteTransactionViaAPI`, `deleteAccountViaAPI`, `findLatestTransactionViaAPI`, `findAccountByNameViaAPI`)
- Unique timestamped names for accounts to prevent cross-test interference
- CI: `retries: 1` with trace on first retry; locally: `retries: 0`
- Run: `npm run e2e` (root)

### CI/CD Integration

```
GitHub Actions CI workflow (.github/workflows/ci.yml)

┌─────────────────────────────────────────────────┐
│  Triggers: push (master), PR, workflow_dispatch  │
└──────────────────────┬──────────────────────────┘
                       │
              ┌────────▼────────┐
              │   ci (always)   │  build + type-check (tsc --noEmit)
              │   ~40s          │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  e2e (optional) │  Playwright full-stack browser tests
              │  ~2.5 min       │  Runs on: PRs, manual dispatch
              └─────────────────┘
```

- **`ci` job**: runs on every push and PR — `npm ci` → `turbo build` → `turbo lint --filter=@repo/api`
- **`e2e` job**: runs on PRs (automatic) and `workflow_dispatch` with `run_e2e=true` (manual) — installs Chromium, creates `.env` from secrets, starts both servers, runs Playwright
- Manual trigger: `gh workflow run CI --field run_e2e=true --ref master`
- Failure artifacts: screenshots + traces uploaded to GitHub (7-day retention)
- API integration tests run locally only (require seeded database)

### Running Tests

| Command | Scope | Where |
|---------|-------|-------|
| `npm run test:api` | API integration (Vitest) | Root |
| `npm run e2e` | Browser E2E (Playwright) | Root |
| `vitest run` | API integration | `apps/api` |
| `npx playwright test` | Browser E2E | `apps/web` |

---

## 9. Implementation Phases

| Phase | Scope | Key Deliverables |
|-------|-------|------------------|
| **1. Foundation** | Project scaffolding | Next.js + Tailwind + shadcn/ui setup, Drizzle schema, NextAuth (2 users), app shell with sidebar/nav/theme, seed categories & accounts |
| **2. Cloud Infrastructure** | Database & deployment | Migrate SQLite → Neon Postgres, rewrite schema with native PG types (boolean, timestamp, numeric, jsonb), deploy to Vercel, GitHub Actions CI/CD pipeline, Turborepo remote caching, environment configuration |
| **3. Income & Expenses** | Transaction tracking | Income/expense CRUD, on-behalf recording, category & account management UI, transaction list (filter/sort/search), monthly summaries |
| **4. API Extraction** | Frontend/backend split | Extract API into standalone Hono server (`apps/api`), replace NextAuth with JWT auth, convert web app to pure frontend with no DB access, second Vercel project, CORS, CI/CD update |
| **5. Recurring Rules** | Automation | Recurring rule CRUD (income & expense), auto-generation of transactions, manage page (list/edit/pause/history) |
| **6. Portfolio Core** | Investment tracking | Asset registry, buy/sell recording (avg cost), holdings engine, closed positions history, dividend recording linked to income, capital gains auto-linking |
| **7. Market Data** | Pricing engine | Vietnam & Singapore scrapers, FX scraper, on-demand + scheduled refresh, audit log, price history charts, manual entry, screenshot-assisted trade entry (AI) |
| **8. Dashboard** | Wealth overview | Net worth engine, dashboard (KPIs/charts/activity/budgets), net worth trend, wealth composition, view toggle (my/partner/household) |
| **9. Budgeting** | Spend control | Yearly budget CRUD, monthly snapshots with rollover, yearly rollover, monthly override, budget dashboard with progress bars, cash flow & savings rate |
| **10. Reports** | Analytics | Asset Allocation + Portfolio Performance (priority), income/expense report, dividend summary, cash flow, financial health score, CSV/PDF export |
| **11. Polish & Optimize** | Production hardening | Responsive UI audit, CSV import/export, DB backup strategy, performance tuning, error handling, accessibility pass |

### Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Foundation | **Complete** | App shell, auth, sidebar, theme, placeholder pages, Playwright e2e |
| 2. Cloud Infrastructure | **Complete** | Neon Postgres (Singapore), Vercel deployment, GitHub Actions CI |
| 3. Income & Expenses | **Complete** | Transaction CRUD, on-behalf recording, account management, monthly summaries, dashboard KPIs |
| 4. API Extraction | **Complete** | Hono API server, JWT auth, frontend refactored to pure client, Vercel deployment, E2E + API test suites |
| 5. Recurring Rules | **Complete** | Recurring rule CRUD, on-behalf support, Settings RecurringSection, Income/Expense form toggle, Vercel cron generator |
| 6–11 | Not started | |

### Phase 2 Changelog

- Migrated database from SQLite (`@libsql/client`) to **Neon serverless Postgres** (`@neondatabase/serverless`)
- Rewrote all 13 tables in `packages/db/src/schema.ts` from `sqliteTable` to `pgTable` with native Postgres types: `boolean`, `timestamp`, `date`, `numeric(precision, scale)`, `jsonb`
- Switched Drizzle driver from `drizzle-orm/libsql` to `drizzle-orm/neon-http`
- DB connection uses lazy proxy pattern in `packages/db/src/index.ts` to avoid build-time evaluation
- Deployed to **Vercel** with `apps/web` as root directory, auto-deploys on push to `master`
- Added **GitHub Actions** CI pipeline (`.github/workflows/ci.yml`) — runs `turbo run build` on every push and PR
- Database hosted on Neon free tier, Singapore region (`aws-ap-southeast-1`)
- Environment variables: `DATABASE_URL` (Neon connection string), `AUTH_SECRET` (NextAuth signing key)
- Removed `data/` local SQLite directory, `@libsql/client` dependency, and `serverExternalPackages` config

### Phase 3 Changelog

- Added **6 API routes**: `GET /api/categories`, `GET/POST /api/accounts`, `PATCH /api/accounts/[id]`, `GET/POST /api/transactions`, `PATCH/DELETE /api/transactions/[id]`, `GET /api/transactions/summary`
- Created **cashflow service** (`lib/services/cashflow.ts`) — single-query monthly summary aggregation with previous-month comparison using SQL `CASE WHEN` in Drizzle
- Built **shared transaction components** (`components/transactions/`): `TransactionPage` (client orchestrator), `TransactionForm` (dialog with calendar date picker, on-behalf user select, category/account dropdowns, expense tags), `TransactionTable` (paginated data table with edit/delete), `TransactionFilters` (user/category/account/date/search with 300ms debounce), `MonthlySummary` (current vs previous month cards)
- Replaced **Income** and **Expenses** placeholder pages with full transaction list + form, backed by server-side data fetching for dropdown reference data (users, categories, accounts)
- Added **Account management** section to Settings (`components/settings/accounts-section.tsx`) — create new accounts, activate/deactivate existing ones
- Wired **Dashboard** Monthly Income and Monthly Expenses KPI cards to real data via `getMonthlySummary()`
- Added shadcn/ui primitives: `dialog`, `table`, `calendar`, `popover`, `badge`, `textarea`
- Added dependencies: `react-day-picker` ^9.14.0, `date-fns` ^4.1.0
- Added shared utilities: `parseNumeric()`, `formatDate()` in `@repo/shared`
- Added `lib/types.ts` with shared Phase 3 types: `HouseholdUser`, `CategoryOption`, `AccountOption`, `TransactionRow`, `MonthlySummaryData`

### Phase 5 Changelog

- Added `recordedByUserId` to `recurringRules` schema for on-behalf audit
- Created **recurring-rules API** (`GET/POST/PATCH/DELETE /recurring-rules`) with nextDueDate computed per rule
- Added `recurringRuleId` filter to `GET /transactions`
- Created **recurring-generator service** — daily cron generates transactions from active rules (monthly/quarterly/yearly)
- Added **Vercel Cron** route `GET /cron/recurring-generate` (CRON_SECRET auth), schedule `0 8 * * *` UTC. **Note**: Cron runs at 08:00 UTC; "today" for due-date checks is UTC date. Users in other timezones may see transactions generated on the previous or next local date.
- **RecurringSection** in Settings — list, create, edit, pause/resume, delete rules; For User defaults to current user
- **Recurring toggle** on Income/Expense forms — when enabled, creates RecurringRule instead of one-off transaction
- Auth middleware skips JWT for `/cron/*` paths
- Added `RecurringRuleRow` to `@repo/shared/types`; `date-fns` to `apps/api`

### Phase 4 Plan — API Extraction & Auth Refactor

**Goal**: Split the monolith into a standalone Hono API (`apps/api`) and a pure frontend (`apps/web`), enabling multi-client support (web, future mobile).

#### Step 1 — Create `apps/api` (Hono on Vercel serverless)

- Scaffold `apps/api` with Hono, TypeScript, `@repo/db`, `@repo/shared`
- Configure `tsconfig.json`, `package.json` (with `build` script), `vercel.json` if needed
- Wire into Turborepo: update `turbo.json` outputs to include `dist/**`
- Add CORS middleware (reads `CORS_ORIGIN` env var)

#### Step 2 — Implement standalone JWT auth on the API

- `POST /auth/login` — validate email + password (bcrypt), return signed JWT (HS256, `jsonwebtoken`)
- `GET /auth/me` — return current user from JWT (for token validation / user info refresh)
- Auth middleware: verify JWT on all routes except `/auth/login`, extract user into request context
- JWT payload: `{ sub: userId, name, email, role, theme, iat, exp }`

#### Step 3 — Migrate route handlers from Next.js to Hono

| Current (Next.js) | New (Hono) | Notes |
|--------------------|------------|-------|
| `GET /api/categories` | `GET /categories` | Direct port |
| `GET/POST /api/accounts` | `GET/POST /accounts` | Direct port |
| `PATCH /api/accounts/[id]` | `PATCH /accounts/:id` | Direct port |
| `GET/POST /api/transactions` | `GET/POST /transactions` | Direct port |
| `PATCH/DELETE /api/transactions/[id]` | `PATCH/DELETE /transactions/:id` | Direct port |
| `GET /api/transactions/summary` | `GET /transactions/summary` | Direct port |
| `PATCH /api/user/profile` | `PATCH /user/profile` | Returns updated JWT |

- Move `lib/services/cashflow.ts` to `apps/api/src/services/`
- Move `lib/types.ts` domain types to `@repo/shared/types`

#### Step 4 — Refactor `apps/web` to pure frontend

- **Remove** `@repo/db` dependency — no direct database access from frontend
- **Remove** `next-auth` — delete `src/auth.ts` and all NextAuth imports
- **Remove** `src/app/api/` directory — no more Next.js API routes
- **Create** `lib/auth-context.tsx` — `AuthProvider` + `useAuth()` hook (reads JWT from localStorage, decodes for user info, redirects to `/login` on missing/expired token)
- **Create** `lib/api-client.ts` — typed fetch wrapper that auto-attaches `Authorization: Bearer` header and handles 401 → logout
- **Convert** server-component pages that queried DB directly (`expenses/page.tsx`, `income/page.tsx`, `dashboard/page.tsx`) to client-side data fetching via `api-client`
- **Convert** `(app)/layout.tsx` from server-side `auth()` to client-side `AuthProvider` guard
- **Update** `login/page.tsx` to call `POST API_URL/auth/login` and store JWT
- **Update** `user-menu.tsx` to clear localStorage on sign-out
- **Update** `settings/page.tsx` to use `useAuth()` instead of `useSession()`

#### Step 5 — Update CI/CD & deployment

**GitHub Actions** (`ci.yml`):
- Replace env vars: `AUTH_SECRET` → `JWT_SECRET`, add `NEXT_PUBLIC_API_URL=http://localhost:3001`
- No structural changes — `npx turbo run build` already discovers all workspace apps

**Vercel**:
- Create second Vercel project for `apps/api` (root directory: `apps/api`)
- Existing project (`apps/web`) keeps root directory `apps/web`
- Each project gets filtered build: `turbo run build --filter=@repo/web` / `--filter=@repo/api`
- Update env vars per project (see Environment variables table above)
- Both projects auto-deploy on push to `master`

**Local dev**:
- `turbo run dev` starts both apps: web on `:3000`, API on `:3001`
- `.env` in `apps/api`: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN=http://localhost:3000`
- `.env` in `apps/web`: `NEXT_PUBLIC_API_URL=http://localhost:3001`

#### Step 6 — Verify & clean up

- Run full e2e test suite against the new architecture
- Remove dead code: `next-auth` types in `@repo/shared/types.ts`, unused proxy files
- Update `.env.example` with new variable layout
- Verify Vercel preview deployments work for both projects on PRs

#### Confidence: 8/10

Lowest-confidence area is the auth provider UX (avoiding flash of unauthenticated content, token expiry handling). Everything else is mechanical migration. The codebase is small (~30 source files) and patterns are consistent.

---

## 10. Future Considerations

- Loan & liability tracking with amortization
- Goal-based savings (retirement, education, travel)
- Bank statement import (PDF/CSV parsing)
- Mobile app (React Native or PWA) — enabled by Phase 4 API extraction
- AI-powered financial advice & anomaly detection
- Vietnamese banking API integration
- Read replicas (Neon branching) for analytics workloads
- Staging environment via Neon database branching (zero-copy clones)

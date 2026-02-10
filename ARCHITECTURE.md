# Portfolio & Asset Management System

> A household wealth management system for two users to track income, expenses, investments, and net worth across Vietnam and Singapore markets — reported in VND.

---

## 1. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) · TypeScript |
| UI | Tailwind CSS · shadcn/ui · Recharts |
| Database | SQLite (@libsql/client) · Drizzle ORM |
| Auth | NextAuth.js v5 (beta) — credentials provider |
| Scraping | Cheerio + server-side fetch |
| AI Vision | OpenAI GPT-4o / Google Gemini (screenshot extraction) |
| Scheduling | node-cron (in-process) |
| Deployment | Cloud-ready (Fly.io / Railway / Docker) — TBD |

---

## 2. Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Login & registration
│   ├── (app)/                  # Authenticated shell
│   │   ├── dashboard/
│   │   ├── income/
│   │   ├── expenses/
│   │   ├── portfolio/
│   │   ├── budgets/
│   │   ├── reports/
│   │   └── settings/
│   └── api/                    # Route handlers
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── charts/
│   ├── forms/
│   └── layout/                 # Shell, sidebar, nav
├── lib/
│   ├── db/                     # Schema, client, migrations
│   ├── auth/
│   ├── services/               # portfolio, cashflow, networth, budget
│   ├── scrapers/               # vietnam, singapore, fx-rate
│   ├── ocr/                    # AI vision extraction
│   ├── scheduler/              # Cron jobs
│   └── currency.ts
├── hooks/
└── types/
```

Additional root files: `drizzle/` (migrations), `data/` (SQLite file — gitignored), config files.

---

## 3. Authentication & Users

- **Two household users** (husband and wife) with email + password login.
- **Roles**: `owner` (full admin) · `member` (full access to own data + shared household views).
- **Views**: Dashboard supports **My View**, **Partner View**, and **Household** (combined).
- Either user can record transactions on behalf of the other.
- Theme preference per user (light default, dark optional) in Settings.

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
| createdAt | INTEGER | Unix ms |

**Account**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| userId | TEXT | FK → User |
| name | TEXT | e.g. "VPS Securities", "DBS Savings" |
| type | TEXT | `brokerage` · `bank` · `cash` · `crypto_wallet` · `property` |
| currency | TEXT | `VND` · `SGD` |
| isActive | INTEGER | Soft-delete |

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
| isActive | INTEGER | |

**AssetPrice**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| assetId | TEXT | FK → Asset |
| date | TEXT | `YYYY-MM-DD` |
| price | REAL | Closing price in asset currency |
| source | TEXT | `scraper` · `manual` |
| createdAt | INTEGER | |

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
| date | TEXT | `YYYY-MM-DD` |
| amount | REAL | Total in account currency |
| quantity | REAL | Units (asset txns) |
| unitPrice | REAL | Per-unit price (asset txns) |
| fee | REAL | Commission |
| realizedPnl | REAL | Auto-calculated on sell |
| notes | TEXT | |
| tags | TEXT | JSON string array |
| createdAt | INTEGER | |

**Holding**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| accountId | TEXT | FK → Account |
| assetId | TEXT | FK → Asset |
| quantity | REAL | Current units |
| avgCostBasis | REAL | Average cost per unit |
| totalCost | REAL | Total invested |
| status | TEXT | `open` · `closed` |

**ClosedPosition**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| accountId | TEXT | FK → Account |
| assetId | TEXT | FK → Asset |
| totalQuantity | REAL | Total shares held |
| totalCost | REAL | Total cost basis |
| totalProceeds | REAL | Total sale proceeds |
| realizedPnl | REAL | Net gain/loss |
| openDate | TEXT | First buy date |
| closeDate | TEXT | Final sell date |
| holdingPeriodDays | INTEGER | |

**RecurringRule**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| userId | TEXT | FK → User |
| type | TEXT | `income` · `expense` |
| categoryId | TEXT | FK → Category |
| accountId | TEXT | FK → Account |
| amount | REAL | Per occurrence |
| currency | TEXT | `VND` · `SGD` |
| frequency | TEXT | `monthly` · `quarterly` · `yearly` |
| startDate | TEXT | |
| endDate | TEXT | Nullable |
| maxOccurrences | INTEGER | Nullable (alternative to endDate) |
| occurrenceCount | INTEGER | Generated so far |
| description | TEXT | e.g. "Monthly Salary" |
| notes | TEXT | |
| isActive | INTEGER | Can be paused |
| createdAt | INTEGER | |

**Budget**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| userId | TEXT | FK → User |
| categoryId | TEXT | FK → Category |
| year | INTEGER | e.g. 2026 |
| yearlyAmount | REAL | Annual total (VND) |
| monthlyBaseLimit | REAL | yearlyAmount ÷ 12 |
| isActive | INTEGER | |
| createdAt | INTEGER | |

**BudgetMonthSnapshot**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| budgetId | TEXT | FK → Budget |
| month | INTEGER | 1–12 |
| year | INTEGER | |
| baseLimit | REAL | From Budget |
| rolloverAmount | REAL | Surplus/deficit from previous month |
| effectiveLimit | REAL | baseLimit + rolloverAmount |
| manualOverride | REAL | Nullable user override |
| spent | REAL | Running total |
| remaining | REAL | |
| createdAt | INTEGER | |

**ExchangeRate**

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT (ULID) | PK |
| fromCurrency | TEXT | e.g. `SGD` |
| toCurrency | TEXT | e.g. `VND` |
| rate | REAL | |
| date | TEXT | `YYYY-MM-DD` |
| source | TEXT | `scraper` · `manual` |

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
| failureDetails | TEXT | JSON array `[{ symbol, error }]` |
| startedAt | INTEGER | |
| completedAt | INTEGER | |
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

## 8. Implementation Phases

| Phase | Scope | Key Deliverables |
|-------|-------|------------------|
| **1. Foundation** | Project scaffolding | Next.js + Tailwind + shadcn/ui setup, SQLite + Drizzle schema & migrations, NextAuth (2 users), app shell with sidebar/nav/theme, seed categories & accounts |
| **2. Income & Expenses** | Transaction tracking | Income/expense CRUD, on-behalf recording, category & account management UI, transaction list (filter/sort/search), monthly summaries |
| **3. Recurring Rules** | Automation | Recurring rule CRUD (income & expense), auto-generation of transactions, manage page (list/edit/pause/history) |
| **4. Portfolio Core** | Investment tracking | Asset registry, buy/sell recording (avg cost), holdings engine, closed positions history, dividend recording linked to income, capital gains auto-linking |
| **5. Market Data** | Pricing engine | Vietnam & Singapore scrapers, FX scraper, on-demand + scheduled refresh, audit log, price history charts, manual entry, screenshot-assisted trade entry (AI) |
| **6. Dashboard** | Wealth overview | Net worth engine, dashboard (KPIs/charts/activity/budgets), net worth trend, wealth composition, view toggle (my/partner/household) |
| **7. Budgeting** | Spend control | Yearly budget CRUD, monthly snapshots with rollover, yearly rollover, monthly override, budget dashboard with progress bars, cash flow & savings rate |
| **8. Reports** | Analytics | Asset Allocation + Portfolio Performance (priority), income/expense report, dividend summary, cash flow, financial health score, CSV/PDF export |
| **9. Polish & Deploy** | Production readiness | Responsive UI, CSV import/export, SQLite backup/download, Dockerize, cloud deployment, performance & error handling |

---

## 9. Future Considerations

- Loan & liability tracking with amortization
- Goal-based savings (retirement, education, travel)
- Bank statement import (PDF/CSV parsing)
- Mobile app (React Native or PWA)
- AI-powered financial advice & anomaly detection
- Vietnamese banking API integration

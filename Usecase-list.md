# Use Case List — Portfolio & Asset Management System

> A structured list of use cases to specify user flows and interactions.  
> **Status legend**: ✅ Implemented | 🚧 Planned | ⏳ Future

---

## 1. Authentication & Session

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-AUTH-01 | **Sign in** | User enters email and password; system validates credentials and creates session. Invalid credentials show error message. | ✅ |
| UC-AUTH-02 | **Sign out** | User clicks Sign out in profile menu; session is terminated and user is redirected to login page. | ✅ |
| UC-AUTH-03 | **Session persistence** | Authenticated user remains logged in across page navigations and browser refresh. | ✅ |
| UC-AUTH-04 | **Protected routes** | Unauthenticated users attempting to access app routes are redirected to login. | ✅ |

---

## 2. User Profile & Settings

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-SET-01 | **Update display name** | User edits display name in Settings → Profile and saves; name is persisted and reflected in UI. | ✅ |
| UC-SET-02 | **Toggle theme** | User switches between Light and Dark theme; preference is saved and applied across the app. | ✅ |
| UC-SET-03 | **View account info** | User views read-only email and role in Settings. | ✅ |
| UC-SET-04 | **Change password** | User updates password from Settings. | 🚧 |

---

## 3. Account Management

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-ACC-01 | **Create account** | User adds a new account (name, type, currency) in Settings → Accounts. Account appears in dropdowns for transactions. | ✅ |
| UC-ACC-02 | **Deactivate account** | User deactivates an account; it is hidden from transaction dropdowns but data is preserved. | ✅ |
| UC-ACC-03 | **Activate account** | User reactivates a previously deactivated account. | ✅ |
| UC-ACC-04 | **Edit account** | User edits account name, type, or currency. | 🚧 |

---

## 4. Income

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-INC-01 | **Record income** | User records income with: For User (self or partner), Date, Category, Amount, Currency, Account, Notes, Tags. | ✅ |
| UC-INC-02 | **Record income on behalf of partner** | Either household user records income for the other user via "For User" selector. | ✅ |
| UC-INC-03 | **Edit income transaction** | User edits an existing income transaction (category, amount, date, etc.). | ✅ |
| UC-INC-04 | **Delete income transaction** | User deletes an income transaction after confirmation. | ✅ |
| UC-INC-05 | **Record dividend income** | User records dividend with category "Dividends" and required Asset Link (ties to source stock). | 🚧 |
| UC-INC-06 | **Record recurring income** | User toggles recurring mode; sets frequency (monthly/quarterly/yearly), start date, end condition; creates RecurringRule that auto-generates transactions. | 🚧 |
| UC-INC-07 | **Manage recurring income** | User views list of recurring rules, edits amounts, changes end dates, pauses/resumes, views generated transaction history. | 🚧 |
| UC-INC-08 | **Auto-record investment income** | When a sell transaction closes a position, realized P&L is auto-recorded as Investment Income (gain) or Investment Loss (loss), linked to the asset. | 🚧 |

---

## 5. Expenses

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-EXP-01 | **Record expense** | User records expense with: For User, Date, Category, Amount, Currency, Account, Notes, Tags (needs/wants/tax-deductible). | ✅ |
| UC-EXP-02 | **Record expense on behalf of partner** | Either household user records expense for the other user. | ✅ |
| UC-EXP-03 | **Edit expense transaction** | User edits an existing expense transaction. | ✅ |
| UC-EXP-04 | **Delete expense transaction** | User deletes an expense transaction after confirmation. | ✅ |
| UC-EXP-05 | **Budget warning on save** | When saving an expense, if a budget exists for the category, system warns if near or over budget. | 🚧 |
| UC-EXP-06 | **Record recurring expense** | User creates recurring expense rule with frequency, end condition; system auto-generates transactions. | 🚧 |
| UC-EXP-07 | **Manage recurring expenses** | User lists, edits, pauses, resumes recurring expense rules and views generated history. | 🚧 |

---

## 6. Transaction List & Filters

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-TXN-01 | **View transaction list** | User sees paginated list of income or expense transactions with category, amount, date, account, user, notes. | ✅ |
| UC-TXN-02 | **Filter by user** | User filters transactions by household member (me / partner / all). | ✅ |
| UC-TXN-03 | **Filter by category** | User filters transactions by category. | ✅ |
| UC-TXN-04 | **Filter by account** | User filters transactions by account. | ✅ |
| UC-TXN-05 | **Filter by date range** | User filters transactions by date from/to. | ✅ |
| UC-TXN-06 | **Search transactions** | User searches transactions by notes or other text (debounced). | ✅ |
| UC-TXN-07 | **View monthly summary** | User sees current month vs previous month totals (income/expenses) on Income and Expenses pages. | ✅ |

---

## 7. Portfolio & Investments

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-POR-01 | **View portfolio overview** | User sees holdings across accounts with current value, daily change, unrealized P&L. | 🚧 |
| UC-POR-02 | **Buy asset** | User selects brokerage account, searches/creates asset, enters date, quantity, unit price, fee; system creates buy transaction and updates/creates holding (avg cost). | 🚧 |
| UC-POR-03 | **Sell asset** | User selects holding, enters sell quantity, price, fee; system creates sell transaction, reduces holding, records realized P&L, creates closed position if fully sold. | 🚧 |
| UC-POR-04 | **Record dividend** | User records dividend linked to asset; appears in income and portfolio dividend analytics. | 🚧 |
| UC-POR-05 | **View closed positions** | User views history of fully sold positions with total cost, proceeds, P&L, holding period. | 🚧 |
| UC-POR-06 | **Asset registry** | User searches or creates assets (symbol, name, class, market, currency) for buy/sell flows. | 🚧 |
| UC-POR-07 | **Screenshot trade entry** | User uploads brokerage screenshot; AI extracts buy/sell, ticker, qty, price, fee, date; form is pre-filled; user reviews and saves. Image is not stored. | 🚧 |

---

## 8. Market Data & Prices

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-PRC-01 | **Refresh prices (on-demand)** | User clicks "Refresh Prices"; system scrapes Vietnam/Singapore markets and SGD/VND FX; progress indicator and summary shown; failed assets flagged for manual entry. | 🚧 |
| UC-PRC-02 | **Scheduled price refresh** | Daily cron runs after market close; no user notification; logged to audit. | 🚧 |
| UC-PRC-03 | **Manual price entry** | User enters price manually for assets without scrapeable sources. | 🚧 |
| UC-PRC-04 | **View price refresh audit log** | User views and filters refresh logs (timestamp, trigger type, market, counts, failure details). | 🚧 |
| UC-PRC-05 | **View price history chart** | User views asset closing price over time (1M, 3M, 6M, 1Y, all-time) on asset detail page. | 🚧 |

---

## 9. Dashboard

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-DSH-01 | **View dashboard** | User lands on dashboard after login; sees KPI cards and sections. | ✅ |
| UC-DSH-02 | **View monthly income/expenses KPIs** | User sees Monthly Income and Monthly Expenses with change vs last month. | ✅ |
| UC-DSH-03 | **View net worth** | User sees total net worth (VND) and change vs last month. | 🚧 |
| UC-DSH-04 | **Toggle view (My / Partner / Household)** | User switches between personal, partner, and combined household views. | 🚧 |
| UC-DSH-05 | **View net worth trend chart** | User sees net worth line chart (monthly, 1–2 yr). | 🚧 |
| UC-DSH-06 | **View wealth composition** | User sees donut chart by asset class/market. | 🚧 |
| UC-DSH-07 | **View top holdings** | User sees top 5–10 holdings with current price, daily change, unrealized P&L. | 🚧 |
| UC-DSH-08 | **View recent activity** | User sees latest 10 transactions across all types. | 🚧 |
| UC-DSH-09 | **View budget progress** | User sees mini progress bars for top budget categories (spent vs limit). | 🚧 |

---

## 10. Budgets

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-BUD-01 | **Create budget** | User selects expense category, enters yearly budget (VND); system calculates monthly base limit (÷12); assigns to year. | 🚧 |
| UC-BUD-02 | **View budget dashboard** | User sees all active budgets with progress bars per category (green/yellow/red, over-budget marker). | 🚧 |
| UC-BUD-03 | **Monthly rollover** | Unspent surplus (or deficit) from previous month rolls over into next month's effective limit. | 🚧 |
| UC-BUD-04 | **Yearly rollover** | Year-end remaining budget rolls into next year; user can accept or adjust. | 🚧 |
| UC-BUD-05 | **Monthly override** | User manually overrides effective limit for a specific month (e.g. higher budget for Tet). | 🚧 |

---

## 11. Reports

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-RPT-01 | **Asset Allocation report** | User sees breakdown by asset class, market (VN/SG), holding; target vs actual; rebalancing suggestions. | 🚧 |
| UC-RPT-02 | **Portfolio Performance report** | User sees return %, XIRR, unrealized/realized P&L by asset, class, market; periods: MTD, QTD, YTD, 1Y, 3Y, custom. | 🚧 |
| UC-RPT-03 | **Income vs Expense report** | User sees monthly/quarterly/annual comparison by category with trend charts. | 🚧 |
| UC-RPT-04 | **Dividend Summary report** | User sees dividends by asset and period; yield per holding; growth over time. | 🚧 |
| UC-RPT-05 | **Cash Flow Statement** | User sees monthly inflows vs outflows; net cash flow trend. | 🚧 |
| UC-RPT-06 | **Financial Health Score** | User sees composite score: savings rate, diversification, emergency fund, debt ratio; gauge + breakdown. | 🚧 |
| UC-RPT-07 | **Export report** | User exports report as CSV or PDF with date range and user filter. | 🚧 |

---

## 12. Currency & Conversion

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-FX-01 | **Display in VND** | All dashboards, totals, and reports display in VND (primary currency). | ✅ (partial) |
| UC-FX-02 | **SGD to VND conversion** | SGD values convert to VND using latest scraped exchange rate. | 🚧 |
| UC-FX-03 | **Historical rate preservation** | Net worth snapshots preserve exchange rate at time of capture. | 🚧 |

---

## 13. Navigation & Layout

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-NAV-01 | **Navigate via sidebar** | User navigates between Dashboard, Income, Expenses, Portfolio, Budgets, Reports via sidebar links. | ✅ |
| UC-NAV-02 | **Access Settings** | User opens Settings from sidebar footer. | ✅ |
| UC-NAV-03 | **Open user menu** | User opens profile menu (avatar/name) to access Sign out and other profile actions. | ✅ |

---

## 14. Future Considerations (Phase 10+)

| ID | Use Case | Description | Status |
|----|----------|-------------|--------|
| UC-FUT-01 | **Loan & liability tracking** | Track loans with amortization schedules. | ⏳ |
| UC-FUT-02 | **Goal-based savings** | Set goals (retirement, education, travel) and track progress. | ⏳ |
| UC-FUT-03 | **Bank statement import** | Import transactions from PDF/CSV bank statements. | ⏳ |
| UC-FUT-04 | **Mobile app** | React Native or PWA for mobile access. | ⏳ |
| UC-FUT-05 | **AI financial advice** | AI-powered anomaly detection and recommendations. | ⏳ |

---

## Summary by Implementation Phase

| Phase | Use Cases | Status |
|-------|-----------|--------|
| **1. Foundation** | UC-AUTH-*, UC-SET-01–03, UC-NAV-* | ✅ Complete |
| **2. Cloud Infrastructure** | (Infrastructure only) | ✅ Complete |
| **3. Income & Expenses** | UC-ACC-*, UC-INC-01–04, UC-EXP-01–04, UC-TXN-*, UC-DSH-01–02 | ✅ Complete |
| **4. Recurring Rules** | UC-INC-06–07, UC-EXP-05–07 | 🚧 Planned |
| **5. Portfolio Core** | UC-POR-* | 🚧 Planned |
| **6. Market Data** | UC-PRC-*, UC-FX-* | 🚧 Planned |
| **7. Dashboard** | UC-DSH-03–09 | 🚧 Planned |
| **8. Budgeting** | UC-BUD-*, UC-EXP-05 | 🚧 Planned |
| **9. Reports** | UC-RPT-* | 🚧 Planned |
| **10. Polish** | CSV import/export, accessibility, performance | ⏳ Future |

---

## E2E Test Coverage Mapping

E2E tests live in `apps/web/e2e/` (Playwright). Mapping of tests to use cases:

### phase1.spec.ts (Phase 1 — Foundation)

| Test | Use Cases Covered |
|------|-------------------|
| 1. Login page - verify form | UC-AUTH-01 (form UI) |
| 2. Invalid login - shows error message | UC-AUTH-01 (error path) |
| 3. Valid login - redirects to dashboard | UC-AUTH-01, UC-AUTH-03, UC-DSH-01 |
| 4. App shell - sidebar and user menu | UC-NAV-01, UC-NAV-02, UC-NAV-03 |
| 5a. Navigate to Income page | UC-NAV-01 |
| 5b. Navigate to Expenses page | UC-NAV-01 |
| 5c. Navigate to Portfolio page | UC-NAV-01 |
| 5d. Navigate to Settings page | UC-NAV-02 |
| 6. Theme switching - Dark and Light | UC-SET-02 |
| 7. Sign out - redirects to login | UC-AUTH-02, UC-NAV-03 |

### phase3.spec.ts (Phase 3 — Income & Expenses)

| Test | Use Cases Covered |
|------|-------------------|
| loads income page with summary cards and empty state | UC-TXN-01, UC-TXN-07 |
| create income transaction via form | UC-INC-01 |
| edit income transaction | UC-INC-03 |
| delete income transaction | UC-INC-04 |
| create expense with tags | UC-EXP-01 |
| filter transactions by category | UC-TXN-03 |
| filter transactions by user | UC-TXN-02 |
| create new account in settings | UC-ACC-01 |
| deactivate and reactivate account | UC-ACC-02, UC-ACC-03 |
| dashboard shows real income and expense data | UC-DSH-01, UC-DSH-02 |

### Coverage Gaps (Implemented Use Cases Without E2E)

| Use Case | Gap |
|----------|-----|
| UC-SET-01 | Update display name — no test |
| UC-SET-03 | View account info — not explicitly asserted |
| UC-INC-02 | Record income on behalf of partner — no test |
| UC-EXP-02 | Record expense on behalf of partner — no test |
| UC-EXP-03 | Edit expense transaction — no test |
| UC-EXP-04 | Delete expense transaction — no test |
| UC-TXN-04 | Filter by account — no test |
| UC-TXN-05 | Filter by date range — no test |
| UC-TXN-06 | Search transactions — no test |
| UC-AUTH-04 | Protected routes (redirect when unauthenticated) — no test |

---

*Last updated from ARCHITECTURE.md, schema, app pages, and e2e specs. Use this list to drive user-flow specs and implementation planning.*

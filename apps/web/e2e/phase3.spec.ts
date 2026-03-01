import { test, expect } from "@playwright/test";
import {
  BASE_URL,
  SCREENSHOTS_DIR,
  login,
  createTransactionViaAPI,
  deleteTransactionViaAPI,
  findLatestTransactionViaAPI,
  findAccountByNameViaAPI,
  deleteAccountViaAPI,
} from "./helpers";
import { join } from "path";

test.describe("Phase 3: Income & Expenses", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe("Income Page", () => {
    test("loads income page with summary cards and empty state", async ({ page }) => {
      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      await expect(page.getByText("Income this month")).toBeVisible();
      await expect(page.getByText("vs Last Month")).toBeVisible();
      await expect(page.getByRole("button", { name: /add income/i })).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-01-income-page.png"), fullPage: true });
    });

    test("create income transaction via form", async ({ page }) => {
      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      await page.getByRole("button", { name: /add income/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByTestId("select-category").click();
      await page.getByRole("option", { name: /salary/i }).click();

      await page.getByPlaceholder("0.00").fill("15000000");

      await page.getByTestId("select-account").click();
      await page.getByRole("option").first().click();

      await page.getByPlaceholder("Optional notes").fill("Monthly salary");

      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText("Transaction created")).toBeVisible({ timeout: 5000 });

      const tableBody = page.locator("table tbody");
      await expect(tableBody.getByText("Salary").first()).toBeVisible();
      await expect(tableBody.getByText("Monthly salary").first()).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-02-income-created.png"), fullPage: true });

      const created = await findLatestTransactionViaAPI("income", "Monthly salary");
      if (created) await deleteTransactionViaAPI(created.id);
    });

    test("edit income transaction", async ({ page }) => {
      const tx = await createTransactionViaAPI("income", { notes: "E2E edit target" });

      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      await page.locator("table tbody tr").first().getByTestId("edit-transaction").click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("heading", { name: /edit income/i })).toBeVisible();

      await page.getByPlaceholder("Optional notes").fill("Updated salary note");
      await page.getByRole("button", { name: /update/i }).click();
      await expect(page.getByText("Transaction updated")).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-03-income-edited.png"), fullPage: true });

      await deleteTransactionViaAPI(tx.id);
    });

    test("delete income transaction", async ({ page }) => {
      await createTransactionViaAPI("income", { notes: "E2E delete target" });

      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      page.on("dialog", (dialog) => dialog.accept());
      await page.locator("table tbody tr").first().getByTestId("delete-transaction").click();

      await expect(page.getByText("Transaction deleted")).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-04-income-deleted.png"), fullPage: true });
    });
  });

  test.describe("Expenses Page", () => {
    test("create expense with tags", async ({ page }) => {
      await page.getByRole("link", { name: /expenses/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/expenses`);

      await page.getByRole("button", { name: /add expense/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByTestId("select-category").click();
      await page.getByRole("option", { name: /food/i }).click();

      await page.getByPlaceholder("0.00").fill("500000");

      await page.getByTestId("select-account").click();
      await page.getByRole("option").first().click();

      await page.getByRole("dialog").getByText("needs").click();

      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText("Transaction created")).toBeVisible({ timeout: 5000 });

      const tableBody = page.locator("table tbody");
      await expect(tableBody.getByText("Food").first()).toBeVisible();
      await expect(tableBody.getByText("needs").first()).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-05-expense-with-tags.png"), fullPage: true });

      const created = await findLatestTransactionViaAPI("expense");
      if (created) await deleteTransactionViaAPI(created.id);
    });
  });

  test.describe("Filters", () => {
    test("filter transactions by category", async ({ page }) => {
      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      await page.getByTestId("filter-category").click();
      await page.getByRole("option", { name: /salary/i }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-06-filtered-by-category.png"), fullPage: true });
    });

    test("filter transactions by user", async ({ page }) => {
      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      await page.getByTestId("filter-user").click();
      await page.getByRole("option", { name: /owner/i }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-07-filtered-by-user.png"), fullPage: true });
    });
  });

  test.describe("Account Management", () => {
    test("create new account in settings", async ({ page }) => {
      const accountName = `E2E-Acct-${Date.now()}`;

      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      await expect(page.getByTestId("accounts-section")).toBeVisible();
      await page.getByRole("button", { name: /add/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByPlaceholder("e.g. Vietcombank").fill(accountName);
      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText("Account created")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(accountName)).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-08-account-created.png"), fullPage: true });

      const acct = await findAccountByNameViaAPI(accountName);
      if (acct) await deleteAccountViaAPI(acct.id);
    });

    test("deactivate and reactivate account", async ({ page }) => {
      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      const section = page.getByTestId("accounts-section");
      await section.getByRole("button", { name: /deactivate/i }).first().waitFor();
      const inactiveBefore = await section.getByText("Inactive").count();

      await section.getByRole("button", { name: /deactivate/i }).first().click();
      await expect(page.getByText("Account deactivated")).toBeVisible({ timeout: 5000 });
      await expect(section.getByText("Inactive")).toHaveCount(inactiveBefore + 1);

      const activateBtn = section.getByRole("button", { name: /^activate$/i }).first();
      await activateBtn.click();
      await expect(page.getByText("Account activated")).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-09-account-toggled.png"), fullPage: true });
    });
  });

  test.describe("Dashboard KPIs", () => {
    test("dashboard shows real income and expense data", async ({ page }) => {
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`);

      await expect(page.getByText("Monthly Income")).toBeVisible();
      await expect(page.getByText("Monthly Expenses")).toBeVisible();

      const netWorthCard = page.getByTestId("kpi-net-worth");
      await expect(netWorthCard.getByText("--")).toBeVisible();

      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-10-dashboard-kpis.png"), fullPage: true });
    });
  });
});

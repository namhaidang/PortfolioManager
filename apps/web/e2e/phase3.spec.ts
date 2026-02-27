import { test, expect } from "@playwright/test";
import { join } from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOTS_DIR = join(__dirname, "screenshots");

async function login(page: import("@playwright/test").Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByRole("textbox", { name: /email/i }).fill("owner@family.local");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
}

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

      // Select category
      await page.locator('[data-slot="dialog"]').getByText("Select category").click();
      await page.getByRole("option", { name: /salary/i }).click();

      // Enter amount
      await page.getByPlaceholder("0.00").fill("15000000");

      // Select account
      await page.locator('[data-slot="dialog"]').getByText("Select account").click();
      await page.getByRole("option").first().click();

      // Add notes
      await page.getByPlaceholder("Optional notes").fill("Monthly salary");

      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText("Transaction created")).toBeVisible({ timeout: 5000 });

      await expect(page.getByText("Salary")).toBeVisible();
      await expect(page.getByText("Monthly salary")).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-02-income-created.png"), fullPage: true });
    });

    test("edit income transaction", async ({ page }) => {
      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      // Click edit on first row
      await page.locator("table tbody tr").first().getByRole("button").first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("heading", { name: /edit income/i })).toBeVisible();

      await page.getByPlaceholder("Optional notes").fill("Updated salary note");
      await page.getByRole("button", { name: /update/i }).click();
      await expect(page.getByText("Transaction updated")).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-03-income-edited.png"), fullPage: true });
    });

    test("delete income transaction", async ({ page }) => {
      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      const rowCount = await page.locator("table tbody tr").count();

      // Accept the confirm dialog
      page.on("dialog", (dialog) => dialog.accept());
      await page.locator("table tbody tr").first().getByRole("button").nth(1).click();

      await expect(page.getByText("Transaction deleted")).toBeVisible({ timeout: 5000 });

      if (rowCount <= 1) {
        await expect(page.getByText("No transactions found")).toBeVisible();
      }
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-04-income-deleted.png"), fullPage: true });
    });
  });

  test.describe("Expenses Page", () => {
    test("create expense with tags", async ({ page }) => {
      await page.getByRole("link", { name: /expenses/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/expenses`);

      await page.getByRole("button", { name: /add expense/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      // Select category
      await page.locator('[data-slot="dialog"]').getByText("Select category").click();
      await page.getByRole("option", { name: /food/i }).click();

      // Enter amount
      await page.getByPlaceholder("0.00").fill("500000");

      // Select account
      await page.locator('[data-slot="dialog"]').getByText("Select account").click();
      await page.getByRole("option").first().click();

      // Toggle expense tags
      await page.getByText("needs").click();

      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText("Transaction created")).toBeVisible({ timeout: 5000 });

      await expect(page.getByText("Food")).toBeVisible();
      await expect(page.getByText("needs")).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-05-expense-with-tags.png"), fullPage: true });
    });
  });

  test.describe("Filters", () => {
    test("filter transactions by category", async ({ page }) => {
      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      // Open category filter
      await page.locator("button", { hasText: "All categories" }).click();
      await page.getByRole("option", { name: /salary/i }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-06-filtered-by-category.png"), fullPage: true });
    });

    test("filter transactions by user", async ({ page }) => {
      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      await page.locator("button", { hasText: "All users" }).click();
      await page.getByRole("option", { name: /owner/i }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-07-filtered-by-user.png"), fullPage: true });
    });
  });

  test.describe("Account Management", () => {
    test("create new account in settings", async ({ page }) => {
      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      await expect(page.getByText("Accounts")).toBeVisible();
      await page.getByRole("button", { name: /add/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByPlaceholder("e.g. Vietcombank").fill("BIDV Savings");
      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText("Account created")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("BIDV Savings")).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-08-account-created.png"), fullPage: true });
    });

    test("deactivate and reactivate account", async ({ page }) => {
      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      const deactivateBtn = page.getByRole("button", { name: /deactivate/i }).first();
      await deactivateBtn.click();
      await expect(page.getByText("Account deactivated")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("Inactive")).toBeVisible();

      const activateBtn = page.getByRole("button", { name: /activate/i }).first();
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

      // Net Worth and Portfolio should still be placeholders
      const netWorthCard = page.locator("text=Net Worth").locator("..");
      await expect(netWorthCard.getByText("--")).toBeVisible();

      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p3-10-dashboard-kpis.png"), fullPage: true });
    });
  });
});

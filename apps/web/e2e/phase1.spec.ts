import { test, expect } from "@playwright/test";
import { BASE_URL, SCREENSHOTS_DIR, login } from "./helpers";
import { join } from "path";

test.describe("Phase 1 Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });

  test("1. Login page - verify form with email and password fields", async ({ page }) => {
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "01-login-page.png"), fullPage: true });
  });

  test("2. Invalid login - shows error message", async ({ page }) => {
    await page.getByRole("textbox", { name: /email/i }).fill("wrong@test.com");
    await page.getByLabel(/password/i).fill("wrongpass");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "02-invalid-login.png"), fullPage: true });
  });

  test("3. Valid login - redirects to dashboard", async ({ page }) => {
    await login(page);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "03-dashboard.png"), fullPage: true });
  });

  test("4. App shell - sidebar and user menu", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page);

    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /income/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /expenses/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /portfolio/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /budgets/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /reports/i })).toBeVisible();

    await expect(page.getByText(/owner/i).first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "04-app-shell.png"), fullPage: true });
  });

  test("5a. Navigate to Income page", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: /income/i }).click();
    await expect(page).toHaveURL(`${BASE_URL}/income`);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "05a-income.png"), fullPage: true });
  });

  test("5b. Navigate to Expenses page", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: /expenses/i }).click();
    await expect(page).toHaveURL(`${BASE_URL}/expenses`);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "05b-expenses.png"), fullPage: true });
  });

  test("5c. Navigate to Portfolio page", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: /portfolio/i }).click();
    await expect(page).toHaveURL(`${BASE_URL}/portfolio`);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "05c-portfolio.png"), fullPage: true });
  });

  test("5d. Navigate to Settings page", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: /settings/i }).click();
    await expect(page).toHaveURL(`${BASE_URL}/settings`);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "05d-settings.png"), fullPage: true });
  });

  test("6. Theme switching - Dark and Light", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: /settings/i }).click();
    await expect(page).toHaveURL(`${BASE_URL}/settings`);

    await page.getByRole("button", { name: /dark/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "06-dark-theme.png"), fullPage: true });

    await page.getByRole("button", { name: /light/i }).click();
    await page.waitForTimeout(500);
  });

  test("7. Sign out - redirects to login", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page);

    await page.getByTestId("user-menu-trigger").click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();

    await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 5000 });
    await page.screenshot({ path: join(SCREENSHOTS_DIR, "07-after-signout.png"), fullPage: true });
  });
});

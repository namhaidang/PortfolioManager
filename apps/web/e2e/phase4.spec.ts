import { test, expect } from "@playwright/test";
import { BASE_URL, SCREENSHOTS_DIR, login } from "./helpers";
import { join } from "path";

test.describe("Phase 4: API Extraction & Auth", () => {
  test.describe("JWT Auth Lifecycle", () => {
    test("login stores JWT in localStorage", async ({ page }) => {
      await login(page);

      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).toBeTruthy();
      expect(token!.split(".")).toHaveLength(3);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p4-01-jwt-stored.png"), fullPage: true });
    });

    test("page refresh preserves authentication", async ({ page }) => {
      await login(page);
      await page.reload();

      await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
      await expect(page.getByText("Monthly Income")).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p4-02-refresh-persists.png"), fullPage: true });
    });

    test("logout clears JWT and redirects to login", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await login(page);

      const tokenBefore = await page.evaluate(() => localStorage.getItem("token"));
      expect(tokenBefore).toBeTruthy();

      await page.getByTestId("user-menu-trigger").click();
      await page.getByRole("menuitem", { name: /sign out/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 5000 });

      const tokenAfter = await page.evaluate(() => localStorage.getItem("token"));
      expect(tokenAfter).toBeNull();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p4-03-logout-clears-jwt.png"), fullPage: true });
    });

    test("unauthenticated access redirects to login", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 10000 });
    });
  });

  test.describe("API Connectivity", () => {
    test("dashboard loads real data from API", async ({ page }) => {
      await login(page);

      await expect(page.getByText("Monthly Income")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Monthly Expenses")).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p4-04-dashboard-api-data.png"), fullPage: true });
    });

    test("navigation between pages keeps auth intact", async ({ page }) => {
      await login(page);

      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);
      await expect(page.getByText("Income this month")).toBeVisible({ timeout: 10000 });

      await page.getByRole("link", { name: /expenses/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/expenses`);
      await expect(page.getByText("Expenses this month")).toBeVisible({ timeout: 10000 });

      await page.getByRole("link", { name: /dashboard/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
      await expect(page.getByText("Monthly Income")).toBeVisible({ timeout: 10000 });
    });

    test("income page loads categories and accounts from API", async ({ page }) => {
      await login(page);
      await page.getByRole("link", { name: /income/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/income`);

      await page.getByRole("button", { name: /add income/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByTestId("select-category").click();
      await expect(page.getByRole("option", { name: /salary/i })).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p4-05-api-categories.png"), fullPage: true });
    });
  });

  test.describe("Profile Update via API", () => {
    test("changing name in settings updates display", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await login(page);
      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      const nameInput = page.locator("#name");
      const originalName = await nameInput.inputValue();

      await nameInput.fill("E2E Test Name");
      await page.getByRole("button", { name: /^save$/i }).click();
      await expect(page.getByText("Name updated")).toBeVisible({ timeout: 5000 });

      // Restore original
      await nameInput.fill(originalName);
      await page.getByRole("button", { name: /^save$/i }).click();
      await expect(page.getByText("Name updated")).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p4-06-name-update.png"), fullPage: true });
    });

    test("theme change persists via API", async ({ page }) => {
      await login(page);
      await page.getByRole("link", { name: /settings/i }).click();

      await page.getByRole("button", { name: /dark/i }).click();
      await page.waitForTimeout(500);

      const isDark = await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
      );
      expect(isDark).toBe(true);

      await page.getByRole("button", { name: /light/i }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p4-07-theme-api.png"), fullPage: true });
    });
  });
});

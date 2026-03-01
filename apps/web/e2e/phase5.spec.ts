import { test, expect } from "@playwright/test";
import {
  BASE_URL,
  SCREENSHOTS_DIR,
  login,
  createRecurringRuleViaAPI,
  deleteRecurringRuleViaAPI,
  findRecurringRuleByDescriptionViaAPI,
} from "./helpers";
import { join } from "path";

test.describe("Phase 5: Recurring Rules", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe("Recurring Section in Settings", () => {
    test("recurring section is visible with Add button", async ({ page }) => {
      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      const section = page.getByTestId("recurring-section");
      await expect(section).toBeVisible();
      await expect(section.getByRole("button", { name: /add/i })).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p5-01-recurring-section.png"), fullPage: true });
    });

    test("create recurring income rule via form", async ({ page }) => {
      const ruleName = `E2E-Rule-${Date.now()}`;

      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      const section = page.getByTestId("recurring-section");
      await section.getByRole("button", { name: /add/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByTestId("recurring-type").click();
      await page.getByRole("option", { name: /income/i }).click();

      await page.getByTestId("recurring-category").click();
      await page.getByRole("option").first().click();

      await page.getByPlaceholder("0.00").fill("5000000");

      await page.getByTestId("recurring-frequency").click();
      await page.getByRole("option", { name: /monthly/i }).click();

      await page.getByPlaceholder("e.g. Monthly Salary").fill(ruleName);

      await page.getByRole("button", { name: /create rule/i }).click({ force: true });
      await expect(page.getByText("Recurring rule created")).toBeVisible({ timeout: 5000 });

      await expect(section.getByText(ruleName)).toBeVisible();
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p5-02-rule-created.png"), fullPage: true });

      const created = await findRecurringRuleByDescriptionViaAPI(ruleName);
      if (created) await deleteRecurringRuleViaAPI(created.id);
    });

    test("edit recurring rule", async ({ page }) => {
      const rule = await createRecurringRuleViaAPI({ description: `E2E-Edit-${Date.now()}` });

      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      const section = page.getByTestId("recurring-section");
      const ruleRow = section.locator("div.border").filter({ hasText: /E2E-Edit-/ }).first();
      await ruleRow.getByRole("button", { name: /edit/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByPlaceholder("0.00").fill("9999999");
      await page.getByRole("button", { name: /update/i }).click({ force: true });
      await expect(page.getByText("Rule updated")).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p5-03-rule-edited.png"), fullPage: true });

      await deleteRecurringRuleViaAPI(rule.id);
    });

    test("pause and resume recurring rule", async ({ page }) => {
      const rule = await createRecurringRuleViaAPI({ description: `E2E-Toggle-${Date.now()}` });

      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      const section = page.getByTestId("recurring-section");
      const ruleRow = section.locator("div.border").filter({ hasText: /E2E-Toggle-/ }).first();

      await ruleRow.getByRole("button", { name: /pause/i }).click();
      await expect(page.getByText("Rule paused")).toBeVisible({ timeout: 5000 });
      await expect(ruleRow.getByText("Paused")).toBeVisible();

      await ruleRow.getByRole("button", { name: /resume/i }).click();
      await expect(page.getByText("Rule activated")).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p5-04-rule-toggled.png"), fullPage: true });

      await deleteRecurringRuleViaAPI(rule.id);
    });

    test("delete recurring rule", async ({ page }) => {
      const rule = await createRecurringRuleViaAPI({ description: `E2E-Delete-${Date.now()}` });

      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page).toHaveURL(`${BASE_URL}/settings`);

      const section = page.getByTestId("recurring-section");
      const ruleRow = section.locator("div.border").filter({ hasText: /E2E-Delete-/ }).first();

      page.on("dialog", (dialog) => dialog.accept());
      await ruleRow.getByRole("button", { name: /delete/i }).click();
      await expect(page.getByText("Rule deleted")).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: join(SCREENSHOTS_DIR, "p5-05-rule-deleted.png"), fullPage: true });
    });
  });
});

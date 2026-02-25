import { defineConfig, devices } from "@playwright/test";
import { join } from "path";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Run tests sequentially for clearer screenshots
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  outputDir: join(__dirname, "e2e-results"),
});

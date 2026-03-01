import { defineConfig } from "vitest/config";
import { readFileSync } from "fs";

function loadDotEnv(): Record<string, string> {
  try {
    const content = readFileSync(".env", "utf-8");
    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    }
    return env;
  } catch {
    return {};
  }
}

export default defineConfig({
  test: {
    env: loadDotEnv(),
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});

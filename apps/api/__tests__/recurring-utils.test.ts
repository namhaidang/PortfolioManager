import { describe, it, expect } from "vitest";
import { getNextDueDate } from "../src/utils/recurring.js";

describe("getNextDueDate", () => {
  it("monthly with occurrence 0 returns the start date", () => {
    expect(getNextDueDate("2025-01-15", "monthly", 0)).toBe("2025-01-15");
  });

  it("monthly with occurrence 3 adds 3 months", () => {
    expect(getNextDueDate("2025-01-15", "monthly", 3)).toBe("2025-04-15");
  });

  it("quarterly with occurrence 2 adds 6 months", () => {
    expect(getNextDueDate("2025-01-01", "quarterly", 2)).toBe("2025-07-01");
  });

  it("yearly with occurrence 1 adds 1 year", () => {
    expect(getNextDueDate("2025-06-01", "yearly", 1)).toBe("2026-06-01");
  });
});

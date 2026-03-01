import { describe, it, expect, beforeAll } from "vitest";
import { app, getTestToken, authHeaders } from "./helpers.js";

describe("GET /categories", () => {
  let token: string;

  beforeAll(async () => {
    token = await getTestToken();
  });

  it("returns 401 without auth", async () => {
    const res = await app.request("/categories");
    expect(res.status).toBe(401);
  });

  it("returns all categories", async () => {
    const res = await app.request("/categories", {
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);

    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("id");
    expect(rows[0]).toHaveProperty("name");
    expect(rows[0]).toHaveProperty("type");
  });

  it("filters by type=income", async () => {
    const res = await app.request("/categories?type=income", {
      headers: authHeaders(token),
    });
    const rows = await res.json();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.type).toBe("income");
    }
  });

  it("filters by type=expense", async () => {
    const res = await app.request("/categories?type=expense", {
      headers: authHeaders(token),
    });
    const rows = await res.json();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.type).toBe("expense");
    }
  });
});

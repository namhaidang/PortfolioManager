import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app, getTestToken, authHeaders } from "./helpers.js";

describe("/recurring-rules", () => {
  let token: string;
  let testUserId: string;
  let testAccountId: string;
  let testCategoryId: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    token = await getTestToken();

    const meRes = await app.request("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = await meRes.json();
    testUserId = me.id;

    const acctRes = await app.request("/accounts", {
      headers: authHeaders(token),
    });
    const accounts = await acctRes.json();
    testAccountId = accounts[0].id;

    const catRes = await app.request("/categories?type=income", {
      headers: authHeaders(token),
    });
    const cats = await catRes.json();
    testCategoryId = cats[0].id;
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await app.request(`/recurring-rules/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
    }
  });

  it("GET /recurring-rules returns 401 without auth", async () => {
    const res = await app.request("/recurring-rules");
    expect(res.status).toBe(401);
  });

  it("GET /recurring-rules returns a list", async () => {
    const res = await app.request("/recurring-rules", {
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  it("POST /recurring-rules creates a monthly income rule", async () => {
    const res = await app.request("/recurring-rules", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        userId: testUserId,
        type: "income",
        categoryId: testCategoryId,
        accountId: testAccountId,
        amount: 5000000,
        frequency: "monthly",
        startDate: "2025-03-01",
        description: "vitest monthly salary",
      }),
    });
    expect(res.status).toBe(201);

    const row = await res.json();
    expect(row.id).toBeDefined();
    expect(row.type).toBe("income");
    expect(row.frequency).toBe("monthly");
    expect(row.description).toBe("vitest monthly salary");
    expect(row.isActive).toBe(true);
    expect(row.nextDueDate).toBeDefined();
    createdIds.push(row.id);
  });

  it("POST /recurring-rules returns 400 for missing fields", async () => {
    const res = await app.request("/recurring-rules", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ type: "income" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /recurring-rules returns 400 for invalid type", async () => {
    const res = await app.request("/recurring-rules", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        userId: testUserId,
        type: "transfer",
        categoryId: testCategoryId,
        accountId: testAccountId,
        amount: 100,
        frequency: "monthly",
        startDate: "2025-03-01",
        description: "bad type",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /recurring-rules returns 400 for invalid maxOccurrences", async () => {
    const res = await app.request("/recurring-rules", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        userId: testUserId,
        type: "income",
        categoryId: testCategoryId,
        accountId: testAccountId,
        amount: 100,
        frequency: "monthly",
        startDate: "2025-03-01",
        description: "bad occurrences",
        maxOccurrences: -5,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("GET /recurring-rules filters by type", async () => {
    const res = await app.request("/recurring-rules?type=income", {
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);

    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    for (const r of rows) {
      expect(r.type).toBe("income");
    }
  });

  it("PATCH /recurring-rules/:id updates amount and description", async () => {
    expect(createdIds.length).toBeGreaterThan(0);
    const id = createdIds[0];

    const res = await app.request(`/recurring-rules/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ amount: 6000000, description: "updated salary" }),
    });
    expect(res.status).toBe(200);

    const row = await res.json();
    expect(row.amount).toBe("6000000");
    expect(row.description).toBe("updated salary");
  });

  it("PATCH /recurring-rules/:id toggles isActive", async () => {
    const id = createdIds[0];

    const pause = await app.request(`/recurring-rules/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ isActive: false }),
    });
    expect(pause.status).toBe(200);
    expect((await pause.json()).isActive).toBe(false);

    const resume = await app.request(`/recurring-rules/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ isActive: true }),
    });
    expect(resume.status).toBe(200);
    expect((await resume.json()).isActive).toBe(true);
  });

  it("PATCH /recurring-rules/:id returns 404 for non-existent id", async () => {
    const res = await app.request("/recurring-rules/nonexistent_id_xyz", {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ isActive: false }),
    });
    expect(res.status).toBe(404);
  });

  it("DELETE /recurring-rules/:id removes a rule", async () => {
    const id = createdIds.pop()!;
    const res = await app.request(`/recurring-rules/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("DELETE /recurring-rules/:id returns 404 for non-existent id", async () => {
    const res = await app.request("/recurring-rules/nonexistent_id_xyz", {
      method: "DELETE",
      headers: authHeaders(token),
    });
    expect(res.status).toBe(404);
  });
});

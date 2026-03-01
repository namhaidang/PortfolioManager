import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app, getTestToken, authHeaders } from "./helpers.js";

describe("/transactions", () => {
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
      await app.request(`/transactions/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
    }
  });

  it("GET /transactions returns 401 without auth", async () => {
    const res = await app.request("/transactions");
    expect(res.status).toBe(401);
  });

  it("GET /transactions returns paginated data", async () => {
    const res = await app.request("/transactions?type=income&limit=5", {
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("limit");
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /transactions creates an income transaction", async () => {
    const res = await app.request("/transactions", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        userId: testUserId,
        accountId: testAccountId,
        type: "income",
        categoryId: testCategoryId,
        date: "2025-01-15",
        amount: 1000000,
        notes: "vitest income",
      }),
    });
    expect(res.status).toBe(201);

    const row = await res.json();
    expect(row.id).toBeDefined();
    expect(row.type).toBe("income");
    expect(row.notes).toBe("vitest income");
    createdIds.push(row.id);
  });

  it("POST /transactions creates an expense transaction", async () => {
    const catRes = await app.request("/categories?type=expense", {
      headers: authHeaders(token),
    });
    const expCats = await catRes.json();

    const res = await app.request("/transactions", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        userId: testUserId,
        accountId: testAccountId,
        type: "expense",
        categoryId: expCats[0].id,
        date: "2025-01-15",
        amount: 500000,
        notes: "vitest expense",
        tags: ["needs"],
      }),
    });
    expect(res.status).toBe(201);

    const row = await res.json();
    expect(row.type).toBe("expense");
    expect(row.tags).toContain("needs");
    createdIds.push(row.id);
  });

  it("POST /transactions returns 400 for missing fields", async () => {
    const res = await app.request("/transactions", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ type: "income" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /transactions returns 400 for invalid type", async () => {
    const res = await app.request("/transactions", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        userId: testUserId,
        accountId: testAccountId,
        type: "invalid",
        categoryId: testCategoryId,
        date: "2025-01-15",
        amount: 100,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /transactions/:id updates a transaction", async () => {
    expect(createdIds.length).toBeGreaterThan(0);
    const id = createdIds[0];

    const res = await app.request(`/transactions/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ notes: "updated by vitest" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).notes).toBe("updated by vitest");
  });

  it("PATCH /transactions/:id returns 400 with empty body", async () => {
    const id = createdIds[0];
    const res = await app.request(`/transactions/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("DELETE /transactions/:id removes a transaction", async () => {
    const id = createdIds.pop()!;
    const res = await app.request(`/transactions/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("DELETE /transactions/:id returns 404 for non-existent id", async () => {
    const res = await app.request("/transactions/nonexistent_id_xyz", {
      method: "DELETE",
      headers: authHeaders(token),
    });
    expect(res.status).toBe(404);
  });

  it("GET /transactions/summary returns monthly aggregation", async () => {
    const res = await app.request("/transactions/summary?month=1&year=2025", {
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("income");
    expect(body).toHaveProperty("expenses");
    expect(body).toHaveProperty("prevIncome");
    expect(body).toHaveProperty("prevExpenses");
    expect(typeof body.income).toBe("number");
  });
});

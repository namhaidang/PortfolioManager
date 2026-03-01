import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app, getTestToken, authHeaders } from "./helpers.js";

describe("/accounts", () => {
  let token: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    token = await getTestToken();
  });

  afterAll(async () => {
    for (const id of createdIds) {
      await app.request(`/accounts/${id}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ isActive: false }),
      });
    }
  });

  it("GET /accounts returns 401 without auth", async () => {
    const res = await app.request("/accounts");
    expect(res.status).toBe(401);
  });

  it("GET /accounts returns a list", async () => {
    const res = await app.request("/accounts", {
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);

    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("id");
    expect(rows[0]).toHaveProperty("name");
    expect(rows[0]).toHaveProperty("currency");
  });

  it("POST /accounts creates an account", async () => {
    const res = await app.request("/accounts", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ name: "Test Account (vitest)", type: "bank", currency: "VND" }),
    });
    expect(res.status).toBe(201);

    const row = await res.json();
    expect(row.name).toBe("Test Account (vitest)");
    expect(row.type).toBe("bank");
    expect(row.currency).toBe("VND");
    expect(row.isActive).toBe(true);
    createdIds.push(row.id);
  });

  it("POST /accounts returns 400 if name missing", async () => {
    const res = await app.request("/accounts", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ type: "bank", currency: "VND" }),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /accounts/:id toggles isActive", async () => {
    expect(createdIds.length).toBeGreaterThan(0);
    const id = createdIds[0];

    const deactivate = await app.request(`/accounts/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ isActive: false }),
    });
    expect(deactivate.status).toBe(200);
    expect((await deactivate.json()).isActive).toBe(false);

    const activate = await app.request(`/accounts/${id}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ isActive: true }),
    });
    expect(activate.status).toBe(200);
    expect((await activate.json()).isActive).toBe(true);
  });

  it("PATCH /accounts/:id returns 404 for non-existent id", async () => {
    const res = await app.request("/accounts/nonexistent_id_xyz", {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ isActive: false }),
    });
    expect(res.status).toBe(404);
  });
});

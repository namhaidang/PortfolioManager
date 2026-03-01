import { describe, it, expect, beforeAll } from "vitest";
import { app, getTestToken, authHeaders } from "./helpers.js";

describe("/user", () => {
  let token: string;

  beforeAll(async () => {
    token = await getTestToken();
  });

  it("GET /user returns 401 without auth", async () => {
    const res = await app.request("/user");
    expect(res.status).toBe(401);
  });

  it("GET /user lists household users", async () => {
    const res = await app.request("/user", {
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);

    const rows = await res.json();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]).toHaveProperty("id");
    expect(rows[0]).toHaveProperty("name");
  });

  it("PATCH /user/profile updates name and returns new token", async () => {
    const meRes = await app.request("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const original = await meRes.json();

    const res = await app.request("/user/profile", {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ name: "Test Name (vitest)" }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.token.split(".")).toHaveLength(3);

    // Restore original name
    await app.request("/user/profile", {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ name: original.name }),
    });
  });

  it("PATCH /user/profile returns 400 with empty body", async () => {
    const res = await app.request("/user/profile", {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /user/profile rejects invalid theme", async () => {
    const res = await app.request("/user/profile", {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ theme: "neon" }),
    });
    expect(res.status).toBe(400);
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { app, TEST_USER, getTestToken } from "./helpers.js";

describe("POST /auth/login", () => {
  it("returns a JWT for valid credentials", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe("string");
    expect(body.token.split(".")).toHaveLength(3);
  });

  it("returns 401 for wrong password", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_USER.email, password: "wrong" }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid credentials" });
  });

  it("returns 401 for non-existent email", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@test.com", password: "x" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when email or password missing", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /auth/me", () => {
  let token: string;

  beforeAll(async () => {
    token = await getTestToken();
  });

  it("returns the authenticated user", async () => {
    const res = await app.request("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);

    const user = await res.json();
    expect(user.email).toBe(TEST_USER.email);
    expect(user.id).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.role).toBeDefined();
  });

  it("returns 401 without a token", async () => {
    const res = await app.request("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const res = await app.request("/auth/me", {
      headers: { Authorization: "Bearer invalid.token.here" },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid token" });
  });
});

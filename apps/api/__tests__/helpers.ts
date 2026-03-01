import app from "../src/hono-app.js";

const TEST_USER = { email: "owner@family.local", password: "password123" };

let cachedToken: string | null = null;

export async function getTestToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const res = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(TEST_USER),
  });

  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const { token } = await res.json();
  cachedToken = token;
  return token;
}

export function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function resetTokenCache() {
  cachedToken = null;
}

export { app, TEST_USER };

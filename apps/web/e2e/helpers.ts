import { expect, type Page } from "@playwright/test";
import { join } from "path";

export const BASE_URL = "http://localhost:3000";
export const API_URL = "http://localhost:3001";
export const SCREENSHOTS_DIR = join(__dirname, "screenshots");

export const TEST_CREDENTIALS = {
  email: "owner@family.local",
  password: "password123",
};

export async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page
    .getByRole("textbox", { name: /email/i })
    .fill(TEST_CREDENTIALS.email);
  await page.getByLabel(/password/i).fill(TEST_CREDENTIALS.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
}

// ---------------------------------------------------------------------------
// API-level helpers for test data setup (bypasses browser, fast & isolated)
// ---------------------------------------------------------------------------

let _apiToken: string | null = null;

export async function getApiToken(): Promise<string> {
  if (_apiToken) return _apiToken;
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(TEST_CREDENTIALS),
  });
  if (!res.ok) throw new Error(`API login failed: ${res.status}`);
  const { token } = (await res.json()) as { token: string };
  _apiToken = token;
  return token;
}

export async function createTransactionViaAPI(
  type: "income" | "expense",
  overrides?: Partial<{ amount: number; notes: string; tags: string[] }>,
): Promise<{ id: string }> {
  const token = await getApiToken();
  const headers = { Authorization: `Bearer ${token}` };

  const [meRes, catRes, acctRes] = await Promise.all([
    fetch(`${API_URL}/auth/me`, { headers }),
    fetch(`${API_URL}/categories?type=${type}`, { headers }),
    fetch(`${API_URL}/accounts`, { headers }),
  ]);

  if (!meRes.ok || !catRes.ok || !acctRes.ok) {
    throw new Error(
      `API setup failed: me=${meRes.status} cat=${catRes.status} acct=${acctRes.status}`,
    );
  }

  const user = (await meRes.json()) as { id: string };
  const categories = (await catRes.json()) as { id: string }[];
  const accounts = (await acctRes.json()) as { id: string }[];

  const res = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      accountId: accounts[0].id,
      type,
      categoryId: categories[0].id,
      date: new Date().toISOString().split("T")[0],
      amount: overrides?.amount ?? 1_000_000,
      notes: overrides?.notes ?? `E2E ${type} fixture`,
      tags: overrides?.tags ?? null,
    }),
  });

  if (!res.ok) throw new Error(`Create transaction failed: ${res.status}`);
  return (await res.json()) as { id: string };
}

export async function deleteTransactionViaAPI(id: string): Promise<void> {
  const token = await getApiToken();
  await fetch(`${API_URL}/transactions/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function findLatestTransactionViaAPI(
  type: "income" | "expense",
  search?: string,
): Promise<{ id: string } | null> {
  const token = await getApiToken();
  const params = new URLSearchParams({ type, limit: "1" });
  if (search) params.set("search", search);
  const res = await fetch(`${API_URL}/transactions?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const { data } = (await res.json()) as { data: { id: string }[] };
  return data[0] ?? null;
}

export async function deleteAccountViaAPI(id: string): Promise<void> {
  const token = await getApiToken();
  await fetch(`${API_URL}/accounts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createRecurringRuleViaAPI(
  overrides?: Partial<{
    type: "income" | "expense";
    amount: number;
    frequency: string;
    description: string;
  }>,
): Promise<{ id: string }> {
  const token = await getApiToken();
  const headers = { Authorization: `Bearer ${token}` };

  const [meRes, catRes, acctRes] = await Promise.all([
    fetch(`${API_URL}/auth/me`, { headers }),
    fetch(`${API_URL}/categories?type=${overrides?.type ?? "income"}`, { headers }),
    fetch(`${API_URL}/accounts`, { headers }),
  ]);

  if (!meRes.ok || !catRes.ok || !acctRes.ok) {
    throw new Error(
      `API setup failed: me=${meRes.status} cat=${catRes.status} acct=${acctRes.status}`,
    );
  }

  const user = (await meRes.json()) as { id: string };
  const categories = (await catRes.json()) as { id: string }[];
  const accounts = (await acctRes.json()) as { id: string }[];

  const res = await fetch(`${API_URL}/recurring-rules`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      type: overrides?.type ?? "income",
      categoryId: categories[0].id,
      accountId: accounts[0].id,
      amount: overrides?.amount ?? 5_000_000,
      frequency: overrides?.frequency ?? "monthly",
      startDate: new Date().toISOString().split("T")[0],
      description: overrides?.description ?? `E2E rule ${Date.now()}`,
    }),
  });

  if (!res.ok) throw new Error(`Create recurring rule failed: ${res.status}`);
  return (await res.json()) as { id: string };
}

export async function findRecurringRuleByDescriptionViaAPI(
  description: string,
): Promise<{ id: string } | null> {
  const token = await getApiToken();
  const res = await fetch(`${API_URL}/recurring-rules`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const rules = (await res.json()) as { id: string; description: string }[];
  return rules.find((r) => r.description === description) ?? null;
}

export async function deleteRecurringRuleViaAPI(id: string): Promise<void> {
  const token = await getApiToken();
  await fetch(`${API_URL}/recurring-rules/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function findAccountByNameViaAPI(
  name: string,
): Promise<{ id: string } | null> {
  const token = await getApiToken();
  const res = await fetch(`${API_URL}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const accounts = (await res.json()) as { id: string; name: string }[];
  return accounts.find((a) => a.name === name) ?? null;
}

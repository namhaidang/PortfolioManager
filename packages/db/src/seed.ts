import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { hash } from "bcryptjs";
import { ulid } from "ulidx";
import * as schema from "./schema";

const client = createClient({ url: process.env.DATABASE_URL || "file:./data/local.db" });
const db = drizzle(client, { schema });

const INCOME_CATEGORIES = [
  { name: "Salary", icon: "banknote" },
  { name: "Business Income", icon: "building" },
  { name: "Dividends", icon: "coins" },
  { name: "Interest", icon: "percent" },
  { name: "Rental Income", icon: "home" },
  { name: "Investment Income", icon: "trending-up" },
  { name: "Freelance", icon: "laptop" },
  { name: "Gifts", icon: "gift" },
  { name: "Other Income", icon: "circle-dot" },
];

const EXPENSE_CATEGORIES = [
  { name: "Housing", icon: "home" },
  { name: "Food", icon: "utensils" },
  { name: "Transport", icon: "car" },
  { name: "Utilities", icon: "zap" },
  { name: "Insurance", icon: "shield" },
  { name: "Healthcare", icon: "heart-pulse" },
  { name: "Entertainment", icon: "tv" },
  { name: "Education", icon: "graduation-cap" },
  { name: "Subscriptions", icon: "repeat" },
  { name: "Childcare", icon: "baby" },
  { name: "Gifts", icon: "gift" },
  { name: "Travel", icon: "plane" },
  { name: "Clothing", icon: "shirt" },
  { name: "Personal Care", icon: "sparkles" },
  { name: "Donations", icon: "hand-heart" },
  { name: "Taxes", icon: "receipt" },
  { name: "Loan Repayment", icon: "landmark" },
  { name: "Other Expense", icon: "circle-dot" },
];

async function seed() {
  console.log("Seeding database...");
  const now = new Date();

  // ── Users ──────────────────────────────────────────────────────────────────
  const ownerHash = await hash("password123", 12);
  const memberHash = await hash("password123", 12);

  const ownerId = ulid();
  const memberId = ulid();

  await db.insert(schema.users).values([
    {
      id: ownerId,
      name: "Owner",
      email: "owner@family.local",
      passwordHash: ownerHash,
      role: "owner",
      theme: "light",
      createdAt: now,
    },
    {
      id: memberId,
      name: "Member",
      email: "member@family.local",
      passwordHash: memberHash,
      role: "member",
      theme: "light",
      createdAt: now,
    },
  ]);
  console.log("  Created 2 users (owner@family.local / member@family.local)");

  // ── Categories ─────────────────────────────────────────────────────────────
  const incomeRows = INCOME_CATEGORIES.map((c, i) => ({
    id: ulid(),
    name: c.name,
    type: "income" as const,
    icon: c.icon,
    sortOrder: i,
  }));

  const expenseRows = EXPENSE_CATEGORIES.map((c, i) => ({
    id: ulid(),
    name: c.name,
    type: "expense" as const,
    icon: c.icon,
    sortOrder: i,
  }));

  await db.insert(schema.categories).values([...incomeRows, ...expenseRows]);
  console.log(`  Created ${incomeRows.length} income + ${expenseRows.length} expense categories`);

  // ── Sample Accounts ────────────────────────────────────────────────────────
  await db.insert(schema.accounts).values([
    {
      id: ulid(),
      userId: ownerId,
      name: "VPS Securities",
      type: "brokerage",
      currency: "VND",
      isActive: true,
      createdAt: now,
    },
    {
      id: ulid(),
      userId: ownerId,
      name: "Vietcombank",
      type: "bank",
      currency: "VND",
      isActive: true,
      createdAt: now,
    },
    {
      id: ulid(),
      userId: ownerId,
      name: "DBS Vickers",
      type: "brokerage",
      currency: "SGD",
      isActive: true,
      createdAt: now,
    },
    {
      id: ulid(),
      userId: ownerId,
      name: "DBS Savings",
      type: "bank",
      currency: "SGD",
      isActive: true,
      createdAt: now,
    },
    {
      id: ulid(),
      userId: memberId,
      name: "Techcombank",
      type: "bank",
      currency: "VND",
      isActive: true,
      createdAt: now,
    },
    {
      id: ulid(),
      userId: memberId,
      name: "Cash Wallet",
      type: "cash",
      currency: "VND",
      isActive: true,
      createdAt: now,
    },
  ]);
  console.log("  Created 6 sample accounts");

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

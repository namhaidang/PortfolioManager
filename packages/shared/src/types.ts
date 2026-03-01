// Domain enums

export type Currency = "VND" | "SGD";

export type AccountType = "brokerage" | "bank" | "cash" | "crypto_wallet" | "property";

export type AssetClass = "stock" | "etf" | "bond" | "gold" | "crypto" | "real_estate" | "cash" | "other";

export type Market = "HOSE" | "HNX" | "UPCOM" | "SGX" | "CRYPTO" | "OTHER";

export type TransactionType = "income" | "expense" | "buy" | "sell" | "dividend" | "transfer";

export type UserRole = "owner" | "member";

// Shared API response types

export interface HouseholdUser {
  id: string;
  name: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  icon: string | null;
}

export interface AccountOption {
  id: string;
  userId: string;
  name: string;
  type: string;
  currency: string;
  isActive: boolean;
}

export interface TransactionRow {
  id: string;
  userId: string;
  recordedByUserId: string | null;
  accountId: string;
  type: string;
  categoryId: string | null;
  recurringRuleId: string | null;
  date: string;
  amount: string;
  notes: string | null;
  tags: string[] | null;
  createdAt: string;
  categoryName: string | null;
  categoryIcon: string | null;
  accountName: string | null;
  accountCurrency: string | null;
  userName: string | null;
}

export interface MonthlySummaryData {
  income: number;
  expenses: number;
  prevIncome: number;
  prevExpenses: number;
}

export interface RecurringRuleRow {
  id: string;
  userId: string;
  recordedByUserId: string | null;
  type: string;
  categoryId: string;
  accountId: string;
  amount: string;
  currency: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  maxOccurrences: number | null;
  occurrenceCount: number;
  description: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  categoryName: string | null;
  accountName: string | null;
  userName: string | null;
  nextDueDate: string;
}

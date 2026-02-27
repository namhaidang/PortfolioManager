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

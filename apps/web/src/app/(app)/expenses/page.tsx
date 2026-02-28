"use client";

import { TransactionPage } from "@/components/transactions/transaction-page";

export default function ExpensesPage() {
  return (
    <TransactionPage
      type="expense"
      title="Expenses"
      description="Track and control household spending"
    />
  );
}

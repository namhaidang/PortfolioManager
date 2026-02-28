"use client";

import { TransactionPage } from "@/components/transactions/transaction-page";

export default function IncomePage() {
  return (
    <TransactionPage
      type="income"
      title="Income"
      description="Track all household income streams"
    />
  );
}

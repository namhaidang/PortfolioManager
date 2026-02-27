import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { users, categories, accounts } from "@repo/db/schema";
import { TransactionPage } from "@/components/transactions/transaction-page";

export default async function ExpensesPage() {
  const session = await auth();

  const [householdUsers, expenseCategories, activeAccounts] = await Promise.all([
    db.select({ id: users.id, name: users.name }).from(users),
    db
      .select({ id: categories.id, name: categories.name, icon: categories.icon })
      .from(categories)
      .where(eq(categories.type, "expense"))
      .orderBy(categories.sortOrder),
    db.select().from(accounts).where(eq(accounts.isActive, true)),
  ]);

  return (
    <TransactionPage
      type="expense"
      title="Expenses"
      description="Track and control household spending"
      users={householdUsers}
      categories={expenseCategories}
      accounts={activeAccounts}
      currentUserId={session!.user!.id}
    />
  );
}

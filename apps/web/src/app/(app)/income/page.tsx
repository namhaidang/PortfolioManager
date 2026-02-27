import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { users, categories, accounts } from "@repo/db/schema";
import { TransactionPage } from "@/components/transactions/transaction-page";

export default async function IncomePage() {
  const session = await auth();

  const [householdUsers, incomeCategories, activeAccounts] = await Promise.all([
    db.select({ id: users.id, name: users.name }).from(users),
    db
      .select({ id: categories.id, name: categories.name, icon: categories.icon })
      .from(categories)
      .where(eq(categories.type, "income"))
      .orderBy(categories.sortOrder),
    db.select().from(accounts).where(eq(accounts.isActive, true)),
  ]);

  return (
    <TransactionPage
      type="income"
      title="Income"
      description="Track all household income streams"
      users={householdUsers}
      categories={incomeCategories}
      accounts={activeAccounts}
      currentUserId={session!.user!.id}
    />
  );
}

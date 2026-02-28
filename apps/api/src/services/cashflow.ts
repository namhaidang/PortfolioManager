import { and, eq, gte, lt, sql, inArray } from "drizzle-orm";
import { db } from "@repo/db";
import { transactions } from "@repo/db/schema";
import type { MonthlySummaryData } from "@repo/shared/types";

function monthBounds(month: number, year: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, end };
}

export async function getMonthlySummary(
  month: number,
  year: number,
  userId?: string,
): Promise<MonthlySummaryData> {
  const prev = month === 1 ? { m: 12, y: year - 1 } : { m: month - 1, y: year };
  const prevBounds = monthBounds(prev.m, prev.y);
  const currBounds = monthBounds(month, year);

  const conditions = [
    gte(transactions.date, prevBounds.start),
    lt(transactions.date, currBounds.end),
    inArray(transactions.type, ["income", "expense"]),
  ];
  if (userId) conditions.push(eq(transactions.userId, userId));

  const rows = await db
    .select({
      type: transactions.type,
      currentTotal: sql<string>`sum(case when ${transactions.date} >= ${currBounds.start} and ${transactions.date} < ${currBounds.end} then ${transactions.amount}::numeric else 0 end)`,
      prevTotal: sql<string>`sum(case when ${transactions.date} >= ${prevBounds.start} and ${transactions.date} < ${currBounds.start} then ${transactions.amount}::numeric else 0 end)`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.type);

  const result: MonthlySummaryData = { income: 0, expenses: 0, prevIncome: 0, prevExpenses: 0 };

  for (const row of rows) {
    const current = parseFloat(row.currentTotal) || 0;
    const previous = parseFloat(row.prevTotal) || 0;
    if (row.type === "income") {
      result.income = current;
      result.prevIncome = previous;
    } else {
      result.expenses = current;
      result.prevExpenses = previous;
    }
  }

  return result;
}

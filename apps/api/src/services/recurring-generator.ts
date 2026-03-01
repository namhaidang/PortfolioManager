import { eq } from "drizzle-orm";
import { isAfter } from "date-fns";
import { db } from "@repo/db";
import { recurringRules, transactions } from "@repo/db/schema";
import { newId } from "@repo/shared";
import { getNextDueDate, type Frequency } from "../utils/recurring.js";

const MAX_OCCURRENCES_PER_RULE_PER_RUN = 100;

export async function runRecurringGenerator(
  todayStr: string,
): Promise<{ generated: number; errors: string[] }> {
  const today = new Date(todayStr + "T00:00:00");
  const errors: string[] = [];
  let generated = 0;

  const rules = await db
    .select()
    .from(recurringRules)
    .where(eq(recurringRules.isActive, true));

  for (const rule of rules) {
    const freq = rule.frequency as Frequency;
    let occurrenceCount = rule.occurrenceCount;
    let ruleGenerated = 0;

    while (ruleGenerated < MAX_OCCURRENCES_PER_RULE_PER_RUN) {
      const nextDue = getNextDueDate(rule.startDate, freq, occurrenceCount);
      const nextDueDate = new Date(nextDue + "T00:00:00");

      if (isAfter(nextDueDate, today)) break;
      if (rule.endDate && isAfter(nextDueDate, new Date(rule.endDate + "T00:00:00"))) break;
      if (rule.maxOccurrences != null && occurrenceCount >= rule.maxOccurrences) break;

      try {
        await db.transaction(async (tx) => {
          await tx.insert(transactions).values({
            id: newId(),
            userId: rule.userId,
            recordedByUserId: null,
            accountId: rule.accountId,
            type: rule.type,
            categoryId: rule.categoryId,
            recurringRuleId: rule.id,
            date: nextDue,
            amount: rule.amount,
            notes: rule.notes,
            tags: null,
          });
          await tx
            .update(recurringRules)
            .set({ occurrenceCount: occurrenceCount + 1 })
            .where(eq(recurringRules.id, rule.id));
        });
        ruleGenerated++;
        occurrenceCount++;
      } catch (err) {
        errors.push(`${rule.id}: ${err instanceof Error ? err.message : String(err)}`);
        break;
      }
    }

    generated += ruleGenerated;
  }

  return { generated, errors };
}

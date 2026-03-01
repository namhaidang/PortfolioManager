import { addMonths, addYears, format } from "date-fns";

export type Frequency = "monthly" | "quarterly" | "yearly";

export function getNextDueDate(
  startDateStr: string,
  frequency: Frequency,
  occurrenceCount: number,
): string {
  const start = new Date(startDateStr + "T00:00:00");
  const add = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
  const next =
    frequency === "yearly"
      ? addYears(start, occurrenceCount)
      : addMonths(start, occurrenceCount * add);
  return format(next, "yyyy-MM-dd");
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ulid } from "ulidx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newId(): string {
  return ulid();
}

export function formatCurrency(amount: number, currency: "VND" | "SGD" = "VND"): string {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(amount);
}

export function parseNumeric(value: string | null | undefined): number {
  if (!value) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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

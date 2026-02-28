"use client";

import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { MonthlySummaryData } from "@repo/shared/types";

interface MonthlySummaryProps {
  type: "income" | "expense";
  data: MonthlySummaryData | null;
}

export function MonthlySummary({ type, data }: MonthlySummaryProps) {
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const current = type === "income" ? data.income : data.expenses;
  const previous = type === "income" ? data.prevIncome : data.prevExpenses;
  const noHistory = current === 0 && previous === 0;
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;
  const isGood = type === "income" ? isPositive : !isPositive;
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {type === "income" ? "Income" : "Expenses"} this month
          </CardTitle>
          {type === "income" ? (
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(current)}</div>
          <p className="text-xs text-muted-foreground">{monthName}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">vs Last Month</CardTitle>
          {noHistory ? (
            <ArrowUp className="h-4 w-4 text-muted-foreground" />
          ) : isPositive ? (
            <ArrowUp
              className={`h-4 w-4 ${isGood ? "text-green-500" : "text-red-500"}`}
            />
          ) : (
            <ArrowDown
              className={`h-4 w-4 ${isGood ? "text-green-500" : "text-red-500"}`}
            />
          )}
        </CardHeader>
        <CardContent>
          {noHistory ? (
            <>
              <div className="text-2xl font-bold text-muted-foreground">—</div>
              <p className="text-xs text-muted-foreground">No data yet</p>
            </>
          ) : (
            <>
              <div
                className={`text-2xl font-bold ${isGood ? "text-green-600" : "text-red-600"}`}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Previous: {formatCurrency(previous)}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

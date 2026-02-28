"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { MonthlySummaryData } from "@repo/shared/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<MonthlySummaryData>({
    income: 0,
    expenses: 0,
    prevIncome: 0,
    prevExpenses: 0,
  });

  useEffect(() => {
    const now = new Date();
    const params = new URLSearchParams({
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
    });
    apiFetch(`/transactions/summary?${params}`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  function changeLabel(current: number, previous: number): string {
    if (previous === 0) return "No prior data";
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs last month`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Portfolio data coming in Phase 6
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.income)}
            </div>
            <p className="text-xs text-muted-foreground">
              {changeLabel(summary.income, summary.prevIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {changeLabel(summary.expenses, summary.prevExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Portfolio tracking in Phase 6
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Expenses</h1>
        <p className="text-muted-foreground">Track and control household spending</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Expense tracking coming in Phase 2</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Categorize expenses, set budgets, and track recurring bills
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

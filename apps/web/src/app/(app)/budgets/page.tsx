import { PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budgets</h1>
        <p className="text-muted-foreground">Plan and control spending with yearly budgets</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Budget planning coming in Phase 7</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set yearly budgets with monthly rollover and tracking
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

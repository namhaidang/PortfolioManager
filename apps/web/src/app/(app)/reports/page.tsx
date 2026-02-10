import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Analytics and performance insights</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Reports and analytics coming in Phase 8</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Asset allocation, portfolio performance, and financial health
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function IncomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Income</h1>
        <p className="text-muted-foreground">Track all household income streams</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Income tracking coming in Phase 2</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Record salary, dividends, investment income, and more
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

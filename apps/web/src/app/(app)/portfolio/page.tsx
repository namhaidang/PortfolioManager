import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Manage investments across Vietnam and Singapore</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Portfolio management coming in Phase 4</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track stocks, ETFs, bonds, gold, crypto, and real estate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

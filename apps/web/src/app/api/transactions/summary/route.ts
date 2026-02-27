import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMonthlySummary } from "@/lib/services/cashflow";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const now = new Date();
  const month = parseInt(sp.get("month") || String(now.getMonth() + 1), 10);
  const year = parseInt(sp.get("year") || String(now.getFullYear()), 10);
  const userId = sp.get("userId") || undefined;

  const summary = await getMonthlySummary(month, year, userId);

  return NextResponse.json(summary);
}

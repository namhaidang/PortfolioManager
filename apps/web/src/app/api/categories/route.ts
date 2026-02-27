import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { categories } from "@repo/db/schema";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");

  const rows = await db
    .select()
    .from(categories)
    .where(type === "income" || type === "expense" ? eq(categories.type, type) : undefined)
    .orderBy(categories.sortOrder);

  return NextResponse.json(rows);
}

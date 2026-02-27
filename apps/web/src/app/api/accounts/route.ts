import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { accounts } from "@repo/db/schema";
import { newId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("userId");

  const rows = await db
    .select()
    .from(accounts)
    .where(userId ? eq(accounts.userId, userId) : undefined)
    .orderBy(accounts.createdAt);

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, type, currency, userId } = await request.json();

  if (!name || !type || !currency) {
    return NextResponse.json({ error: "name, type, and currency are required" }, { status: 400 });
  }

  const [row] = await db
    .insert(accounts)
    .values({
      id: newId(),
      userId: userId || session.user.id,
      name: name.trim(),
      type,
      currency,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

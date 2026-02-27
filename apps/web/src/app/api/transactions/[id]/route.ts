import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { transactions } from "@repo/db/schema";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.userId) updates.userId = body.userId;
  if (body.accountId) updates.accountId = body.accountId;
  if (body.categoryId) updates.categoryId = body.categoryId;
  if (body.date) updates.date = body.date;
  if (body.amount != null) updates.amount = String(body.amount);
  if (body.notes !== undefined) updates.notes = body.notes || null;
  if (body.tags !== undefined) updates.tags = body.tags || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [row] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();

  if (!row) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [row] = await db.delete(transactions).where(eq(transactions.id, id)).returning();

  if (!row) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

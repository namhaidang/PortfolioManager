import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { accounts } from "@repo/db/schema";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.name && typeof body.name === "string") updates.name = body.name.trim();
  if (body.type) updates.type = body.type;
  if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [row] = await db.update(accounts).set(updates).where(eq(accounts.id, id)).returning();

  if (!row) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { users } from "@repo/db/schema";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, theme } = await request.json();

  const updates: Partial<{ name: string; theme: "light" | "dark" }> = {};

  if (name && typeof name === "string") updates.name = name.trim();
  if (theme === "light" || theme === "dark") updates.theme = theme;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await db.update(users).set(updates).where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}

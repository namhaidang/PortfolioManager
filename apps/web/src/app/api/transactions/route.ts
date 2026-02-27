import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, lte, ilike, desc, asc, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@repo/db";
import { transactions, categories, accounts, users } from "@repo/db/schema";
import { newId } from "@/lib/utils";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const type = sp.get("type");
  const userId = sp.get("userId");
  const categoryId = sp.get("categoryId");
  const accountId = sp.get("accountId");
  const dateFrom = sp.get("dateFrom");
  const dateTo = sp.get("dateTo");
  const search = sp.get("search");
  const sortBy = sp.get("sortBy") || "date";
  const sortOrder = sp.get("sortOrder") || "desc";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || String(PAGE_SIZE), 10)));

  type TxType = "income" | "expense" | "buy" | "sell" | "dividend" | "transfer";
  const conditions = [];
  if (type) conditions.push(eq(transactions.type, type as TxType));
  if (userId) conditions.push(eq(transactions.userId, userId));
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
  if (accountId) conditions.push(eq(transactions.accountId, accountId));
  if (dateFrom) conditions.push(gte(transactions.date, dateFrom));
  if (dateTo) conditions.push(lte(transactions.date, dateTo));
  if (search) conditions.push(ilike(transactions.notes, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortCol =
    sortBy === "amount" ? transactions.amount :
    sortBy === "category" ? categories.name :
    transactions.date;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        recordedByUserId: transactions.recordedByUserId,
        accountId: transactions.accountId,
        type: transactions.type,
        categoryId: transactions.categoryId,
        date: transactions.date,
        amount: transactions.amount,
        notes: transactions.notes,
        tags: transactions.tags,
        createdAt: transactions.createdAt,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        accountName: accounts.name,
        accountCurrency: accounts.currency,
        userName: users.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(where)
      .orderBy(orderFn(sortCol), desc(transactions.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(where),
  ]);

  return NextResponse.json({ data: rows, total: Number(countResult[0].count), page, limit });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, accountId, type, categoryId, date, amount, notes, tags } = body;

  if (!userId || !accountId || !type || !categoryId || !date || amount == null) {
    return NextResponse.json(
      { error: "userId, accountId, type, categoryId, date, and amount are required" },
      { status: 400 },
    );
  }

  if (type !== "income" && type !== "expense") {
    return NextResponse.json({ error: "type must be income or expense" }, { status: 400 });
  }

  const [row] = await db
    .insert(transactions)
    .values({
      id: newId(),
      userId,
      recordedByUserId: session.user.id,
      accountId,
      type,
      categoryId,
      date,
      amount: String(amount),
      notes: notes || null,
      tags: tags || null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

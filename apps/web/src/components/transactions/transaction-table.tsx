"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, parseNumeric } from "@/lib/utils";
import type { TransactionRow } from "@repo/shared/types";

const PAGE_SIZE = 20;

interface TransactionTableProps {
  transactions: TransactionRow[];
  loading: boolean;
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (tx: TransactionRow) => void;
  onDelete: (id: string) => void;
}

export function TransactionTable({
  transactions,
  loading,
  page,
  total,
  onPageChange,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No transactions found. Add one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>For</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="whitespace-nowrap">
                {formatDate(tx.date)}
              </TableCell>
              <TableCell>{tx.categoryName}</TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {formatCurrency(
                  parseNumeric(tx.amount),
                  (tx.accountCurrency as "VND" | "SGD") || "VND",
                )}
              </TableCell>
              <TableCell>{tx.accountName}</TableCell>
              <TableCell>{tx.userName}</TableCell>
              <TableCell className="max-w-[200px]">
                <div className="flex items-center gap-1.5">
                  {tx.notes && (
                    <span className="truncate text-muted-foreground">
                      {tx.notes}
                    </span>
                  )}
                  {(tx.tags as string[])?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] shrink-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(tx)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(tx.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} transaction{total !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

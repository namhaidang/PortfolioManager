"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import type {
  HouseholdUser,
  CategoryOption,
  AccountOption,
  TransactionRow,
  MonthlySummaryData,
} from "@repo/shared/types";
import { TransactionForm } from "./transaction-form";
import { TransactionTable } from "./transaction-table";
import { TransactionFilters, type Filters } from "./transaction-filters";
import { MonthlySummary } from "./monthly-summary";

interface TransactionPageProps {
  type: "income" | "expense";
  title: string;
  description: string;
}

const EMPTY_FILTERS: Filters = {
  userId: "",
  categoryId: "",
  accountId: "",
  dateFrom: "",
  dateTo: "",
  search: "",
};

export function TransactionPage({ type, title, description }: TransactionPageProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<HouseholdUser[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MonthlySummaryData | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionRow | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  useEffect(() => {
    Promise.all([
      apiFetch("/user").then((r) => r.json()),
      apiFetch(`/categories?type=${type}`).then((r) => r.json()),
      apiFetch("/accounts").then((r) => r.json()),
    ])
      .then(([u, c, a]) => {
        setUsers(u);
        setCategories(c);
        setAccounts(a);
      })
      .catch(() => toast.error("Failed to load reference data"));
  }, [type]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ type, page: String(page) });
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.accountId) params.set("accountId", filters.accountId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.search) params.set("search", filters.search);

    try {
      const res = await apiFetch(`/transactions?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTransactions(data.data);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load transactions");
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [type, page, filters]);

  const fetchSummary = useCallback(async () => {
    const now = new Date();
    const params = new URLSearchParams({
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
    });
    if (filters.userId) params.set("userId", filters.userId);
    try {
      const res = await apiFetch(`/transactions/summary?${params}`);
      if (!res.ok) throw new Error();
      setSummary(await res.json());
    } catch {
      toast.error("Failed to load summary");
    }
  }, [filters.userId]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  function handleEdit(tx: TransactionRow) {
    setEditingTx(tx);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    const res = await apiFetch(`/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transaction deleted");
      fetchTransactions();
      fetchSummary();
    } else {
      toast.error("Failed to delete transaction");
    }
  }

  function handleSaved() {
    setFormOpen(false);
    setEditingTx(null);
    fetchTransactions();
    fetchSummary();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add {type === "income" ? "Income" : "Expense"}
        </Button>
      </div>

      <MonthlySummary type={type} data={summary} />

      <TransactionFilters
        users={users}
        categories={categories}
        accounts={accounts}
        filters={filters}
        onFiltersChange={(f) => { setFilters(f); setPage(1); }}
      />

      <TransactionTable
        transactions={transactions}
        loading={loading}
        page={page}
        total={total}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingTx(null); }}
        type={type}
        transaction={editingTx}
        users={users}
        categories={categories}
        accounts={accounts}
        currentUserId={user?.id ?? ""}
        onSaved={handleSaved}
      />
    </div>
  );
}

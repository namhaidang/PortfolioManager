"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HouseholdUser, CategoryOption, AccountOption } from "@repo/shared/types";

export interface Filters {
  userId: string;
  categoryId: string;
  accountId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  recurringRuleId: string;
}

interface TransactionFiltersProps {
  users: HouseholdUser[];
  categories: CategoryOption[];
  accounts: AccountOption[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearRecurringFilter?: () => void;
}

export function TransactionFilters({
  users,
  categories,
  accounts,
  filters,
  onFiltersChange,
  onClearRecurringFilter,
}: TransactionFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const onChangeRef = useRef(onFiltersChange);
  onChangeRef.current = onFiltersChange;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filtersRef.current.search) {
        onChangeRef.current({ ...filtersRef.current, search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function update(patch: Partial<Filters>) {
    onFiltersChange({ ...filters, ...patch });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.recurringRuleId && onClearRecurringFilter && (
        <span className="inline-flex items-center" role="group" aria-label="Recurring rule filter active">
          <Badge variant="secondary" className="gap-1 pr-1">
            Filtered by recurring rule
            <button
              type="button"
              onClick={onClearRecurringFilter}
              className="ml-0.5 rounded-sm p-0.5 hover:bg-muted"
              aria-label="Clear recurring filter"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </span>
      )}
      <Select
        value={filters.userId || "all"}
        onValueChange={(v) => update({ userId: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[140px]" data-testid="filter-user">
          <SelectValue placeholder="All users" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All users</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId || "all"}
        onValueChange={(v) => update({ categoryId: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[160px]" data-testid="filter-category">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.accountId || "all"}
        onValueChange={(v) => update({ accountId: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All accounts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All accounts</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => update({ dateFrom: e.target.value })}
        className="w-[140px]"
      />

      <Input
        type="date"
        value={filters.dateTo}
        onChange={(e) => update({ dateTo: e.target.value })}
        className="w-[140px]"
      />

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search notes..."
          className="pl-8"
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api-client";
import { parseNumeric } from "@repo/shared";
import type { HouseholdUser, CategoryOption, AccountOption, TransactionRow } from "@repo/shared/types";

const EXPENSE_TAGS = ["needs", "wants", "tax-deductible"];
const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  transaction: TransactionRow | null;
  users: HouseholdUser[];
  categories: CategoryOption[];
  accounts: AccountOption[];
  currentUserId: string;
  onSaved: () => void;
}

export function TransactionForm({
  open,
  onOpenChange,
  type,
  transaction,
  users,
  categories,
  accounts,
  currentUserId,
  onSaved,
}: TransactionFormProps) {
  const isEdit = !!transaction;

  const [userId, setUserId] = useState(currentUserId);
  const [date, setDate] = useState<Date>(new Date());
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setUserId(transaction.userId);
      setDate(new Date(transaction.date + "T00:00:00"));
      setCategoryId(transaction.categoryId || "");
      setAccountId(transaction.accountId);
      setAmount(transaction.amount);
      setNotes(transaction.notes || "");
      setTags((transaction.tags as string[]) || []);
    } else {
      setUserId(currentUserId);
      setDate(new Date());
      setCategoryId("");
      setAccountId("");
      setAmount("");
      setNotes("");
      setTags([]);
      setIsRecurring(false);
      setFrequency("monthly");
      setStartDate(new Date());
      setDescription("");
    }
  }, [open, transaction, currentUserId]);

  const selectedAccount = accounts.find((a) => a.id === accountId);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !accountId) {
      toast.error("Please select a category and account");
      return;
    }
    if (isRecurring && !description.trim()) {
      toast.error("Please enter a description for the recurring rule");
      return;
    }

    setSaving(true);
    try {
      if (isRecurring && !isEdit) {
        const body = {
          userId,
          type,
          categoryId,
          accountId,
          amount: parseNumeric(amount),
          currency: selectedAccount?.currency ?? "VND",
          frequency,
          startDate: format(startDate, "yyyy-MM-dd"),
          description: description.trim(),
          notes: notes || null,
        };
        const res = await apiFetch("/recurring-rules", { method: "POST", body: JSON.stringify(body) });
        if (res.ok) {
          toast.success("Recurring rule created");
          onSaved();
        } else {
          const err = await res.json();
          toast.error(err.error || "Something went wrong");
        }
      } else {
        const body = {
          userId,
          accountId,
          type,
          categoryId,
          date: format(date, "yyyy-MM-dd"),
          amount: parseFloat(amount),
          notes: notes || null,
          tags: tags.length > 0 ? tags : null,
        };
        const url = isEdit ? `/transactions/${transaction!.id}` : "/transactions";
        const res = await apiFetch(url, {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast.success(isEdit ? "Transaction updated" : "Transaction created");
          onSaved();
        } else {
          const err = await res.json();
          toast.error(err.error || "Something went wrong");
        }
      }
    } finally {
      setSaving(false);
    }
  }

  const activeAccounts = accounts.filter(
    (a) => a.isActive || (transaction && a.id === transaction.accountId),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit" : "Add"}{" "}
            {type === "income" ? "Income" : "Expense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>For User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                    {u.id === currentUserId ? " (me)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(v) => setIsRecurring(v === true)}
              />
              <Label htmlFor="recurring" className="cursor-pointer font-normal">
                Make recurring
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label>{isRecurring ? "Start date" : "Date"}</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(isRecurring ? startDate : date, "d MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={isRecurring ? startDate : date}
                  onSelect={(d) => {
                    if (d) {
                      if (isRecurring) setStartDate(d);
                      else setDate(d);
                    }
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {isRecurring && (
            <>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly Salary"
                  required={isRecurring}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Amount{selectedAccount ? ` (${selectedAccount.currency})` : ""}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger data-testid="select-account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          {type === "expense" && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                {EXPENSE_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

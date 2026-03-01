"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Repeat, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type {
  RecurringRuleRow,
  HouseholdUser,
  CategoryOption,
  AccountOption,
} from "@repo/shared/types";
import { formatCurrency } from "@/lib/utils";
import { parseNumeric } from "@repo/shared";

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const END_CONDITIONS = [
  { value: "none", label: "No end" },
  { value: "date", label: "End date" },
  { value: "occurrences", label: "After N occurrences" },
];

export function RecurringSection() {
  const { user } = useAuth();
  const [rules, setRules] = useState<RecurringRuleRow[]>([]);
  const [users, setUsers] = useState<HouseholdUser[]>([]);
  const [categoriesByType, setCategoriesByType] = useState<Record<string, CategoryOption[]>>({ income: [], expense: [] });
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRuleRow | null>(null);
  const [formType, setFormType] = useState<"income" | "expense">("income");
  const [userId, setUserId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endCondition, setEndCondition] = useState("none");
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [maxOccurrences, setMaxOccurrences] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  async function fetchRules() {
    const res = await apiFetch("/recurring-rules");
    setRules(await res.json());
  }

  async function fetchReference() {
    const [uRes, incRes, expRes, acctRes] = await Promise.all([
      apiFetch("/user"),
      apiFetch("/categories?type=income"),
      apiFetch("/categories?type=expense"),
      apiFetch("/accounts"),
    ]);
    const [u, inc, exp, acct] = await Promise.all([
      uRes.json(),
      incRes.json(),
      expRes.json(),
      acctRes.json(),
    ]);
    setUsers(u);
    setCategoriesByType({ income: inc, expense: exp });
    setAccounts(acct);
  }

  useEffect(() => {
    Promise.all([fetchRules(), fetchReference()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!formOpen) return;
    if (editingRule) {
      setFormType(editingRule.type as "income" | "expense");
      setUserId(editingRule.userId);
      setCategoryId(editingRule.categoryId);
      setAccountId(editingRule.accountId);
      setAmount(editingRule.amount);
      setCurrency(editingRule.currency);
      setFrequency(editingRule.frequency);
      setStartDate(new Date(editingRule.startDate + "T00:00:00"));
      setEndCondition(
        editingRule.endDate ? "date" : editingRule.maxOccurrences != null ? "occurrences" : "none",
      );
      setEndDate(editingRule.endDate ? new Date(editingRule.endDate + "T00:00:00") : null);
      setMaxOccurrences(editingRule.maxOccurrences?.toString() ?? "");
      setDescription(editingRule.description);
      setNotes(editingRule.notes ?? "");
    } else {
      setFormType("income");
      setUserId(user?.id ?? "");
      setCategoryId("");
      setAccountId("");
      setAmount("");
      setCurrency("VND");
      setFrequency("monthly");
      setStartDate(new Date());
      setEndCondition("none");
      setEndDate(null);
      setMaxOccurrences("");
      setDescription("");
      setNotes("");
    }
  }, [formOpen, editingRule, user?.id]);

  useEffect(() => {
    if (!formOpen || editingRule || !accounts.length) return;
    const targetUser = userId || user?.id;
    if (!targetUser) return;
    const userAccts = accounts.filter((a) => a.userId === targetUser);
    if (userAccts.length > 0 && !accountId) setAccountId(userAccts[0].id);
  }, [formOpen, editingRule, accounts, user?.id, userId, accountId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !accountId || !description) {
      toast.error("Please fill in required fields");
      return;
    }
    if (endCondition === "occurrences") {
      const n = parseInt(maxOccurrences, 10);
      if (!maxOccurrences.trim() || isNaN(n) || n < 1 || !Number.isInteger(n)) {
        toast.error("Max occurrences must be a positive integer");
        return;
      }
    }

    setSaving(true);
    const body = {
      userId,
      type: formType,
      categoryId,
      accountId,
      amount: parseNumeric(amount),
      currency,
      frequency,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: endCondition === "date" && endDate ? format(endDate, "yyyy-MM-dd") : null,
      maxOccurrences: endCondition === "occurrences" ? parseInt(maxOccurrences, 10) : null,
      description: description.trim(),
      notes: notes.trim() || null,
    };

    try {
      const url = editingRule ? `/recurring-rules/${editingRule.id}` : "/recurring-rules";
      const res = await apiFetch(url, {
        method: editingRule ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingRule ? "Rule updated" : "Recurring rule created");
        setFormOpen(false);
        setEditingRule(null);
        fetchRules();
      } else {
        const err = await res.json();
        toast.error(err.error || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(rule: RecurringRuleRow) {
    const res = await apiFetch(`/recurring-rules/${rule.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    if (res.ok) {
      toast.success(rule.isActive ? "Rule paused" : "Rule activated");
      fetchRules();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this recurring rule? Generated transactions will remain.")) return;
    const res = await apiFetch(`/recurring-rules/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Rule deleted");
      fetchRules();
      setFormOpen(false);
      setEditingRule(null);
    }
  }

  const activeAccounts = accounts.filter((a) => a.isActive || (editingRule && a.id === editingRule.accountId));

  return (
    <Card data-testid="recurring-section">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Recurring Rules
            </CardTitle>
            <CardDescription>Manage recurring income and expenses</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setEditingRule(null); setFormOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recurring rules yet.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">{rule.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {rule.userName} · {rule.categoryName} · {rule.frequency} · Next: {rule.nextDueDate}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatCurrency(parseNumeric(rule.amount), rule.currency as "VND" | "SGD")}
                  </Badge>
                  {!rule.isActive && <Badge variant="secondary">Paused</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={
                        rule.type === "income"
                          ? `/income?recurringRuleId=${rule.id}`
                          : `/expenses?recurringRuleId=${rule.id}`
                      }
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      View
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingRule(rule); setFormOpen(true); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(rule)}>
                    {rule.isActive ? "Pause" : "Resume"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingRule(null); }}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit" : "Add"} Recurring Rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {loading && (
                <p className="text-sm text-muted-foreground">Loading categories and accounts...</p>
              )}
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
                        {u.id === user?.id ? " (me)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formType}
                  onValueChange={(v) => {
                    setFormType(v as "income" | "expense");
                    setCategoryId("");
                  }}
                >
                  <SelectTrigger data-testid="recurring-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                  <SelectTrigger data-testid="recurring-category">
                    <SelectValue placeholder={loading ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoriesByType[formType] ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account</Label>
                <Select value={accountId} onValueChange={setAccountId} disabled={loading}>
                  <SelectTrigger data-testid="recurring-account">
                    <SelectValue placeholder={loading ? "Loading..." : "Select account"} />
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
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger data-testid="recurring-frequency">
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
                <Label>Start Date</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {format(startDate, "d MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => {
                        if (d) setStartDate(d);
                        setCalendarOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Condition</Label>
                <Select value={endCondition} onValueChange={setEndCondition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {END_CONDITIONS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {endCondition === "date" && (
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {endDate ? format(endDate, "d MMM yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate ?? undefined}
                        onSelect={(d) => setEndDate(d ?? null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {endCondition === "occurrences" && (
                <div className="space-y-2">
                  <Label>Max Occurrences</Label>
                  <Input
                    type="number"
                    min="1"
                    value={maxOccurrences}
                    onChange={(e) => setMaxOccurrences(e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly Salary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : editingRule ? "Update" : "Create Rule"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

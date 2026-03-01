"use client";

import { useState, useEffect } from "react";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
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

const ACCOUNT_TYPES = [
  { value: "brokerage", label: "Brokerage" },
  { value: "bank", label: "Bank" },
  { value: "cash", label: "Cash" },
  { value: "crypto_wallet", label: "Crypto Wallet" },
  { value: "property", label: "Property" },
];

interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  currency: string;
  isActive: boolean;
}

export function AccountsSection() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [currency, setCurrency] = useState("VND");
  const [saving, setSaving] = useState(false);

  async function fetchAccounts() {
    const res = await apiFetch("/accounts");
    setAccounts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/accounts", {
        method: "POST",
        body: JSON.stringify({ name, type, currency }),
      });
      if (res.ok) {
        toast.success("Account created");
        setFormOpen(false);
        setName("");
        fetchAccounts();
      } else {
        toast.error("Failed to create account");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(account: Account) {
    const res = await apiFetch(`/accounts/${account.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !account.isActive }),
    });
    if (res.ok) {
      toast.success(
        account.isActive ? "Account deactivated" : "Account activated",
      );
      fetchAccounts();
    }
  }

  return (
    <Card data-testid="accounts-section">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Accounts
            </CardTitle>
            <CardDescription>Manage household accounts</CardDescription>
          </div>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((acct) => (
              <div
                key={acct.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">{acct.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {acct.type.replaceAll("_", " ")}
                    </p>
                  </div>
                  <Badge variant="outline">{acct.currency}</Badge>
                  {!acct.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActive(acct)}
                >
                  {acct.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vietcombank"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="SGD">SGD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

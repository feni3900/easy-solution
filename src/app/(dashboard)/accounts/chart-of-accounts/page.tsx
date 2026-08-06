"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Account {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  is_active: boolean;
}

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

const typeStyles: Record<string, string> = {
  Asset: "bg-blue-100 text-blue-700",
  Liability: "bg-amber-100 text-amber-700",
  Equity: "bg-purple-100 text-purple-700",
  Revenue: "bg-green-100 text-green-700",
  Expense: "bg-red-100 text-red-700",
};

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ account_code: "", account_name: "", account_type: "Asset", is_active: true });

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .order("account_code");
    setAccounts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.account_code || !form.account_name) {
      alert("Please enter account code and name.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("chart_of_accounts")
      .insert([{
        account_code: form.account_code.trim(),
        account_name: form.account_name.trim(),
        account_type: form.account_type,
        is_active: form.is_active,
      }]);
    setSaving(false);
    if (error) {
      alert("Error creating account: " + error.message);
      return;
    }
    setDialogOpen(false);
    setForm({ account_code: "", account_name: "", account_type: "Asset", is_active: true });
    load();
  };

  const toggleActive = async (account: Account) => {
    const supabase = createClient();
    await supabase
      .from("chart_of_accounts")
      .update({ is_active: !account.is_active })
      .eq("account_id", account.account_id);
    load();
  };

  const handleDelete = async (account: Account) => {
    if (!confirm(`Delete account "${account.account_name}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("chart_of_accounts")
      .delete()
      .eq("account_id", account.account_id);
    if (error) alert("Cannot delete: " + error.message);
    else load();
  };

  const totals = ACCOUNT_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = accounts.filter((a) => a.account_type === t && a.is_active).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage the accounts used in journal entries</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="size-4 mr-2" />Add Account</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {ACCOUNT_TYPES.map((t) => (
          <div key={t} className="rounded-lg border bg-card p-4">
            <p className={`text-xs font-medium ${typeStyles[t]}`}>{t}</p>
            <p className="text-2xl font-bold mt-1">{totals[t]}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Account Name</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-center font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.account_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-muted-foreground">{a.account_code}</td>
                  <td className="p-3 font-medium">{a.account_name}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeStyles[a.account_type]}`}>
                      {a.account_type}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(a)}
                      className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                    >
                      {a.is_active ? "Active" : "Inactive"}
                    </Button>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a)}><Trash2 className="size-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No accounts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Account</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Account Code *</Label>
              <Input
                value={form.account_code}
                onChange={(e) => setForm({ ...form, account_code: e.target.value })}
                placeholder="e.g. 6000"
              />
            </div>
            <div className="space-y-1">
              <Label>Account Name *</Label>
              <Input
                value={form.account_name}
                onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                placeholder="e.g. Telephone Expense"
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <select
                value={form.account_type}
                onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

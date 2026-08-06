"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getClientLocale, t, fmtInt, translateWithVars } from "@/lib/i18n";

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
  const locale = getClientLocale();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ account_code: "", account_name: "", account_type: "Asset", is_active: true });

  const typeLabels: Record<string, string> = {
    Asset: t("accounts.type.asset", locale),
    Liability: t("accounts.type.liability", locale),
    Equity: t("accounts.type.equity", locale),
    Revenue: t("accounts.type.revenue", locale),
    Expense: t("accounts.type.expense", locale),
  };

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
      alert(t("accounts.chartOfAccounts.alertRequired", locale));
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
      alert(translateWithVars(t("accounts.chartOfAccounts.createError", locale), { message: error.message }));
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
    if (!confirm(translateWithVars(t("accounts.chartOfAccounts.deleteConfirm", locale), { name: account.account_name }))) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("chart_of_accounts")
      .delete()
      .eq("account_id", account.account_id);
    if (error) alert(translateWithVars(t("accounts.chartOfAccounts.deleteError", locale), { message: error.message }));
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
          <h1 className="text-2xl font-semibold tracking-tight">{t("accounts.chartOfAccounts", locale)}</h1>
          <p className="text-sm text-muted-foreground">{t("accounts.chartOfAccounts.desc", locale)}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="size-4 mr-2" />{t("accounts.chartOfAccounts.addAccount", locale)}</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {ACCOUNT_TYPES.map((type) => (
          <div key={type} className="rounded-lg border bg-card p-4">
            <p className={`text-xs font-medium ${typeStyles[type]}`}>{typeLabels[type]}</p>
            <p className="text-2xl font-bold mt-1">{fmtInt(totals[type], locale)}</p>
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
                <th className="p-3 text-left font-medium">{t("accounts.code", locale)}</th>
                <th className="p-3 text-left font-medium">{t("accounts.chartOfAccounts.accountNameCol", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.type", locale)}</th>
                <th className="p-3 text-center font-medium">{t("app.status", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.actions", locale)}</th>
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
                      {a.is_active ? t("app.active", locale) : t("app.inactive", locale)}
                    </Button>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a)}><Trash2 className="size-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("accounts.chartOfAccounts.noAccounts", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("accounts.chartOfAccounts.addAccount", locale)}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("accounts.chartOfAccounts.accountCode", locale)}</Label>
              <Input
                value={form.account_code}
                onChange={(e) => setForm({ ...form, account_code: e.target.value })}
                placeholder={t("accounts.chartOfAccounts.accountCodePh", locale)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("accounts.chartOfAccounts.accountName", locale)}</Label>
              <Input
                value={form.account_name}
                onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                placeholder={t("accounts.chartOfAccounts.accountNamePh", locale)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("app.type", locale)}</Label>
              <select
                value={form.account_type}
                onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {ACCOUNT_TYPES.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("app.cancel", locale)}</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}{t("app.create", locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

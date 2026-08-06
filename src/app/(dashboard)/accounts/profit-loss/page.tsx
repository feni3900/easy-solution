"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchLedger, summarize, type AccountSummary } from "@/lib/accounts";
import { getClientLocale, t, fmtMoney, translateWithVars } from "@/lib/i18n";

export default function ProfitLossPage() {
  const locale = getClientLocale();
  const [from, setFrom] = useState(() => new Date().getFullYear() + "-01-01");
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState<AccountSummary[]>([]);
  const [expenses, setExpenses] = useState<AccountSummary[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchLedger(from, to);
      const summary = summarize(rows);
      setIncome(summary.filter((s) => s.account_type === "Revenue").sort((a, b) => a.account_code.localeCompare(b.account_code)));
      setExpenses(summary.filter((s) => s.account_type === "Expense").sort((a, b) => a.account_code.localeCompare(b.account_code)));
    } catch (e) {
      alert(translateWithVars(t("accounts.loadError", locale), { message: (e as Error).message }));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const totalIncome = income.reduce((s, i) => s + i.balance, 0);
  const totalExpenses = expenses.reduce((s, e) => s + Math.abs(e.balance), 0);
  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("accounts.profitLoss", locale)}</h1>
          <p className="text-sm text-muted-foreground">{t("accounts.profitLoss.desc", locale)}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t("accounts.from", locale)}</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t("accounts.to", locale)}</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button onClick={load}>{t("accounts.refresh", locale)}</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t("accounts.profitLoss.totalIncome", locale)}</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{fmtMoney(totalIncome, locale)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t("accounts.profitLoss.totalExpenses", locale)}</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{fmtMoney(totalExpenses, locale)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t("accounts.profitLoss.netProfit", locale)}</p>
          <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtMoney(netProfit, locale)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t("accounts.account", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.amount", locale)}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-green-50/50">
                <td className="p-3 font-semibold" colSpan={2}>{t("accounts.income", locale)}</td>
              </tr>
              {income.map((i) => (
                <tr key={i.account_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 pl-6"><span className="font-mono text-xs text-muted-foreground">{i.account_code}</span> {i.account_name}</td>
                  <td className="p-3 text-right">{fmtMoney(i.balance, locale)}</td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-semibold">
                <td className="p-3 pl-6">{t("accounts.profitLoss.totalIncome", locale)}</td>
                <td className="p-3 text-right">{fmtMoney(totalIncome, locale)}</td>
              </tr>
              <tr className="bg-red-50/50">
                <td className="p-3 font-semibold" colSpan={2}>{t("accounts.expenses", locale)}</td>
              </tr>
              {expenses.map((e) => (
                <tr key={e.account_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 pl-6"><span className="font-mono text-xs text-muted-foreground">{e.account_code}</span> {e.account_name}</td>
                  <td className="p-3 text-right">{fmtMoney(Math.abs(e.balance), locale)}</td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr className="border-b"><td colSpan={2} className="p-3 pl-6 text-muted-foreground">{t("accounts.profitLoss.noExpenses", locale)}</td></tr>
              )}
              <tr className="bg-muted/30 font-semibold">
                <td className="p-3 pl-6">{t("accounts.profitLoss.totalExpenses", locale)}</td>
                <td className="p-3 text-right">{fmtMoney(totalExpenses, locale)}</td>
              </tr>
              <tr className="border-t-2 border-border font-bold text-lg">
                <td className="p-3">{t("accounts.profitLoss.netProfitLoss", locale)}</td>
                <td className={`p-3 text-right ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtMoney(netProfit, locale)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

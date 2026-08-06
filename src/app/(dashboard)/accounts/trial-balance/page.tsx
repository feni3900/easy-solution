"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchLedger, summarize, type AccountSummary } from "@/lib/accounts";
import { getClientLocale, t, fmtMoney, translateWithVars } from "@/lib/i18n";

export default function TrialBalancePage() {
  const locale = getClientLocale();
  const [from, setFrom] = useState("2000-01-01");
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AccountSummary[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchLedger(from, to);
      setSummary(summarize(rows));
    } catch (e) {
      alert(translateWithVars(t("accounts.loadError", locale), { message: (e as Error).message }));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const totalDebit = summary.reduce((s, r) => s + r.debit, 0);
  const totalCredit = summary.reduce((s, r) => s + r.credit, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("accounts.trialBalance", locale)}</h1>
          <p className="text-sm text-muted-foreground">{t("accounts.trialBalance.desc", locale)}</p>
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

      <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${balanced ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
        {balanced
          ? translateWithVars(t("accounts.trialBalance.balanced", locale), { debits: fmtMoney(totalDebit, locale), credits: fmtMoney(totalCredit, locale) })
          : translateWithVars(t("accounts.trialBalance.outOfBalance", locale), { debits: fmtMoney(totalDebit, locale), credits: fmtMoney(totalCredit, locale) })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t("accounts.code", locale)}</th>
                <th className="p-3 text-left font-medium">{t("accounts.account", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.type", locale)}</th>
                <th className="p-3 text-right font-medium">{t("accounts.debit", locale)}</th>
                <th className="p-3 text-right font-medium">{t("accounts.credit", locale)}</th>
                <th className="p-3 text-right font-medium">{t("accounts.balance", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.account_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{s.account_code}</td>
                  <td className="p-3 font-medium">{s.account_name}</td>
                  <td className="p-3 text-muted-foreground">{s.account_type}</td>
                  <td className="p-3 text-right">{s.debit > 0 ? fmtMoney(s.debit, locale) : "—"}</td>
                  <td className="p-3 text-right">{s.credit > 0 ? fmtMoney(s.credit, locale) : "—"}</td>
                  <td className={`p-3 text-right font-medium ${s.balance >= 0 ? "text-green-600" : "text-red-600"}`}>{fmtMoney(s.balance, locale)}</td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("accounts.trialBalance.noTransactions", locale)}</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30 font-semibold">
                <td className="p-3" colSpan={3}>{t("accounts.totals", locale)}</td>
                <td className="p-3 text-right">{fmtMoney(totalDebit, locale)}</td>
                <td className="p-3 text-right">{fmtMoney(totalCredit, locale)}</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

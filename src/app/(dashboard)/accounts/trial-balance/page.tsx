"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchLedger, summarize, fmt, type AccountSummary } from "@/lib/accounts";

export default function TrialBalancePage() {
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
      alert("Failed to load report: " + (e as Error).message);
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
          <h1 className="text-2xl font-semibold tracking-tight">Trial Balance</h1>
          <p className="text-sm text-muted-foreground">All accounts with debit and credit totals</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${balanced ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
        {balanced
          ? `✓ Balanced — Debits ${fmt(totalDebit)} = Credits ${fmt(totalCredit)}`
          : `✗ Out of balance — Debits ${fmt(totalDebit)} vs Credits ${fmt(totalCredit)}`}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Code</th>
                <th className="p-3 text-left font-medium">Account</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-right font-medium">Debit</th>
                <th className="p-3 text-right font-medium">Credit</th>
                <th className="p-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.account_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{s.account_code}</td>
                  <td className="p-3 font-medium">{s.account_name}</td>
                  <td className="p-3 text-muted-foreground">{s.account_type}</td>
                  <td className="p-3 text-right">{s.debit > 0 ? fmt(s.debit) : "—"}</td>
                  <td className="p-3 text-right">{s.credit > 0 ? fmt(s.credit) : "—"}</td>
                  <td className={`p-3 text-right font-medium ${s.balance >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(s.balance)}</td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No transactions in this period.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30 font-semibold">
                <td className="p-3" colSpan={3}>Totals</td>
                <td className="p-3 text-right">{fmt(totalDebit)}</td>
                <td className="p-3 text-right">{fmt(totalCredit)}</td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

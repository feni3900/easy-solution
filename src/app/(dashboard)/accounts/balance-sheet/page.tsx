"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchLedger, summarize, type AccountSummary } from "@/lib/accounts";
import { getClientLocale, t, fmtMoney, translateWithVars } from "@/lib/i18n";

function Section({
  title,
  titleKey,
  items,
  textColor,
  total,
  locale,
}: {
  title: string;
  titleKey: string;
  items: AccountSummary[];
  textColor: string;
  total: number;
  locale: "en" | "bn";
}) {
  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${titleKey === "Assets" ? "bg-blue-50/50" : titleKey === "Liabilities" ? "bg-amber-50/50" : "bg-purple-50/50"}`}>
            <th className="p-3 text-left font-semibold" colSpan={2}>{title}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.account_id} className="border-b hover:bg-muted/30">
              <td className="p-3 pl-6"><span className="font-mono text-xs text-muted-foreground">{i.account_code}</span> {i.account_name}</td>
              <td className={`p-3 text-right font-medium ${textColor}`}>{fmtMoney(i.balance, locale)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr className="border-b"><td className="p-3 pl-6 text-muted-foreground">{t("accounts.bs.noBalances", locale)}</td><td></td></tr>
          )}
          <tr className="bg-muted/30 font-semibold">
            <td className="p-3 pl-6">{translateWithVars(t("accounts.bs.totalSection", locale), { title })}</td>
            <td className={`p-3 text-right ${textColor}`}>
              {fmtMoney(total, locale)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function BalanceSheetPage() {
  const locale = getClientLocale();
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AccountSummary[]>([]);
  const [liabilities, setLiabilities] = useState<AccountSummary[]>([]);
  const [equity, setEquity] = useState<AccountSummary[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchLedger("2000-01-01", asOf);
      const summary = summarize(rows);
      setAssets(summary.filter((s) => s.account_type === "Asset"));
      setLiabilities(summary.filter((s) => s.account_type === "Liability"));
      setEquity(summary.filter((s) => s.account_type === "Equity"));
    } catch (e) {
      alert(translateWithVars(t("accounts.loadError", locale), { message: (e as Error).message }));
    } finally {
      setLoading(false);
    }
  }, [asOf]);

  useEffect(() => { load(); }, [load]);

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);
  const totalEquity = equity.reduce((s, e) => s + e.balance, 0);
  const netProfit = assets.reduce((s, a) => s + a.balance, 0) - liabilities.reduce((s, l) => s + l.balance, 0) - equity.reduce((s, e) => s + e.balance, 0);

  const totalsEqual = Math.abs(totalAssets - (totalLiabilities + totalEquity + netProfit)) < 0.01;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("accounts.balanceSheet", locale)}</h1>
          <p className="text-sm text-muted-foreground">{t("accounts.bs.desc", locale)}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{t("accounts.bs.asOf", locale)}</label>
            <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="w-40" />
          </div>
          <Button onClick={load}>{t("accounts.refresh", locale)}</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t("accounts.bs.totalAssets", locale)}</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{fmtMoney(totalAssets, locale)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t("accounts.bs.totalLiabilities", locale)}</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{fmtMoney(totalLiabilities, locale)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">{t("accounts.bs.equityRetained", locale)}</p>
          <p className="text-2xl font-bold mt-1 text-purple-600">{fmtMoney(totalEquity + netProfit, locale)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={t("accounts.bs.assets", locale)} titleKey="Assets" items={assets} textColor="text-blue-600" total={totalAssets} locale={locale} />
          <div className="space-y-6">
            <Section title={t("accounts.bs.liabilities", locale)} titleKey="Liabilities" items={liabilities} textColor="text-amber-600" total={totalLiabilities} locale={locale} />
            <Section title={t("accounts.bs.equity", locale)} titleKey="Equity" items={equity} textColor="text-purple-600" total={totalEquity} locale={locale} />
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("accounts.bs.retainedProfit", locale)}</span>
                <span className="font-semibold text-purple-600">{fmtMoney(netProfit, locale)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2 border-t pt-2">
                <span className="font-semibold">{t("accounts.bs.totalLiabEquity", locale)}</span>
                <span className="font-bold">{fmtMoney(totalLiabilities + totalEquity + netProfit, locale)}</span>
              </div>
              <div className={`mt-3 rounded-md px-3 py-2 text-sm font-medium ${totalsEqual ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {totalsEqual ? t("accounts.bs.balanced", locale) : t("accounts.bs.notBalanced", locale)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { getClientLocale, t, fmtInt } from "@/lib/i18n";

interface JournalEntry {
  journal_id: number;
  product_name: string;
  movement_type: string;
  quantity_change: number;
  stock_before: number;
  stock_after: number;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
}

export default function StockJournalPage() {
  const locale = getClientLocale();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("stock_journal")
      .select("*, products(product_name)")
      .order("created_at", { ascending: false })
      .limit(200);

    const mapped = (data ?? []).map((e) => ({
      ...e,
      product_name: (e.products as { product_name?: string })?.product_name ?? "Unknown",
    }));

    setEntries(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const typeColor = (type: string) => {
    if (type.startsWith("Sale")) return "bg-blue-100 text-blue-700";
    if (type === "Purchase") return "bg-green-100 text-green-700";
    if (type === "Damage" || type === "Write_Off") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("inventory.stockJournal.title", locale)}</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t("app.date", locale)}</th>
                <th className="p-3 text-left font-medium">{t("sales.returns.product", locale)}</th>
                <th className="p-3 text-center font-medium">{t("app.type", locale)}</th>
                <th className="p-3 text-right font-medium">{t("inventory.stockJournal.change", locale)}</th>
                <th className="p-3 text-right font-medium">{t("inventory.stockJournal.before", locale)}</th>
                <th className="p-3 text-right font-medium">{t("inventory.stockJournal.after", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.reference", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.journal_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="p-3 font-medium">{e.product_name}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor(e.movement_type)}`}>{e.movement_type}</span>
                  </td>
                  <td className={`p-3 text-right font-medium ${e.quantity_change > 0 ? "text-green-600" : "text-red-600"}`}>
                    {e.quantity_change > 0 ? "+" : ""}{fmtInt(e.quantity_change, locale)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">{fmtInt(e.stock_before, locale)}</td>
                  <td className="p-3 text-right">{fmtInt(e.stock_after, locale)}</td>
                  <td className="p-3 text-muted-foreground">{e.reference_no ?? "-"}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("inventory.stockJournal.noMovements", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

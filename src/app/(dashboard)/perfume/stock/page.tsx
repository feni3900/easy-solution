"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PerfumeNav } from "@/components/perfume/perfume-nav";
import { getClientLocale, t } from "@/lib/i18n";

interface StockRow {
  id: number;
  recipe_id: number;
  stock_qty: number;
  price: number;
  updated_at: string;
  perfume_recipes: { name: string } | null;
}

export default function StockPage() {
  const locale = getClientLocale();
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("perfume_stock")
      .select("*, perfume_recipes(name)")
      .order("updated_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const savePrice = async (id: number, price: string) => {
    setSavingId(id);
    const supabase = createClient();
    const val = Number(price) || 0;
    await supabase.from("perfume_stock").update({ price: val }).eq("id", id);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, price: val } : x)));
    setSavingId(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("perfume.stock", locale)}</h1>
      <PerfumeNav />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">{t("perfume.name", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.finishedStock", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.price", locale)}</th>
                <th className="p-3 font-medium">{t("app.date", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-3 font-medium">{r.perfume_recipes?.name ?? "-"}</td>
                  <td className="p-3">{r.stock_qty} bottles</td>
                  <td className="p-3">
                    <div className="flex max-w-[200px] items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={String(r.price)}
                        onBlur={(e) => savePrice(r.id, e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                        className="w-24 px-2 py-1 text-sm"
                      />
                      {savingId === r.id && <Loader2 className="size-3 animate-spin" />}
                      <Save className="size-3 text-muted-foreground" />
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">{t("app.noData", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
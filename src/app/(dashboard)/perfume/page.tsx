"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { PerfumeNav } from "@/components/perfume/perfume-nav";
import { getClientLocale, t } from "@/lib/i18n";

export default function PerfumePage() {
  const locale = getClientLocale();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ingredients: 0,
    recipes: 0,
    stockQty: 0,
    stockValue: 0,
    batches: 0,
    lowStock: 0,
  });
  const [ingredients, setIngredients] = useState<{ name: string; stock_qty: number; low_stock_threshold: number }[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ count: ic }, { count: rc }, { count: bc }] = await Promise.all([
      supabase.from("perfume_ingredients").select("id", { count: "exact", head: true }),
      supabase.from("perfume_recipes").select("id", { count: "exact", head: true }),
      supabase.from("perfume_batches").select("id", { count: "exact", head: true }),
    ]);
    const { data: stockRows } = await supabase.from("perfume_stock").select("stock_qty, price");
    const { data: ingRows } = await supabase
      .from("perfume_ingredients")
      .select("name, stock_qty, low_stock_threshold");

    const stockQty = (stockRows ?? []).reduce((s, x) => s + Number(x.stock_qty), 0);
    const stockValue = (stockRows ?? []).reduce((s, x) => s + Number(x.stock_qty) * Number(x.price), 0);
    const lowStock = (ingRows ?? []).filter(
      (x) => Number(x.stock_qty) <= Number(x.low_stock_threshold)
    ).length;

    setStats({
      ingredients: ic ?? 0,
      recipes: rc ?? 0,
      stockQty,
      stockValue,
      batches: bc ?? 0,
      lowStock,
    });
    setIngredients(ingRows ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    { label: t("perfume.ingredients", locale), value: stats.ingredients },
    { label: t("perfume.recipes", locale), value: stats.recipes },
    { label: t("perfume.batches", locale), value: stats.batches },
    { label: t("perfume.finishedBottles", locale), value: stats.stockQty },
    { label: t("perfume.stockValue", locale), value: `৳${Math.round(stats.stockValue)}` },
    { label: t("perfume.lowStock", locale), value: stats.lowStock },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Maruf Perfume</h1>
      <PerfumeNav />
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cards.map((c) => (
              <div key={c.label} className="rounded-lg border bg-card p-4">
                <div className="text-2xl font-semibold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">{t("perfume.lowStockAlerts", locale)}</h2>
            {ingredients.filter((x) => x.stock_qty <= x.low_stock_threshold).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("app.noData", locale)}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {ingredients
                  .filter((x) => x.stock_qty <= x.low_stock_threshold)
                  .map((x) => (
                    <li key={x.name} className="flex justify-between">
                      <span>{x.name}</span>
                      <span className="text-amber-600">{x.stock_qty} (min {x.low_stock_threshold})</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
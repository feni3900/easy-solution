"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PerfumeNav } from "@/components/perfume/perfume-nav";
import { getClientLocale, t } from "@/lib/i18n";

interface Recipe {
  id: number;
  name: string;
}
interface Batch {
  id: number;
  batch_no: string;
  bottles: number;
  ingredient_cost: number;
  notes: string | null;
  produced_at: string;
  perfume_recipes: { name: string } | null;
}

export default function ProductionPage() {
  const locale = getClientLocale();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [recipeId, setRecipeId] = useState("");
  const [bottles, setBottles] = useState("10");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [producing, setProducing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: r }, { data: b }] = await Promise.all([
      supabase.from("perfume_recipes").select("id, name").order("name"),
      supabase.from("perfume_batches").select("*, perfume_recipes(name)").order("produced_at", { ascending: false }).limit(20),
    ]);
    setRecipes(r ?? []);
    setBatches(b ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRecipeChange = (rid: string) => {
    setRecipeId(rid);
    setError(null);
    setResult(null);
  };

  const produce = async () => {
    if (!recipeId || !(Number(bottles) > 0)) {
      setError(t("perfume.prodRequired", locale));
      return;
    }
    setProducing(true);
    setError(null);
    setResult(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("produce_perfume_batch", {
      p_recipe_id: Number(recipeId),
      p_bottles: Number(bottles),
      p_notes: notes.trim() || null,
    });
    setProducing(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResult(String(data));
    setNotes("");
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("perfume.production", locale)}</h1>
      <PerfumeNav />

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("perfume.produceBatch", locale)}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>{t("perfume.recipe", locale)} *</Label>
            <select
              value={recipeId}
              onChange={(e) => onRecipeChange(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("perfume.selectRecipe", locale)}</option>
              {recipes.map((x) => (
                <option key={x.id} value={x.id}>{x.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.bottles", locale)} *</Label>
            <Input type="number" value={bottles} onChange={(e) => setBottles(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.notes", locale)}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {error && <span className="text-sm text-red-600">{error}</span>}
          {result && <span className="text-sm text-green-600">{t("perfume.batchDone", locale)} {result}</span>}
          <Button onClick={produce} disabled={producing} className="ml-auto">
            {producing ? <Loader2 className="size-4 animate-spin" /> : <Beaker className="size-4" />}
            {t("perfume.produce", locale)}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">{t("perfume.batchNo", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.recipe", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.bottles", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.ingredientCost", locale)}</th>
                <th className="p-3 font-medium">{t("app.date", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.notes", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-b">
                  <td className="p-3 font-medium">{b.batch_no}</td>
                  <td className="p-3">{b.perfume_recipes?.name ?? "-"}</td>
                  <td className="p-3">{b.bottles}</td>
                  <td className="p-3">৳{Number(b.ingredient_cost).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(b.produced_at).toLocaleDateString()}</td>
                  <td className="p-3 text-muted-foreground">{b.notes || "-"}</td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("app.noData", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PerfumeNav } from "@/components/perfume/perfume-nav";
import { getClientLocale, t } from "@/lib/i18n";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
}
interface Recipe {
  id: number;
  name: string;
  notes: string | null;
}
interface RecipeItemRow {
  ingredient_id: string;
  qty: string;
}

interface RecipeItemDetail {
  ingredient_id: string;
  qty: string;
  ingredient_name: string;
  unit: string;
}

export default function RecipesPage() {
  const locale = getClientLocale();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<RecipeItemRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openRecipe, setOpenRecipe] = useState<number | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<RecipeItemDetail[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: r }, { data: i }] = await Promise.all([
      supabase.from("perfume_recipes").select("*").order("name"),
      supabase.from("perfume_ingredients").select("id, name, unit").order("name"),
    ]);
    setRecipes(r ?? []);
    setIngredients(i ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setNotes("");
    setRows([]);
    setError(null);
  };

  const startEdit = (rc: Recipe) => async () => {
    setEditing(rc.id);
    setName(rc.name);
    setNotes(rc.notes ?? "");
    const supabase = createClient();
    const { data } = await supabase
      .from("perfume_recipe_items")
      .select("ingredient_id, qty_per_bottle")
      .eq("recipe_id", rc.id);
    setRows((data ?? []).map((x) => ({ ingredient_id: String(x.ingredient_id), qty: String(x.qty_per_bottle) })));
    setError(null);
  };

  const addRow = () => setRows((s) => [...s, { ingredient_id: "", qty: "0" }]);
  const updateRow = (idx: number, patch: Partial<RecipeItemRow>) =>
    setRows((s) => s.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRow = (idx: number) => setRows((s) => s.filter((_, i) => i !== idx));

  const save = async () => {
    if (!name.trim()) {
      setError(t("perfume.nameRequired", locale));
      return;
    }
    const valid = rows.filter((x) => x.ingredient_id && Number(x.qty) > 0);
    setSaving(true);
    const supabase = createClient();

    if (editing) {
      const { error: e1 } = await supabase
        .from("perfume_recipes")
        .update({ name: name.trim(), notes: notes.trim() || null })
        .eq("id", editing);
      if (!e1) {
        await supabase.from("perfume_recipe_items").delete().eq("recipe_id", editing);
        if (valid.length) {
          await supabase.from("perfume_recipe_items").insert(
            valid.map((x) => ({ recipe_id: editing, ingredient_id: Number(x.ingredient_id), qty_per_bottle: Number(x.qty) }))
          );
        }
      }
    } else {
      const { data: ins, error: e1 } = await supabase
        .from("perfume_recipes")
        .insert({ name: name.trim(), notes: notes.trim() || null })
        .select("id")
        .single();
      if (!e1 && ins && valid.length) {
        await supabase.from("perfume_recipe_items").insert(
          valid.map((x) => ({ recipe_id: ins.id, ingredient_id: Number(x.ingredient_id), qty_per_bottle: Number(x.qty) }))
        );
      }
    }
    setSaving(false);
    resetForm();
    load();
  };

  const removeRecipe = async (id: number) => {
    if (!confirm(t("app.deleteConfirm", locale))) return;
    const supabase = createClient();
    await supabase.from("perfume_recipes").delete().eq("id", id);
    load();
  };

  const toggleDetails = async (id: number) => {
    if (openRecipe === id) {
      setOpenRecipe(null);
      return;
    }
    setOpenRecipe(id);
    setRecipeDetails([]);
    const supabase = createClient();
    const { data } = await supabase
      .from("perfume_recipe_items")
      .select("ingredient_id, qty_per_bottle, unit, perfume_ingredients(name)")
      .eq("recipe_id", id);
    setRecipeDetails(
      (data ?? []).map((x) => ({
        ingredient_id: String(x.ingredient_id),
        qty: String(x.qty_per_bottle),
        ingredient_name: (x as { perfume_ingredients?: { name?: string } }).perfume_ingredients?.name ?? "?",
        unit: (x as { unit?: string }).unit ?? "ml",
      }))
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("perfume.recipes", locale)}</h1>
      <PerfumeNav />

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{editing ? t("perfume.editRecipe", locale) : t("perfume.newRecipe", locale)}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>{t("perfume.name", locale)} *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.notes", locale)}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">{t("perfume.recipeIngredients", locale)}</span>
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus className="size-4 mr-1" /> {t("perfume.addIngredient", locale)}
            </Button>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("perfume.noItems", locale)}</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div key={idx} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label>{t("perfume.ingredient", locale)}</Label>
                    <select
                      value={r.ingredient_id}
                      onChange={(e) => updateRow(idx, { ingredient_id: e.target.value })}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">{t("perfume.selectIngredient", locale)}</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28 space-y-1">
                    <Label>{t("perfume.qtyPerBottle", locale)}</Label>
                    <Input type="number" step="0.01" value={r.qty} onChange={(e) => updateRow(idx, { qty: e.target.value })} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(idx)}>
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <Button onClick={save} disabled={saving} className="ml-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : editing ? <Save className="size-4" /> : <Plus className="size-4" />}
            {editing ? t("perfume.update", locale) : t("perfume.add", locale)}
          </Button>
          {editing && <Button variant="outline" onClick={resetForm}>{t("app.cancel", locale)}</Button>}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">{t("perfume.name", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.ingredientCount", locale)}</th>
                <th className="p-3 font-medium">{t("app.actions", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((rc) => (
                <Fragment key={rc.id}>
                  <tr className="border-b">
                    <td className="p-3">
                      <button onClick={() => toggleDetails(rc.id)} className="font-medium hover:text-primary">
                        {rc.name}
                      </button>
                    </td>
                    <td className="p-3 text-muted-foreground">{rc.notes || "-"}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={startEdit(rc)} className="text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                        <button onClick={() => removeRecipe(rc.id)} className="text-muted-foreground hover:text-red-600"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                  {openRecipe === rc.id && (
                    <tr className="border-b bg-muted/30">
                      <td colSpan={3} className="p-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">BOM ({t("perfume.qtyPerBottle", locale)}):</div>
                        <ul className="space-y-1 text-sm">
                          {recipeDetails.map((d) => (
                            <li key={d.ingredient_id}>{d.ingredient_name}: {d.qty} {d.unit}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {recipes.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">{t("app.noData", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
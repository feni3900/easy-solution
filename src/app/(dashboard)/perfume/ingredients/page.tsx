"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Pencil, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PerfumeNav } from "@/components/perfume/perfume-nav";
import { getClientLocale, t } from "@/lib/i18n";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stock_qty: number;
  cost_per_unit: number;
  low_stock_threshold: number;
}

const empty = { name: "", unit: "ml", stock_qty: "0", cost_per_unit: "0", low_stock_threshold: "0" };

export default function IngredientsPage() {
  const locale = getClientLocale();
  const [rows, setRows] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("perfume_ingredients")
      .select("*")
      .order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (r: Ingredient) => {
    setEditingId(r.id);
    setForm({ name: r.name, unit: r.unit, stock_qty: String(r.stock_qty), cost_per_unit: String(r.cost_per_unit), low_stock_threshold: String(r.low_stock_threshold) });
    setError(null);
  };

  const resetForm = () => {
    setForm({ ...empty });
    setEditingId(null);
    setError(null);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError(t("perfume.nameRequired", locale));
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim() || "ml",
      stock_qty: Number(form.stock_qty) || 0,
      cost_per_unit: Number(form.cost_per_unit) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
    };
    const supabase = createClient();
    const { error } = editingId
      ? await supabase.from("perfume_ingredients").update(payload).eq("id", editingId)
      : await supabase.from("perfume_ingredients").insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    resetForm();
    load();
  };

  const remove = async (id: number) => {
    if (!confirm(t("app.deleteConfirm", locale))) return;
    const supabase = createClient();
    await supabase.from("perfume_ingredients").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("perfume.ingredients", locale)}</h1>
      <PerfumeNav />

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">
          {editingId ? t("perfume.edit", locale) : t("perfume.addIngredient", locale)}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1 lg:col-span-2">
            <Label>{t("perfume.name", locale)} *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.unit", locale)}</Label>
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.stockQty", locale)}</Label>
            <Input type="number" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.costPerUnit", locale)}</Label>
            <Input type="number" step="0.01" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.lowStock", locale)}</Label>
            <Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <Button onClick={save} disabled={saving} className="ml-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? <Save className="size-4" /> : <Plus className="size-4" />}
            {editingId ? t("perfume.update", locale) : t("perfume.add", locale)}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={resetForm}>{t("app.cancel", locale)}</Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">{t("perfume.name", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.unit", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.stockQty", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.costPerUnit", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.minStock", locale)}</th>
                <th className="p-3 font-medium">{t("app.actions", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.unit}</td>
                  <td className={`p-3 ${r.stock_qty <= r.low_stock_threshold ? "text-amber-600 font-medium" : ""}`}>{r.stock_qty}</td>
                  <td className="p-3">৳{r.cost_per_unit}</td>
                  <td className="p-3">{r.low_stock_threshold}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(r)} className="text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                      <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-red-600"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("app.noData", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
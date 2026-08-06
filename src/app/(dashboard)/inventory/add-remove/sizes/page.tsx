"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Loader2, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { getClientLocale, t, translateWithVars } from "@/lib/i18n";

interface Category {
  category_id: number;
  category_name: string;
}

interface Size {
  id: string;
  size_name: string;
  category_id: number | null;
  status: string;
}

export default function AddRemoveSizesPage() {
  const locale = getClientLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [c, s] = await Promise.all([
      supabase.from("categories").select("category_id, category_name").eq("is_active", true).order("category_name"),
      supabase.from("sizes").select("*").order("size_name"),
    ]);
    setCategories(c.data ?? []);
    setSizes(s.data ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleAdd = async () => {
    if (!categoryId) {
      alert(t("inventory.addRemove.selectCategoryFirst", locale));
      return;
    }
    if (!name.trim()) {
      alert(t("inventory.addRemove.sizeNameRequired", locale));
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("sizes")
      .select("id")
      .eq("category_id", categoryId)
      .ilike("size_name", name.trim());
    if (existing && existing.length > 0) {
      setSaving(false);
      alert(translateWithVars(t("inventory.addRemove.sizeExists", locale), { name: name.trim() }));
      return;
    }
    const { error } = await supabase.from("sizes").insert({ size_name: name.trim(), category_id: categoryId, status: "active" });
    setSaving(false);
    if (error) {
      alert(translateWithVars(t("inventory.addRemove.deleteError", locale), { message: error.message }));
      return;
    }
    setName("");
    await load();
  };

  const handleDelete = async (s: Size) => {
    if (!confirm(translateWithVars(t("inventory.addRemove.deleteSize", locale), { name: s.size_name }))) return;
    setDeletingId(s.id);
    const supabase = createClient();
    const { error } = await supabase.from("sizes").delete().eq("id", s.id);
    setDeletingId(null);
    if (error) {
      alert(translateWithVars(t("inventory.addRemove.sizeError", locale), { message: error.message }));
      return;
    }
    setSizes((prev) => prev.filter((x) => x.id !== s.id));
  };

  const filtered = categoryId ? sizes.filter((s) => s.category_id === categoryId) : sizes;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("inventory.addRemove.sizesTitle", locale)} description={t("inventory.addRemove.sizesDesc", locale)} />

      <div className="flex items-end gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-1 w-64">
          <Label>{t("inventory.categories.title", locale)} *</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value={0}>{t("inventory.addRemove.selectCategory", locale)}</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1 flex-1 max-w-sm">
          <Label>{t("inventory.addRemove.sizeName", locale)}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. XL, 500ml, Large" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        </div>
        <Button onClick={handleAdd} disabled={saving || !categoryId}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
          {t("inventory.addRemove.addSize", locale)}
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">{t("app.name", locale)}</th>
              <th className="p-3 font-medium">{t("inventory.categories.title", locale)}</th>
              <th className="p-3 font-medium">{t("app.status", locale)}</th>
              <th className="p-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-muted-foreground">
                  <Ruler className="size-8 mx-auto mb-2 opacity-50" />
                  <p>{categoryId ? t("inventory.addRemove.noSizes", locale) : t("inventory.addRemove.selectCategoryToSee", locale)}</p>
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{s.size_name}</td>
                  <td className="p-3 text-muted-foreground">
                    {categories.find((c) => c.category_id === s.category_id)?.category_name ?? "—"}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {s.status === "active" ? t("app.active", locale) : t("app.inactive", locale)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" disabled={deletingId === s.id} onClick={() => handleDelete(s)}>
                      {deletingId === s.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

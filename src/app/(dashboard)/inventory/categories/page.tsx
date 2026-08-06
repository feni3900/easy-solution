"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getClientLocale, t, translateWithVars } from "@/lib/i18n";

interface Category {
  category_id: number;
  category_name: string;
  parent_category_id: number | null;
  is_active: boolean;
}

export default function CategoriesPage() {
  const locale = getClientLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ category_name: "", parent_category_id: "", is_active: true });

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("*").order("category_name");
    setCategories(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ category_name: "", parent_category_id: "", is_active: true }); setDialogOpen(true); };
  const openEdit = (cat: Category) => { setEditing(cat); setForm({ category_name: cat.category_name, parent_category_id: cat.parent_category_id ? String(cat.parent_category_id) : "", is_active: cat.is_active }); setDialogOpen(true); };

  const handleSave = async () => {
    const supabase = createClient();
    const payload = { category_name: form.category_name, parent_category_id: form.parent_category_id ? parseInt(form.parent_category_id) : null, is_active: form.is_active };
    if (editing) {
      await supabase.from("categories").update(payload).eq("category_id", editing.category_id);
    } else {
      if (!form.category_name.trim()) {
        alert(t("inventory.categories.nameRequired", locale));
        return;
      }
      const { data: existing } = await supabase
        .from("categories")
        .select("category_id")
        .ilike("category_name", form.category_name.trim());
      if (existing && existing.length > 0) {
        alert(translateWithVars(t("inventory.categories.exists", locale), { name: form.category_name.trim() }));
        return;
      }
      await supabase.from("categories").insert(payload);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("app.deleteConfirm", locale))) return;
    const supabase = createClient();
    await supabase.from("categories").delete().eq("category_id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("inventory.categories.title", locale)}</h1>
        <Button onClick={openCreate}><Plus className="size-4 mr-2" />{t("inventory.categories.add", locale)}</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t("app.name", locale)}</th>
                <th className="p-3 text-center font-medium">{t("app.status", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.actions", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.category_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.category_name}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.is_active ? t("app.active", locale) : t("app.inactive", locale)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.category_id)}><Trash2 className="size-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("inventory.categories.edit", locale) : t("inventory.categories.add", locale)}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{t("inventory.categories.categoryName", locale)}</Label>
              <Input value={form.category_name} onChange={(e) => setForm({ ...form, category_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{t("inventory.categories.parent", locale)}</Label>
              <select value={form.parent_category_id} onChange={(e) => setForm({ ...form, parent_category_id: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">{t("inventory.categories.none", locale)}</option>
                {categories.filter((c) => c.category_id !== editing?.category_id).map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("app.cancel", locale)}</Button>
            <Button onClick={handleSave}>{editing ? t("app.update", locale) : t("app.create", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

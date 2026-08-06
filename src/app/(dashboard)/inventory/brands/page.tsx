"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getClientLocale, t, translateWithVars } from "@/lib/i18n";

interface Brand {
  brand_id: number;
  brand_name: string;
  is_active: boolean;
}

export default function BrandsPage() {
  const locale = getClientLocale();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ brand_name: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("brands").select("*").order("brand_name");
    setBrands(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ brand_name: "" }); setDialogOpen(true); };
  const openEdit = (brand: Brand) => { setEditing(brand); setForm({ brand_name: brand.brand_name }); setDialogOpen(true); };

  const handleSave = async () => {
    const supabase = createClient();
    if (editing) {
      await supabase.from("brands").update({ brand_name: form.brand_name }).eq("brand_id", editing.brand_id);
    } else {
      if (!form.brand_name.trim()) {
        alert(t("inventory.brands.nameRequired", locale));
        return;
      }
      const { data: existing } = await supabase
        .from("brands")
        .select("brand_id")
        .ilike("brand_name", form.brand_name.trim());
      if (existing && existing.length > 0) {
        alert(translateWithVars(t("inventory.brands.exists", locale), { name: form.brand_name.trim() }));
        return;
      }
      await supabase.from("brands").insert({ brand_name: form.brand_name });
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("app.deleteConfirm", locale))) return;
    const supabase = createClient();
    await supabase.from("brands").delete().eq("brand_id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("inventory.brands.title", locale)}</h1>
        <Button onClick={openCreate}><Plus className="size-4 mr-2" />{t("inventory.brands.add", locale)}</Button>
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
              {brands.map((b) => (
                <tr key={b.brand_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{b.brand_name}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {b.is_active ? t("app.active", locale) : t("app.inactive", locale)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(b.brand_id)}><Trash2 className="size-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("inventory.brands.edit", locale) : t("inventory.brands.add", locale)}</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label>{t("inventory.brands.brandName", locale)}</Label>
            <Input value={form.brand_name} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
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

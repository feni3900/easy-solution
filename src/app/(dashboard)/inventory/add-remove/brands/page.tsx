"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { getClientLocale, t, translateWithVars } from "@/lib/i18n";

interface Brand {
  brand_id: number;
  brand_name: string;
  is_active: boolean;
}

export default function AddRemoveBrandsPage() {
  const locale = getClientLocale();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("brands").select("*").order("brand_name");
    setBrands(data ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleAdd = async () => {
    if (!name.trim()) {
      alert(t("inventory.brands.nameRequired", locale));
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("brands")
      .select("brand_id")
      .ilike("brand_name", name.trim());
    if (existing && existing.length > 0) {
      setSaving(false);
      alert(translateWithVars(t("inventory.brands.exists", locale), { name: name.trim() }));
      return;
    }
    const { error } = await supabase.from("brands").insert({ brand_name: name.trim(), is_active: true });
    setSaving(false);
    if (error) {
      alert(translateWithVars(t("inventory.addRemove.brandError", locale), { message: error.message }));
      return;
    }
    setName("");
    await load();
  };

  const handleDelete = async (brand: Brand) => {
    if (!confirm(translateWithVars(t("inventory.addRemove.deleteBrand", locale), { name: brand.brand_name }))) return;
    setDeletingId(brand.brand_id);
    const supabase = createClient();
    const { error } = await supabase.from("brands").delete().eq("brand_id", brand.brand_id);
    setDeletingId(null);
    if (error) {
      alert(translateWithVars(t("inventory.addRemove.brandError", locale), { message: error.message }));
      return;
    }
    setBrands((prev) => prev.filter((x) => x.brand_id !== brand.brand_id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("inventory.brands.title", locale)} description={t("inventory.addRemove.brandsDesc", locale)} />

      <div className="flex items-end gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-1 flex-1 max-w-sm">
          <Label>{t("inventory.brands.brandName", locale)}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Samsung" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        </div>
        <Button onClick={handleAdd} disabled={saving}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
          {t("inventory.brands.add", locale)}
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">{t("app.name", locale)}</th>
              <th className="p-3 font-medium">{t("app.status", locale)}</th>
              <th className="p-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-12 text-center text-muted-foreground">
                  <Tag className="size-8 mx-auto mb-2 opacity-50" />
                  <p>{t("inventory.addRemove.noBrands", locale)}</p>
                </td>
              </tr>
            ) : (
              brands.map((b) => (
                <tr key={b.brand_id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{b.brand_name}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {b.is_active ? t("app.active", locale) : t("app.inactive", locale)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" disabled={deletingId === b.brand_id} onClick={() => handleDelete(b)}>
                      {deletingId === b.brand_id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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

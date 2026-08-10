"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PerfumeNav } from "@/components/perfume/perfume-nav";
import { getClientLocale, t } from "@/lib/i18n";

interface Supplier {
  supplier_id: number;
  supplier_name: string;
}
interface Ingredient {
  id: number;
  name: string;
  unit: string;
}
interface BottleType {
  id: number;
  name: string;
}
interface PurchaseItem {
  type: "ingredient" | "bottle";
  itemId: number;
  name: string;
  qty: string;
  unitPrice: string;
}
interface Purchase {
  id: number;
  purchase_no: string;
  purchase_date: string;
  total: number;
  paid_amount: number;
  note: string | null;
  suppliers: { supplier_name: string } | null;
  perfume_purchase_items: { item_type: string; item_id: number; quantity: number; unit_price: number }[];
}

export default function PurchasesPage() {
  const locale = getClientLocale();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [bottles, setBottles] = useState<BottleType[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidAmount, setPaidAmount] = useState("0");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [s, i, b, p] = await Promise.all([
      supabase.from("suppliers").select("supplier_id, supplier_name").order("supplier_name"),
      supabase.from("perfume_ingredients").select("id, name, unit").order("name"),
      supabase.from("perfume_bottles").select("id, name").order("name"),
      supabase.from("perfume_purchases")
        .select("*, suppliers(supplier_name), perfume_purchase_items(item_type, item_id, quantity, unit_price)")
        .order("purchase_date", { ascending: false }).limit(20),
    ]);
    setSuppliers(s.data ?? []);
    setIngredients(i.data ?? []);
    setBottles(b.data ?? []);
    setPurchases(p.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = (type: "ingredient" | "bottle") => {
    setItems((arr) => [...arr, { type, itemId: 0, name: "", qty: "1", unitPrice: "0" }]);
    setError(null);
  };

  const removeItem = (idx: number) => setItems((arr) => arr.filter((_, i) => i !== idx));

  const updateItem = (idx: number, patch: Partial<PurchaseItem>) => {
    setItems((arr) => arr.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, ...patch };
      if (patch.itemId !== undefined) {
        if (next.type === "ingredient") next.name = ingredients.find((x) => x.id === patch.itemId)?.name ?? "";
        else next.name = bottles.find((x) => x.id === patch.itemId)?.name ?? "";
      }
      return next;
    }));
    setError(null);
  };

  const save = async () => {
    if (items.length === 0) {
      setError(t("perfume.inv.noItems", locale));
      return;
    }
    const clean = items.map((it) => ({
      type: it.type,
      id: it.itemId,
      qty: Number(it.qty) || 0,
      unit_price: Number(it.unitPrice) || 0,
    }));
    if (clean.some((x) => x.id === 0 || x.qty <= 0)) {
      setError(t("perfume.inv.fillItems", locale));
      return;
    }
    setSaving(true);
    setError(null);
    setResult(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("purchase_perfume_raw", {
      p_supplier_id: supplierId || null,
      p_items: clean,
      p_paid: Number(paidAmount) || 0,
      p_note: note.trim() || null,
      p_purchase_date: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResult(String(data));
    setItems([]);
    setPaidAmount("0");
    setNote("");
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("perfume.inv.purchases", locale)}</h1>
      <PerfumeNav />

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("perfume.inv.newPurchase", locale)}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>{t("perfume.inv.supplier", locale)}</Label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("perfume.inv.selectSupplier", locale)}</option>
              {suppliers.map((x) => (
                <option key={x.supplier_id} value={x.supplier_id}>{x.supplier_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>{t("app.date", locale)}</Label>
            <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.inv.paid", locale)}</Label>
            <Input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2 rounded-md border p-2">
              <div className="space-y-1">
                <Label>{t("perfume.inv.item", locale)}</Label>
                <select
                  value={it.itemId || ""}
                  onChange={(e) => updateItem(idx, { itemId: Number(e.target.value) })}
                  className="w-44 rounded-md border bg-background px-2 py-2 text-sm"
                >
                  <option value="">{it.type === "ingredient" ? t("perfume.inv.selectIngredient", locale) : t("perfume.inv.selectBottle", locale)}</option>
                  {(it.type === "ingredient" ? ingredients : bottles).map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t("perfume.stockQty", locale)}</Label>
                <Input type="number" className="w-24" value={it.qty} onChange={(e) => updateItem(idx, { qty: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>{t("perfume.costPerUnit", locale)}</Label>
                <Input type="number" step="0.01" className="w-28" value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })} />
              </div>
              <button onClick={() => removeItem(idx)} className="mb-1 text-muted-foreground hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("perfume.inv.noItems", locale)}</p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" onClick={() => addItem("ingredient")}><Plus className="size-4" /> {t("perfume.inv.addIngredient", locale)}</Button>
          <Button variant="outline" onClick={() => addItem("bottle")}><PackagePlus className="size-4" /> {t("perfume.inv.addBottle", locale)}</Button>
          {error && <span className="text-sm text-red-600">{error}</span>}
          {result && <span className="text-sm text-green-600">{t("perfume.inv.purchaseDone", locale)} {result}</span>}
          <Button onClick={save} disabled={saving} className="ml-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("perfume.inv.savePurchase", locale)}
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
                <th className="p-3 font-medium">{t("perfume.inv.purchaseNo", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.supplier", locale)}</th>
                <th className="p-3 font-medium">{t("app.date", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.items", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.total", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.paid", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.due", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.notes", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-3 font-medium">{p.purchase_no}</td>
                  <td className="p-3">{p.suppliers?.supplier_name ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(p.purchase_date).toLocaleDateString()}</td>
                  <td className="p-3">
                    {p.perfume_purchase_items.map((it) => {
                      const src = it.item_type === "ingredient" ? ingredients : bottles;
                      return `${src.find((x) => x.id === it.item_id)?.name ?? it.item_id} ×${it.quantity}`;
                    }).join(", ") || "-"}
                  </td>
                  <td className="p-3">৳{Number(p.total).toFixed(2)}</td>
                  <td className="p-3">৳{Number(p.paid_amount).toFixed(2)}</td>
                  <td className="p-3 text-amber-600">৳{Math.max(Number(p.total) - Number(p.paid_amount), 0).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">{p.note || "-"}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{t("app.noData", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

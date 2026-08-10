"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PerfumeNav } from "@/components/perfume/perfume-nav";
import { getClientLocale, t } from "@/lib/i18n";

interface Customer {
  id: string;
  name: string;
  mobile: string;
}
interface Recipe {
  id: number;
  name: string;
}
interface StockRow {
  recipe_id: number;
  stock_qty: number;
  price: number;
}
interface SaleItem {
  recipeId: number;
  name: string;
  qty: string;
  unitPrice: string;
}
interface Sale {
  id: number;
  invoice_no: string;
  sale_date: string;
  total: number;
  paid_amount: number;
  due_amount: number;
  payment_method: string;
  note: string | null;
  customers: { name: string } | null;
  perfume_sale_items: { recipe_id: number; quantity: number; unit_price: number }[];
}

export default function SalesPage() {
  const locale = getClientLocale();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [c, r, s, sl] = await Promise.all([
      supabase.from("customers").select("id, name, mobile").eq("status", "active").order("name"),
      supabase.from("perfume_recipes").select("id, name").order("name"),
      supabase.from("perfume_stock").select("recipe_id, stock_qty, price"),
      supabase.from("perfume_sales")
        .select("*, customers(name), perfume_sale_items(recipe_id, quantity, unit_price)")
        .order("sale_date", { ascending: false }).limit(20),
    ]);
    setCustomers(c.data ?? []);
    setRecipes(r.data ?? []);
    setStock(s.data ?? []);
    setSales(sl.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = () => {
    setItems((arr) => [...arr, { recipeId: 0, name: "", qty: "1", unitPrice: "0" }]);
    setError(null);
  };

  const removeItem = (idx: number) => setItems((arr) => arr.filter((_, i) => i !== idx));

  const updateItem = (idx: number, patch: Partial<SaleItem>) => {
    setItems((arr) => arr.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, ...patch };
      if (patch.recipeId !== undefined) {
        const st = stock.find((x) => x.recipe_id === patch.recipeId);
        next.name = recipes.find((x) => x.id === patch.recipeId)?.name ?? "";
        next.qty = "1";
        next.unitPrice = st ? String(st.price) : "0";
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
      recipe_id: it.recipeId,
      qty: Number(it.qty) || 0,
      unit_price: Number(it.unitPrice) || 0,
    }));
    if (clean.some((x) => x.recipe_id === 0 || x.qty <= 0)) {
      setError(t("perfume.inv.fillItems", locale));
      return;
    }
    setSaving(true);
    setError(null);
    setResult(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("sell_perfume", {
      p_customer_id: customerId || null,
      p_items: clean,
      p_paid: Number(paidAmount) || 0,
      p_payment_method: paymentMethod,
      p_discount: Number(discount) || 0,
      p_note: note.trim() || null,
      p_sale_date: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResult(String(data));
    setItems([]);
    setPaidAmount("0");
    setDiscount("0");
    setNote("");
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("perfume.inv.sales", locale)}</h1>
      <PerfumeNav />

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">{t("perfume.inv.newSale", locale)}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>{t("perfume.inv.customer", locale)}</Label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("perfume.inv.selectCustomer", locale)}</option>
              {customers.map((x) => (
                <option key={x.id} value={x.id}>{x.name} ({x.mobile})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>{t("app.date", locale)}</Label>
            <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.inv.paymentMethod", locale)}</Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="cash">{t("perfume.inv.cash", locale)}</option>
              <option value="credit">{t("perfume.inv.credit", locale)}</option>
              <option value="card">{t("perfume.inv.card", locale)}</option>
              <option value="mobile_payment">{t("perfume.inv.mobilePayment", locale)}</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.inv.paid", locale)}</Label>
            <Input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.inv.discount", locale)}</Label>
            <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("perfume.notes", locale)}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {items.map((it, idx) => {
            const st = stock.find((x) => x.recipe_id === it.recipeId);
            return (
              <div key={idx} className="flex flex-wrap items-end gap-2 rounded-md border p-2">
                <div className="space-y-1">
                  <Label>{t("perfume.inv.product", locale)}</Label>
                  <select
                    value={it.recipeId || ""}
                    onChange={(e) => updateItem(idx, { recipeId: Number(e.target.value) })}
                    className="w-48 rounded-md border bg-background px-2 py-2 text-sm"
                  >
                    <option value="">{t("perfume.inv.selectRecipe", locale)}</option>
                    {recipes.map((x) => {
                      const s = stock.find((y) => y.recipe_id === x.id);
                      return (
                        <option key={x.id} value={x.id}>
                          {x.name} {s ? `(${s.stock_qty} ${t("perfume.inStockShort", locale)})` : "(0)"}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t("perfume.stockQty", locale)}</Label>
                  <Input type="number" className="w-24" value={it.qty} onChange={(e) => updateItem(idx, { qty: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>{t("perfume.price", locale)}</Label>
                  <Input type="number" step="0.01" className="w-28" value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })} />
                </div>
                {st && Number(st.stock_qty) < Number(it.qty) && (
                  <span className="mb-1 text-xs text-amber-600">{t("perfume.inv.insufficient", locale)}</span>
                )}
                <button onClick={() => removeItem(idx)} className="mb-1 text-muted-foreground hover:text-red-600">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("perfume.inv.noItems", locale)}</p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" onClick={addItem}><Plus className="size-4" /> {t("perfume.inv.addItem", locale)}</Button>
          {error && <span className="text-sm text-red-600">{error}</span>}
          {result && <span className="text-sm text-green-600">{t("perfume.inv.saleDone", locale)} {result}</span>}
          <Button onClick={save} disabled={saving} className="ml-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {t("perfume.inv.saveSale", locale)}
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
                <th className="p-3 font-medium">{t("perfume.inv.invoiceNo", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.customer", locale)}</th>
                <th className="p-3 font-medium">{t("app.date", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.items", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.total", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.paid", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.inv.due", locale)}</th>
                <th className="p-3 font-medium">{t("perfume.notes", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-3 font-medium">{s.invoice_no}</td>
                  <td className="p-3">{s.customers?.name ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(s.sale_date).toLocaleDateString()}</td>
                  <td className="p-3">
                    {s.perfume_sale_items.map((it) => {
                      return `${recipes.find((x) => x.id === it.recipe_id)?.name ?? it.recipe_id} ×${it.quantity}`;
                    }).join(", ") || "-"}
                  </td>
                  <td className="p-3">৳{Number(s.total).toFixed(2)}</td>
                  <td className="p-3">৳{Number(s.paid_amount).toFixed(2)}</td>
                  <td className="p-3 text-amber-600">৳{Number(s.due_amount).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">{s.note || "-"}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{t("app.noData", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2, Save, ArrowLeft, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AddSupplierModal from "./add-supplier-modal";
import AddItemDialog from "./add-item-dialog";
import { getClientLocale, t, fmtMoney, fmtInt, translateWithVars } from "@/lib/i18n";

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  company_name: string | null;
  phone: string;
}

interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  category_id: number;
  brand_id: number;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

export interface PurchaseItem {
  product_id: number;
  product_name: string;
  sku: string;
  category_name: string;
  brand_name: string;
  quantity: number;
  unit_cost: number;
  selling_price: number;
  unit: string;
  variant: string;
  size: string;
  storage_location: string;
}

export default function PurchasesNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPurchaseId = searchParams.get("edit");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [supplierId, setSupplierId] = useState<number>(0);
  const [purchaseNo, setPurchaseNo] = useState("");
  const [memoNo, setMemoNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentType, setPaymentType] = useState<"Cash" | "Credit" | "Partial">("Cash");
  const [cashAmount, setCashAmount] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const locale = getClientLocale();

  const reloadAll = useCallback(async () => {
    const supabase = createClient();
    const [s, p, c, b] = await Promise.all([
      supabase.from("suppliers").select("supplier_id, supplier_name, company_name, phone"),
      supabase.from("products").select("product_id, product_name, sku, cost_price, selling_price, current_stock, category_id, brand_id").eq("is_active", true).order("product_name"),
      supabase.from("categories").select("category_id, category_name").eq("is_active", true).order("category_name"),
      supabase.from("brands").select("brand_id, brand_name").eq("is_active", true).order("brand_name"),
    ]);
    setSuppliers(s.data ?? []);
    setProducts(p.data ?? []);
    setCategories(c.data ?? []);
    setBrands(b.data ?? []);
  }, []);

  useEffect(() => {
    const load = async () => {
      await reloadAll();
      if (editPurchaseId) {
        const id = parseInt(editPurchaseId);
        setEditingPurchaseId(id);
        const supabase = createClient();
        const { data: purchase } = await supabase
          .from("purchases")
          .select("*")
          .eq("purchase_id", id)
          .single();
        if (purchase) {
          setSupplierId(purchase.supplier_id);
          setPurchaseNo(purchase.invoice_no);
          setPurchaseDate(purchase.purchase_date);
          setPaymentType(purchase.payment_type);
          setNotes(purchase.notes ?? "");
          const note = purchase.notes ?? "";
          if (purchase.payment_type === "Partial") {
            const match = note.match(/Cash: ([0-9.]+) \| Due: ([0-9.]+)/);
            const paidVal = Number(purchase.paid_amount ?? 0);
            const dueVal = Number(purchase.due_amount ?? 0);
            if (match && paidVal === 0 && dueVal === 0) {
              setCashAmount(parseFloat(match[1]));
              setDueAmount(parseFloat(match[2]));
            } else {
              setCashAmount(paidVal);
              setDueAmount(dueVal);
            }
          }
        }
        const { data: itemsData } = await supabase
          .from("purchase_items")
          .select("*, products(product_name, sku, size, unit, storage_location, category_id, brand_id)")
          .eq("purchase_id", id)
          .order("purchase_item_id");
        setItems(
          (itemsData ?? []).map((it) => ({
            product_id: it.product_id,
            product_name: it.products?.product_name ?? "",
            sku: it.products?.sku ?? "",
            category_name: "",
            brand_name: "",
            quantity: it.quantity,
            unit_cost: Number(it.unit_cost),
            selling_price: Number(it.selling_price ?? 0),
            unit: it.products?.unit ?? "",
            variant: "",
            size: it.products?.size ?? "",
            storage_location: it.products?.storage_location ?? "Self",
          }))
        );
      } else {
        setPurchaseNo(`PUR-${Date.now()}`);
      }
      setLoading(false);
    };
    load();
  }, [reloadAll, editPurchaseId]);

  const handleAddItem = (item: PurchaseItem) => {
    if (editItemIndex !== null) {
      setItems((prev) => prev.map((it, i) => (i === editItemIndex ? item : it)));
      setEditItemIndex(null);
    } else {
      setItems((prev) => [...prev, item]);
    }
    setShowItemDialog(false);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

  const handleSubmit = async () => {
    if (!supplierId || items.length === 0) {
      alert(t("purchases.new.errorSupplier", locale));
      return;
    }

    if (paymentType === "Partial" && cashAmount <= 0) {
      alert(t("purchases.new.errorCash", locale));
      return;
    }

    if (paymentType === "Partial" && cashAmount > totalAmount) {
      alert(t("purchases.new.errorCashMax", locale));
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const purchaseData: Record<string, unknown> = {
      supplier_id: supplierId,
      invoice_no: purchaseNo,
      purchase_date: purchaseDate,
      payment_type: paymentType,
      total_amount: totalAmount,
      paid_amount: paymentType === "Cash" ? totalAmount : paymentType === "Partial" ? cashAmount : 0,
      due_amount: paymentType === "Credit" ? totalAmount : paymentType === "Partial" ? dueAmount : 0,
      notes: notes || null,
      created_by: user?.id || null,
    };

    if (paymentType === "Partial") {
      const paymentNote = `Cash: ${cashAmount.toFixed(2)} | Due: ${dueAmount.toFixed(2)}`;
      purchaseData.notes = purchaseData.notes ? `${purchaseData.notes}\n${paymentNote}` : paymentNote;
    }

    let purchaseId: number;
    if (editingPurchaseId) {
      purchaseId = editingPurchaseId;
      const { error: updateError } = await supabase
        .from("purchases")
        .update(purchaseData)
        .eq("purchase_id", purchaseId);
      if (updateError) {
        alert(t("purchases.new.errorUpdating", locale) + updateError.message);
        setSaving(false);
        return;
      }
      const { data: oldItems } = await supabase
        .from("purchase_items")
        .select("product_id, quantity")
        .eq("purchase_id", purchaseId);
      for (const oldItem of oldItems ?? []) {
        await supabase.rpc("deduct_stock", {
          p_product_id: oldItem.product_id,
          p_quantity: oldItem.quantity,
          p_movement_type: "Purchase_Edit",
          p_reference_id: purchaseId,
          p_reference_no: purchaseNo,
          p_notes: `Reverting stock for edited purchase ${purchaseNo}`,
          p_created_by: user?.id || null,
        });
      }
      await supabase.from("purchase_items").delete().eq("purchase_id", purchaseId);
    } else {
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert(purchaseData)
        .select("purchase_id")
        .single();
      if (purchaseError || !purchase) {
        alert(t("purchases.new.errorCreating", locale) + (purchaseError?.message || t("app.unknown", locale)));
        setSaving(false);
        return;
      }
      purchaseId = purchase.purchase_id;
    }

    const purchaseItems = items.map((item) => ({
      purchase_id: purchaseId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      selling_price: item.selling_price || null,
    }));

    const { error: itemsError } = await supabase.from("purchase_items").insert(purchaseItems);
    if (itemsError) {
      alert(t("purchases.new.errorItems", locale) + itemsError.message);
      setSaving(false);
      return;
    }

    for (const item of items) {
      await supabase.rpc("add_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
        p_movement_type: "Purchase",
        p_reference_id: purchaseId,
        p_reference_no: purchaseNo,
        p_notes: `Purchase from ${suppliers.find((s) => s.supplier_id === supplierId)?.supplier_name || "Unknown"}`,
        p_created_by: user?.id || null,
      });

      await supabase
        .from("products")
        .update({ cost_price: item.unit_cost, selling_price: item.selling_price, size: item.size || null, unit: item.unit || null, storage_location: item.storage_location || "Self" })
        .eq("product_id", item.product_id);
    }

    setSaving(false);
    router.push("/purchases/history");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/purchases/history">
          <Button variant="ghost" size="icon"><ArrowLeft className="size-5" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold">{editingPurchaseId ? t("purchases.new.editTitle", locale) : t("purchases.new.title", locale)}</h1>
      </div>

      {/* Header Fields */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <Label>{t("purchases.new.purchaseNo", locale)}</Label>
            <Input value={purchaseNo} disabled className="bg-muted font-mono" />
          </div>
          <div className="space-y-1">
            <Label>{t("purchases.new.memoNo", locale)}</Label>
            <Input value={memoNo} onChange={(e) => setMemoNo(e.target.value)} placeholder={t("purchases.new.memoPh", locale)} />
          </div>
          <div className="space-y-1">
            <Label>{t("purchases.new.purchaseDate", locale)}</Label>
            <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("purchases.new.paymentType", locale)}</Label>
            <select value={paymentType} onChange={(e) => {
              const type = e.target.value as "Cash" | "Credit" | "Partial";
              setPaymentType(type);
              if (type !== "Partial") {
                setCashAmount(0);
                setDueAmount(0);
              }
            }} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="Cash">{t("purchases.new.paymentCash", locale)}</option>
              <option value="Credit">{t("purchases.new.paymentCredit", locale)}</option>
              <option value="Partial">{t("purchases.new.paymentPartial", locale)}</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label>{t("purchases.new.supplier", locale)}</Label>
            <div className="flex gap-2">
              <select value={supplierId} onChange={(e) => setSupplierId(Number(e.target.value))} className="flex-1 rounded-md border bg-background px-3 py-2 text-sm">
                <option value={0}>{t("purchases.new.selectSupplier", locale)}</option>
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_name} {s.company_name ? `(${s.company_name})` : ""} — {s.phone}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="icon" onClick={() => setShowSupplierModal(true)} title={t("purchases.new.addSupplier", locale)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t("app.notes", locale)}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("purchases.new.notesPh", locale)} />
          </div>
        </div>
      </div>

      {/* Purchase Items */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-medium flex items-center gap-2">
            <Package className="size-4" />
            {translateWithVars(t("purchases.new.itemsTitle", locale), { n: fmtInt(items.length, locale) })}
          </h3>
          <Button onClick={() => { setEditItemIndex(null); setShowItemDialog(true); }}>
            <Plus className="size-4 mr-2" /> {t("purchases.new.addItem", locale)}
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Package className="size-8 mx-auto mb-2 opacity-50" />
            <p>{t("purchases.new.noItems", locale)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 w-8">#</th>
                  <th className="p-3">{t("sales.returns.product", locale)}</th>
                  <th className="p-3">{t("purchases.new.category", locale)}</th>
                  <th className="p-3">{t("purchases.new.brand", locale)}</th>
                  <th className="p-3 w-16">{t("app.size", locale)}</th>
                  <th className="p-3 w-16">{t("app.unit", locale)}</th>
                  <th className="p-3 w-20">{t("app.location", locale)}</th>
                  <th className="p-3 w-16">{t("app.qty", locale)}</th>
                  <th className="p-3 w-24">{t("purchases.new.costPrice", locale)}</th>
                  <th className="p-3 w-28 text-right">{t("app.total", locale)}</th>
                  <th className="p-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground">{fmtInt(index + 1, locale)}</td>
                    <td className="p-3">
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-xs text-muted-foreground">{item.sku}</div>
                    </td>
                    <td className="p-3 text-xs">{item.category_name}</td>
                    <td className="p-3 text-xs">{item.brand_name}</td>
                    <td className="p-3 text-xs">{item.size}</td>
                    <td className="p-3 text-xs">{item.unit}</td>
                    <td className="p-3 text-xs">{item.storage_location}</td>
                    <td className="p-3 font-medium">{fmtInt(item.quantity, locale)}</td>
                    <td className="p-3">{fmtMoney(item.unit_cost, locale)}</td>
                    <td className="p-3 font-medium text-right">{fmtMoney(item.quantity * item.unit_cost, locale)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => { setEditItemIndex(index); setShowItemDialog(true); }}>
                          <Pencil className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removeItem(index)}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {translateWithVars(t("purchases.new.itemsCount", locale), { n: fmtInt(items.length, locale), u: fmtInt(items.reduce((s, i) => s + i.quantity, 0), locale) })}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t("purchases.new.grandTotal", locale)}</p>
              <p className="text-2xl font-bold">{fmtMoney(totalAmount, locale)}</p>
            </div>
          </div>

          {paymentType === "Partial" && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 max-w-md ml-auto">
              <div className="space-y-1">
                <Label>{t("purchases.new.cashAmount", locale)} *</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={cashAmount || ""}
                  onChange={(e) => {
                    const cash = parseFloat(e.target.value) || 0;
                    setCashAmount(cash);
                    setDueAmount(Math.max(0, totalAmount - cash));
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <Label>{t("purchases.new.dueAmount", locale)}</Label>
                <Input
                  type="number"
                  value={dueAmount.toFixed(2)}
                  disabled
                  className="bg-muted font-medium text-orange-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/purchases/history">
          <Button variant="outline">{t("purchases.new.cancel", locale)}</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={saving || items.length === 0 || !supplierId}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          {saving ? t("purchases.new.saving", locale) : editingPurchaseId ? t("purchases.new.saveUpdate", locale) : t("purchases.new.saveNew", locale)}
        </Button>
      </div>

      {/* Modals */}
      {showSupplierModal && (
        <AddSupplierModal
          onClose={() => setShowSupplierModal(false)}
          onAdded={(supplier) => {
            setSuppliers((prev) => [...prev, supplier]);
            setSupplierId(supplier.supplier_id);
            setShowSupplierModal(false);
          }}
        />
      )}
      {showItemDialog && (
        <AddItemDialog
          categories={categories}
          brands={brands}
          products={products}
          editItem={editItemIndex !== null ? items[editItemIndex] : null}
          onAdd={handleAddItem}
          onClose={() => { setShowItemDialog(false); setEditItemIndex(null); }}
          onRefresh={reloadAll}
        />
      )}
    </div>
  );
}

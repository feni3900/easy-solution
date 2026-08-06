"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getClientLocale, t, fmtInt, translateWithVars } from "@/lib/i18n";

interface Product {
  product_id: number;
  product_name: string;
  current_stock: number;
}

interface DamageRow {
  id: number;
  quantity: number;
  reason: string | null;
  date: string;
  products?: { product_name: string } | null;
}

const makeColumns = (locale: "en" | "bn"): ColumnDef<DamageRow>[] => [
  {
    accessorKey: "date",
    header: t("app.date", locale),
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
  },
  { header: t("sales.returns.product", locale), cell: ({ row }) => row.original.products?.product_name ?? "—" },
  { accessorKey: "quantity", header: t("app.qty", locale), cell: ({ row }) => fmtInt(row.original.quantity, locale) },
  { accessorKey: "reason", header: t("sales.reason", locale) },
];

export default function DamagesPage() {
  const locale = getClientLocale();
  const columns = makeColumns(locale);
  const [damages, setDamages] = useState<DamageRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    quantity: "1",
    reason: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [damagesRes, productsRes] = await Promise.all([
      supabase
        .from("damaged_products")
        .select("*, products(product_name)")
        .order("date", { ascending: false }),
      supabase
        .from("products")
        .select("product_id, product_name, current_stock")
        .eq("is_active", true)
        .order("product_name"),
    ]);
    setDamages(damagesRes.data ?? []);
    setProducts(productsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!form.product_id || !form.quantity) return;
    const qty = Number(form.quantity);
    const product = products.find((p) => String(p.product_id) === form.product_id);
    if (!product) return;
    if (qty > product.current_stock) {
      alert(translateWithVars(t("inventory.damages.onlyStock", locale), { stock: fmtInt(product.current_stock, locale), product: product.product_name }));
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: damage, error } = await supabase
      .from("damaged_products")
      .insert({
        product_id: Number(form.product_id),
        quantity: qty,
        reason: form.reason || null,
      })
      .select("id")
      .single();

    if (error) {
      alert(translateWithVars(t("inventory.damages.error", locale), { message: error.message }));
      setSaving(false);
      return;
    }

    const { error: stockError } = await supabase.rpc("deduct_stock", {
      p_product_id: Number(form.product_id),
      p_quantity: qty,
      p_movement_type: "Damage",
      p_reference_id: damage?.id ?? null,
      p_reference_no: `DAM-${damage?.id ?? 0}`,
      p_notes: form.reason || "Damaged stock",
      p_created_by: user?.id ?? null,
    });

    if (stockError) {
      alert(translateWithVars(t("inventory.damages.recordedButFailed", locale), { message: stockError.message }));
    } else {
      setForm({ product_id: "", quantity: "1", reason: "" });
      setOpen(false);
    }
    setSaving(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={t("inventory.damages.title", locale)} description={t("inventory.damages.desc", locale)} />
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t("inventory.damages.record", locale)}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("inventory.damages.recordTitle", locale)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>{t("sales.returns.product", locale)}</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                >
                  <option value="">{t("inventory.damages.selectProduct", locale)}</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} ({translateWithVars(t("inventory.damages.stock", locale), { n: fmtInt(p.current_stock, locale) })})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>{t("inventory.damages.quantity", locale)}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("sales.reason", locale)}</Label>
                <Input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder={t("inventory.damages.reasonPh", locale)}
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !form.product_id || !form.quantity}
              >
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                {t("inventory.damages.record", locale)}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable columns={columns} data={damages} searchKey="reason" />
      )}
    </div>
  );
}

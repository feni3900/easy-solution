"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { getClientLocale, t } from "@/lib/i18n";

interface DiscountRule {
  rule_id: number;
  category: string;
  min_quantity: number;
  discount_percentage: number;
  item_name: string;
  is_active: boolean;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface Product {
  product_id: number;
  product_name: string;
}

const makeColumns = (locale: "en" | "bn"): ColumnDef<DiscountRule>[] => [
  { accessorKey: "category", header: t("admin.discountRules.category", locale) },
  { accessorKey: "min_quantity", header: t("admin.discountRules.minQty", locale) },
  {
    accessorKey: "discount_percentage",
    header: t("admin.discountRules.discountPct", locale),
    cell: ({ row }) => `${row.original.discount_percentage}%`,
  },
  { accessorKey: "item_name", header: t("admin.discountRules.itemName", locale) },
];

export default function AdminDiscountRulesPage() {
  const locale = getClientLocale();
  const columns = makeColumns(locale);
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiscountRule | null>(null);
  const [form, setForm] = useState({ category: "", min_quantity: 1, discount_percent: 0, item_name: "" });
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    const supabase = createClient();
    const [rulesRes, catsRes] = await Promise.all([
      supabase.from("bulk_discount_rules").select("rule_id, category, min_quantity, discount_percentage, item_name, is_active").order("min_quantity"),
      supabase.from("categories").select("category_id, category_name").eq("is_active", true).order("category_name"),
    ]);
    setRules(rulesRes.data ?? []);
    setCategories(catsRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const fetchProducts = async (categoryName: string) => {
    if (!categoryName) { setProducts([]); return; }
    const supabase = createClient();
    const { data: cat } = await supabase.from("categories").select("category_id").eq("category_name", categoryName).single();
    if (!cat) { setProducts([]); return; }
    const { data } = await supabase.from("products").select("product_id, product_name").eq("category_id", cat.category_id).eq("is_active", true).order("product_name");
    setProducts(data ?? []);
  };

  const openAdd = () => { setEditing(null); setForm({ category: "", min_quantity: 1, discount_percent: 0, item_name: "ALL" }); setProducts([]); setOpen(true); };
  const openEdit = (row: DiscountRule) => { setEditing(row); setForm({ category: row.category ?? "", min_quantity: row.min_quantity ?? 1, discount_percent: row.discount_percentage ?? 0, item_name: row.item_name ?? "ALL" }); fetchProducts(row.category ?? ""); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      await supabase.from("bulk_discount_rules").update({ category: form.category, min_quantity: form.min_quantity, discount_percentage: form.discount_percent, item_name: form.item_name }).eq("rule_id", editing.rule_id);
    } else {
      await supabase.from("bulk_discount_rules").insert([{ category: form.category, min_quantity: form.min_quantity, discount_percentage: form.discount_percent, item_name: form.item_name, is_active: true }]);
    }
    setSaving(false);
    setOpen(false);
    fetchRules();
  };

  const cols = columns.concat([
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
          <Pencil className="size-3.5" />
        </Button>
      ),
    } as ColumnDef<DiscountRule>,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.discountRules.title", locale)} description={t("admin.discountRules.desc", locale)} />

      <div className="flex justify-end">
        <Button onClick={openAdd}><Plus className="size-4" /> {t("admin.discountRules.addRule", locale)}</Button>
      </div>

      <DataTable columns={cols} data={rules} searchKey="name" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.discountRules.editRule", locale) : t("admin.discountRules.addRuleTitle", locale)}</DialogTitle>
            <DialogDescription>{t("admin.discountRules.dialogDesc", locale)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("admin.discountRules.category", locale)}</Label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.category}
                onChange={(e) => { const cat = e.target.value; setForm({ ...form, category: cat, item_name: "all" }); fetchProducts(cat); }}
              >
                <option value="">{t("admin.discountRules.selectCategory", locale)}</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_name}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>{t("admin.discountRules.minQuantity", locale)}</Label>
              <Input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("admin.discountRules.discountPercent", locale)}</Label>
              <Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("admin.discountRules.itemName", locale)}</Label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                disabled={!form.category}
              >
                <option value="all">ALL</option>
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_name}>
                    {p.product_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("app.cancel", locale)}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? t("crud.saveChanges", locale) : t("app.create", locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

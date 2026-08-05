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

const columns: ColumnDef<DamageRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
  },
  { header: "Product", cell: ({ row }) => row.original.products?.product_name ?? "—" },
  { accessorKey: "quantity", header: "Qty" },
  { accessorKey: "reason", header: "Reason" },
];

export default function DamagesPage() {
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
      alert(`Only ${product.current_stock} units in stock for ${product.product_name}.`);
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
      alert("Error: " + error.message);
      setSaving(false);
      return;
    }

    const { error: stockError } = await supabase.rpc("deduct_stock", {
      p_product_id: Number(form.product_id),
      p_quantity: qty,
      p_movement_type: "Damage",
      p_reference_id: damage?.id ?? null,
      p_reference_no: `DAM-${damage?.id ?? Date.now()}`,
      p_notes: form.reason || "Damaged stock",
      p_created_by: user?.id ?? null,
    });

    if (stockError) {
      alert("Damage recorded but stock deduction failed: " + stockError.message);
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
        <PageHeader title="Damaged Products" description="Record and track damaged stock" />
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-2" />
            Record Damage
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Damaged Stock</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Product</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} (Stock: {p.current_stock})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Reason</Label>
                <Input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Broken during delivery"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving || !form.product_id || !form.quantity}
              >
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                Record Damage
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

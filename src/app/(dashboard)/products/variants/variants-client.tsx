"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

interface Variant {
  id: string;
  product_id: string;
  name: string;
  additional_price: number;
  stock_quantity: number;
  products?: { name: string } | null;
}

export function VariantsClient({
  variants,
  products,
}: {
  variants: Variant[];
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Variant | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    name: "",
    additional_price: "0",
    stock_quantity: "0",
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      product_id: products[0]?.id ?? "",
      name: "",
      additional_price: "0",
      stock_quantity: "0",
    });
    setOpen(true);
  };

  const openEdit = (v: Variant) => {
    setEditing(v);
    setForm({
      product_id: v.product_id,
      name: v.name,
      additional_price: String(v.additional_price),
      stock_quantity: String(v.stock_quantity),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      product_id: form.product_id,
      name: form.name,
      additional_price: Number(form.additional_price),
      stock_quantity: Number(form.stock_quantity),
    };
    const res = editing
      ? await supabase.from("product_variants").update(payload).eq("id", editing.id)
      : await supabase.from("product_variants").insert([payload]);
    if (res.error) console.error(res.error);
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  const columns: ColumnDef<Variant>[] = [
    { accessorKey: "name", header: "Variant" },
    {
      header: "Product",
      cell: ({ row }) => row.original.products?.name ?? "—",
    },
    {
      accessorKey: "additional_price",
      header: "Additional Price",
      cell: ({ row }) => `৳${Number(row.original.additional_price).toFixed(2)}`,
    },
    { accessorKey: "stock_quantity", header: "Stock" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
          <Pencil className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add Variant
        </Button>
      </div>
      <DataTable columns={columns} data={variants} searchKey="name" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Variant" : "Add Variant"}</DialogTitle>
            <DialogDescription>
              Variants add options like size or color to a product.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Product</Label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Variant Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Red / Size M"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Additional Price</Label>
                <Input
                  type="number"
                  value={form.additional_price}
                  onChange={(e) => setForm({ ...form, additional_price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

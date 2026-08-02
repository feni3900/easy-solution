"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface Adjustment {
  id: string;
  quantity_change: number;
  reason: string | null;
  created_at: string;
  products?: { name: string } | null;
}

const columns: ColumnDef<Adjustment>[] = [
  {
    header: "Product",
    cell: ({ row }) => row.original.products?.name ?? "—",
  },
  {
    accessorKey: "quantity_change",
    header: "Change",
    cell: ({ row }) => {
      const q = Number(row.original.quantity_change);
      return (
        <Badge variant={q >= 0 ? "default" : "destructive"}>
          {q >= 0 ? "+" : ""}
          {q}
        </Badge>
      );
    },
  },
  { accessorKey: "reason", header: "Reason" },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
  },
];

export function AdjustmentsClient({
  adjustments,
  products,
}: {
  adjustments: Adjustment[];
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: products[0]?.id ?? "",
    quantity_change: "0",
    reason: "",
  });

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const qty = Number(form.quantity_change);
    if (qty !== 0) {
      const { error } = await supabase.from("stock_adjustments").insert([
        {
          product_id: form.product_id,
          quantity_change: qty,
          reason: form.reason,
        },
      ]);
      if (error) console.error(error);
    }
    setSaving(false);
    setForm({ ...form, quantity_change: "0", reason: "" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="max-w-lg space-y-4 rounded-lg border p-4">
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
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Quantity Change (+/-)</Label>
            <Input
              type="number"
              value={form.quantity_change}
              onChange={(e) =>
                setForm({ ...form, quantity_change: e.target.value })
              }
              placeholder="-2 or +5"
            />
          </div>
          <div className="grid gap-2">
            <Label>Reason</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Cycle count / loss"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || Number(form.quantity_change) === 0}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Apply Adjustment
        </Button>
      </div>

      <DataTable columns={columns} data={adjustments} searchKey="reason" />
    </div>
  );
}

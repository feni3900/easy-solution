"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeftRight, PackageMinus } from "lucide-react";

interface LedgerRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  transaction_type: string;
  quantity: number;
  unit_cost: number;
  date: string;
  note: string | null;
  products?: { name: string } | null;
  warehouses?: { name: string } | null;
  branches?: { name: string } | null;
}

const typeColors: Record<string, string> = {
  purchase: "bg-emerald-500/10 text-emerald-600",
  sale: "bg-red-500/10 text-red-600",
  return: "bg-blue-500/10 text-blue-600",
  transfer_in: "bg-violet-500/10 text-violet-600",
  transfer_out: "bg-violet-500/10 text-violet-600",
  damage: "bg-orange-500/10 text-orange-600",
  adjustment: "bg-slate-500/10 text-slate-600",
  opening: "bg-slate-500/10 text-slate-600",
};

const columns: ColumnDef<LedgerRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.date).toLocaleString(),
  },
  {
    header: "Product",
    cell: ({ row }) => row.original.products?.name ?? "—",
  },
  {
    accessorKey: "transaction_type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        className={`${typeColors[row.original.transaction_type] ?? ""} border-0 capitalize`}
      >
        {row.original.transaction_type.replace("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => {
      const q = Number(row.original.quantity);
      return (
        <span className={q < 0 ? "font-medium text-red-600" : "font-medium text-emerald-600"}>
          {q > 0 ? `+${q}` : q}
        </span>
      );
    },
  },
  { accessorKey: "note", header: "Note" },
  {
    header: "Warehouse",
    cell: ({ row }) => row.original.warehouses?.name ?? "—",
  },
];

export function InventoryClient({
  ledger,
  products,
  warehouses,
  variants,
}: {
  ledger: LedgerRow[];
  products: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  variants: { id: string; name: string; product_id: string }[];
}) {
  const router = useRouter();

  return (
    <Tabs defaultValue="ledger">
      <TabsList>
        <TabsTrigger value="ledger">Ledger</TabsTrigger>
        <TabsTrigger value="transfer">Stock Transfer</TabsTrigger>
        <TabsTrigger value="damage">Damaged Stock</TabsTrigger>
      </TabsList>

      <TabsContent value="ledger" className="mt-4 space-y-4">
        <DataTable
          columns={columns}
          data={ledger}
          searchKey="note"
          searchPlaceholder="Search ledger..."
        />
      </TabsContent>

      <TabsContent value="transfer" className="mt-4">
        <TransferForm
          products={products}
          warehouses={warehouses}
          variants={variants}
          onDone={() => router.refresh()}
        />
      </TabsContent>

      <TabsContent value="damage" className="mt-4">
        <DamageForm
          products={products}
          warehouses={warehouses}
          variants={variants}
          onDone={() => router.refresh()}
        />
      </TabsContent>
    </Tabs>
  );
}

function TransferForm({
  products,
  warehouses,
  variants,
  onDone,
}: {
  products: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  variants: { id: string; name: string; product_id: string }[];
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    variant_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    quantity: "1",
  });

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("stock_transfers").insert([
      {
        product_id: form.product_id,
        variant_id: form.variant_id || null,
        from_warehouse_id: form.from_warehouse_id,
        to_warehouse_id: form.to_warehouse_id,
        quantity: Number(form.quantity),
      },
    ]);
    if (error) console.error(error);
    setSaving(false);
    onDone();
  };

  return (
    <div className="max-w-lg space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ArrowLeftRight className="size-4" />
        Move stock between warehouses
      </div>
      <div className="grid gap-2">
        <Label>Product</Label>
        <select
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={form.product_id}
          onChange={(e) => {
            setForm({ ...form, product_id: e.target.value, variant_id: "" });
          }}
        >
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label>Variant (optional)</Label>
        <select
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={form.variant_id}
          onChange={(e) => setForm({ ...form, variant_id: e.target.value })}
        >
          <option value="">None</option>
          {variants
            .filter((v) => v.product_id === form.product_id)
            .map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>From Warehouse</Label>
          <select
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.from_warehouse_id}
            onChange={(e) => setForm({ ...form, from_warehouse_id: e.target.value })}
          >
            <option value="">Select</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>To Warehouse</Label>
          <select
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.to_warehouse_id}
            onChange={(e) => setForm({ ...form, to_warehouse_id: e.target.value })}
          >
            <option value="">Select</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
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
      <Button
        onClick={handleSave}
        disabled={
          saving ||
          !form.product_id ||
          !form.from_warehouse_id ||
          !form.to_warehouse_id ||
          form.from_warehouse_id === form.to_warehouse_id
        }
      >
        {saving && <Loader2 className="size-4 animate-spin" />}
        Transfer Stock
      </Button>
    </div>
  );
}

function DamageForm({
  products,
  warehouses,
  variants,
  onDone,
}: {
  products: { id: string; name: string }[];
  warehouses: { id: string; name: string }[];
  variants: { id: string; name: string; product_id: string }[];
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    variant_id: "",
    warehouse_id: "",
    quantity: "1",
    reason: "",
  });

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("damaged_products").insert([
      {
        product_id: form.product_id,
        variant_id: form.variant_id || null,
        warehouse_id: form.warehouse_id || null,
        quantity: Number(form.quantity),
        reason: form.reason,
      },
    ]);
    if (error) console.error(error);
    setSaving(false);
    onDone();
  };

  return (
    <div className="max-w-lg space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <PackageMinus className="size-4" />
        Record damaged stock
      </div>
      <div className="grid gap-2">
        <Label>Product</Label>
        <select
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={form.product_id}
          onChange={(e) => setForm({ ...form, product_id: e.target.value, variant_id: "" })}
        >
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label>Variant (optional)</Label>
        <select
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={form.variant_id}
          onChange={(e) => setForm({ ...form, variant_id: e.target.value })}
        >
          <option value="">None</option>
          {variants
            .filter((v) => v.product_id === form.product_id)
            .map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Warehouse</Label>
          <select
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.warehouse_id}
            onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
          >
            <option value="">Select</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
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
      </div>
      <div className="grid gap-2">
        <Label>Reason</Label>
        <Input
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="e.g. Broken during delivery"
        />
      </div>
      <Button onClick={handleSave} disabled={saving || !form.product_id}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Record Damage
      </Button>
    </div>
  );
}

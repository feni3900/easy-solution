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
import { StatCard } from "@/components/dashboard/stat-card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Entry {
  id: string;
  transaction_type: "cash_in" | "cash_out";
  amount: number;
  date: string;
  note: string | null;
  branches?: { name: string }[] | { name: string } | null;
}

const getName = (v: { name?: string }[] | { name?: string } | null | undefined) => {
  if (Array.isArray(v)) return v[0]?.name ?? "—";
  return v?.name ?? "—";
};

const columns: ColumnDef<Entry>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.date).toLocaleString(),
  },
  {
    accessorKey: "transaction_type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        variant={row.original.transaction_type === "cash_in" ? "default" : "destructive"}
        className="capitalize"
      >
        {row.original.transaction_type.replace("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `৳${Number(row.original.amount).toFixed(2)}`,
  },
  { accessorKey: "note", header: "Note" },
  { header: "Branch", cell: ({ row }) => getName(row.original.branches) },
];

export function CashBookClient({
  entries,
  branches,
  inTotal,
  outTotal,
}: {
  entries: Entry[];
  branches: { id: string; name: string }[];
  inTotal: number;
  outTotal: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    transaction_type: "cash_in",
    amount: "0",
    branch_id: branches[0]?.id ?? "",
    note: "",
  });

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("cash_book").insert([
      {
        transaction_type: form.transaction_type,
        amount: Number(form.amount),
        branch_id: form.branch_id || null,
        note: form.note,
      },
    ]);
    if (error) console.error(error);
    setSaving(false);
    setForm({ ...form, amount: "0", note: "" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Cash In"
          value={`৳${inTotal.toFixed(2)}`}
          icon={<ArrowDownRight className="size-4" />}
        />
        <StatCard
          title="Total Cash Out"
          value={`৳${outTotal.toFixed(2)}`}
          icon={<ArrowUpRight className="size-4" />}
          variant="destructive"
        />
        <StatCard
          title="Net Cash"
          value={`৳${(inTotal - outTotal).toFixed(2)}`}
        />
      </div>

      <div className="max-w-lg space-y-4 rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Type</Label>
            <select
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.transaction_type}
              onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}
            >
              <option value="cash_in">Cash In</option>
              <option value="cash_out">Cash Out</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Branch</Label>
            <select
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Note</Label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || Number(form.amount) === 0}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Add Entry
        </Button>
      </div>

      <DataTable columns={columns} data={entries} searchKey="note" />
    </div>
  );
}

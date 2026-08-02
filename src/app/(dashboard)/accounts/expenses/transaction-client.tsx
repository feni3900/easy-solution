"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/dashboard/stat-card";
import { Loader2, Plus } from "lucide-react";

interface Entry {
  id: string;
  [key: string]: unknown;
}

export function TransactionClient({
  table,
  title,
  entries,
  branches,
  total,
  description,
}: {
  table: "expenses" | "income";
  title: string;
  entries: Entry[];
  branches: { id: string; name: string }[];
  total: number;
  description: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "",
    amount: "0",
    branch_id: branches[0]?.id ?? "",
    description_text: "",
  });

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from(table).insert([
      {
        [table === "expenses" ? "expense_type" : "income_type"]: form.type,
        amount: Number(form.amount),
        branch_id: form.branch_id || null,
        description: form.description_text,
      },
    ]);
    if (error) console.error(error);
    setSaving(false);
    setForm({ ...form, amount: "0", type: "", description_text: "" });
    router.refresh();
  };

  const columns: ColumnDef<Entry>[] = [
    {
      header: "Type",
      cell: ({ row }) => String(row.original[table === "expenses" ? "expense_type" : "income_type"] ?? "—"),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => `৳${Number(row.original.amount).toFixed(2)}`,
    },
    { header: "Description", cell: ({ row }) => String(row.original.description ?? "—") },
    {
      header: "Date",
      cell: ({ row }) => new Date(String(row.original.date)).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <StatCard
        title={`Total ${title}s`}
        value={`৳${total.toFixed(2)}`}
        description={description}
      />

      <div className="max-w-lg space-y-4 rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>{title} Type</Label>
            <Input
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder={table === "expenses" ? "e.g. Rent, Salary" : "e.g. Interest"}
            />
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
            <Label>Description</Label>
            <Input
              value={form.description_text}
              onChange={(e) => setForm({ ...form, description_text: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || Number(form.amount) === 0 || !form.type}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add {title}
        </Button>
      </div>

      <DataTable columns={columns} data={entries} searchKey="description" />
    </div>
  );
}

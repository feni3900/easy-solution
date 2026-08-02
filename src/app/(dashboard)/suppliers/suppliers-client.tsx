"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Loader2, Wallet } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  mobile: string | null;
  company: string | null;
  email: string | null;
  address: string | null;
  due_balance: number;
  group_id: string | null;
  status: string;
}

export function SuppliersClient({
  suppliers,
  groups,
  totals,
}: {
  suppliers: Supplier[];
  groups: { id: string; name: string }[];
  totals: Record<string, { total: number; paid: number }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState("");
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    company: "",
    email: "",
    address: "",
    group_id: "",
    status: "active",
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", mobile: "", company: "", email: "", address: "", group_id: "", status: "active" });
    setOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      mobile: s.mobile ?? "",
      company: s.company ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
      group_id: s.group_id ?? "",
      status: s.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name,
      mobile: form.mobile || null,
      company: form.company || null,
      email: form.email || null,
      address: form.address || null,
      group_id: form.group_id || null,
      status: form.status,
    };
    const res = editing
      ? await supabase.from("suppliers").update(payload).eq("id", editing.id)
      : await supabase.from("suppliers").insert([payload]);
    if (res.error) console.error(res.error);
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  const openPay = (s: Supplier) => {
    setPaying(s);
    setPayAmount("");
    setPayNote("");
    setPayError("");
  };

  const handlePay = async () => {
    if (!paying) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError("Enter a valid payment amount.");
      return;
    }
    setPaySaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("record_supplier_payment", {
      p_supplier_id: paying.id,
      p_amount: amount,
      p_date: new Date().toISOString(),
      p_note: payNote || `Payment to ${paying.name}`,
    });
    if (error) {
      setPayError(error.message);
      setPaySaving(false);
      return;
    }
    setPaySaving(false);
    setPaying(null);
    router.refresh();
  };

  const columns: ColumnDef<Supplier>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "company", header: "Company" },
    { accessorKey: "mobile", header: "Mobile" },
    {
      header: "Total Purchase",
      cell: ({ row }) => (
        <span>৳{Number(totals[row.original.id]?.total ?? 0).toFixed(2)}</span>
      ),
    },
    {
      header: "Paid",
      cell: ({ row }) => (
        <span className="font-medium text-emerald-600">
          ৳{Math.max(0, Number(totals[row.original.id]?.total ?? 0) - Number(row.original.due_balance ?? 0)).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Due",
      cell: ({ row }) => (
        <span className="font-medium text-destructive">
          ৳{Number(row.original.due_balance ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="Record payment"
            onClick={() => openPay(row.original)}
          >
            <Wallet className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add Supplier
        </Button>
      </div>
      <DataTable columns={columns} data={suppliers} searchKey="name" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
            <DialogDescription>Supplier profile used in purchases and ledgers.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Supplier Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Mobile</Label>
                <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Group</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.group_id}
                  onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                >
                  <option value="">None</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Pay {paying?.name} — current due ৳{Number(paying?.due_balance ?? 0).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label>Note</Label>
              <Input value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="Optional" />
            </div>
            {payError && <p className="text-xs text-destructive">{payError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(null)}>Cancel</Button>
            <Button onClick={handlePay} disabled={paySaving || !payAmount}>
              {paySaving && <Loader2 className="size-4 animate-spin" />}
              Save Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

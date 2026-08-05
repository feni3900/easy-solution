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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface CourierService {
  id: string;
  name: string;
  contact_phone: string;
  cost_per_kg: number;
  is_active: boolean;
}

const columns: ColumnDef<CourierService>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "contact_phone", header: "Phone" },
  {
    accessorKey: "cost_per_kg",
    header: "Cost/kg",
    cell: ({ row }) => `৳${Number(row.original.cost_per_kg).toFixed(2)}`,
  },
];

export default function WebStoreCouriersPage() {
  const [couriers, setCouriers] = useState<CourierService[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourierService | null>(null);
  const [form, setForm] = useState({ name: "", contact_phone: "", cost_per_kg: 0 });
  const [saving, setSaving] = useState(false);

  const fetchCouriers = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("courier_services").select("*").order("name");
    setCouriers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCouriers(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", contact_phone: "", cost_per_kg: 0 }); setOpen(true); };
  const openEdit = (row: CourierService) => { setEditing(row); setForm({ name: row.name, contact_phone: row.contact_phone, cost_per_kg: row.cost_per_kg }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      await supabase.from("courier_services").update(form).eq("id", editing.id);
    } else {
      await supabase.from("courier_services").insert([{ ...form, is_active: true }]);
    }
    setSaving(false);
    setOpen(false);
    fetchCouriers();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("courier_services").delete().eq("id", id);
    fetchCouriers();
  };

  const cols = columns.concat([
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.original.id)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      ),
    } as ColumnDef<CourierService>,
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
      <PageHeader title="Courier Services" description="Manage delivery partners" />

      <div className="flex justify-end">
        <Button onClick={openAdd}><Plus className="size-4" /> Add Courier</Button>
      </div>

      <DataTable columns={cols} data={couriers} searchKey="name" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Courier" : "Add Courier"}</DialogTitle>
            <DialogDescription>Configure courier service details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Contact Phone</Label>
              <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Cost per kg</Label>
              <Input type="number" value={form.cost_per_kg} onChange={(e) => setForm({ ...form, cost_per_kg: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

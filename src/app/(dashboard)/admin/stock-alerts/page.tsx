"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
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
import { Plus, Pencil, Loader2 } from "lucide-react";

interface StockAlertRule {
  id: string;
  name: string;
  threshold: number;
  notify_email: string;
  is_active: boolean;
  created_at: string;
}

const columns: ColumnDef<StockAlertRule>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "threshold", header: "Threshold" },
  { accessorKey: "notify_email", header: "Notify Email" },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "default" : "secondary"}>
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export default function AdminStockAlertsPage() {
  const [rules, setRules] = useState<StockAlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockAlertRule | null>(null);
  const [form, setForm] = useState({ name: "", threshold: 0, notify_email: "" });
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("stock_alert_rules").select("*").order("name");
    setRules(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", threshold: 0, notify_email: "" }); setOpen(true); };
  const openEdit = (row: StockAlertRule) => { setEditing(row); setForm({ name: row.name, threshold: row.threshold, notify_email: row.notify_email }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      await supabase.from("stock_alert_rules").update(form).eq("id", editing.id);
    } else {
      await supabase.from("stock_alert_rules").insert([{ ...form, is_active: true }]);
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
    } as ColumnDef<StockAlertRule>,
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
      <PageHeader title="Stock Alert Rules" description="Configure low-stock notification thresholds" />

      <div className="flex justify-end">
        <Button onClick={openAdd}><Plus className="size-4" /> Add Rule</Button>
      </div>

      <DataTable columns={cols} data={rules} searchKey="name" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Alert Rule" : "Add Alert Rule"}</DialogTitle>
            <DialogDescription>Set up stock level alerts.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Low Stock Warning, Critical Items" />
            </div>
            <div className="grid gap-2">
              <Label>Threshold</Label>
              <Input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Notify Email</Label>
              <Input type="email" value={form.notify_email} onChange={(e) => setForm({ ...form, notify_email: e.target.value })} />
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

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
import { Plus, Pencil, Loader2 } from "lucide-react";
import { getClientLocale, t, fmtMoney } from "@/lib/i18n";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  previous_due: number;
  current_due: number;
  group_id: string | null;
  status: string;
}

interface Group {
  id: string;
  name: string;
  discount_percent: number;
}

export function CustomersClient({
  customers,
  groups,
}: {
  customers: Customer[];
  groups: Group[];
}) {
  const router = useRouter();
  const locale = getClientLocale();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    group_id: "",
    status: "active",
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", mobile: "", email: "", address: "", group_id: "", status: "active" });
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      mobile: c.mobile,
      email: c.email ?? "",
      address: c.address ?? "",
      group_id: c.group_id ?? "",
      status: c.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name,
      mobile: form.mobile,
      email: form.email || null,
      address: form.address || null,
      group_id: form.group_id || null,
      status: form.status,
    };
    const res = editing
      ? await supabase.from("customers").update(payload).eq("id", editing.id)
      : await supabase.from("customers").insert([payload]);
    if (res.error) console.error(res.error);
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: t("app.name", locale) },
    { accessorKey: "mobile", header: t("customers.mobile", locale) },
    { accessorKey: "email", header: t("customers.email", locale) },
    {
      accessorKey: "previous_due",
      header: t("customers.previousDue", locale),
      cell: ({ row }) => fmtMoney(Number(row.original.previous_due), locale),
    },
    {
      accessorKey: "current_due",
      header: t("customers.currentDue", locale),
      cell: ({ row }) => (
        <span className="font-medium text-destructive">
          {fmtMoney(Number(row.original.current_due), locale)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("app.status", locale),
      cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>,
    },
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
          {t("customers.add", locale)}
        </Button>
      </div>
      <DataTable columns={columns} data={customers} searchKey="name" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("customers.edit", locale) : t("customers.add", locale)}</DialogTitle>
            <DialogDescription>{t("customers.mobileRequired", locale)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("customers.customerName", locale)} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("customers.mobile", locale)} *</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="017..."
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("customers.email", locale)}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{t("customers.group", locale)}</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.group_id}
                  onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                >
                  <option value="">{t("app.none", locale)}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.discount_percent}%)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>{t("app.status", locale)}</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">{t("app.active", locale)}</option>
                  <option value="inactive">{t("app.inactive", locale)}</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("app.address", locale)}</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("app.cancel", locale)}</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.mobile}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? t("customers.saveChanges", locale) : t("app.create", locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

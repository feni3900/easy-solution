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
import { CURRENCIES } from "@/lib/constants";
import { Plus, Pencil, Loader2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  country: string | null;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
}

const columns = (onEdit: (c: Company) => void): ColumnDef<Company>[] => [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "country", header: "Country" },
  { accessorKey: "currency", header: "Currency" },
  { accessorKey: "phone", header: "Phone" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "active" ? "default" : "secondary"}
        className="capitalize"
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
        <Pencil className="size-3.5" />
      </Button>
    ),
  },
];

const emptyForm = {
  name: "",
  country: "",
  currency: "BDT",
  phone: "",
  email: "",
  address: "",
  status: "active",
};

export function CompaniesClient({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditing(c);
    setForm({
      name: c.name,
      country: c.country ?? "",
      currency: c.currency,
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      status: c.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      await supabase.from("companies").update(form).eq("id", editing.id);
    } else {
      await supabase.from("companies").insert([form]);
    }
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add Company
        </Button>
      </div>
      <DataTable
        columns={columns(openEdit)}
        data={companies}
        searchKey="name"
        searchPlaceholder="Search companies..."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Company" : "Add Company"}</DialogTitle>
            <DialogDescription>
              Company-level settings used across branches and reports.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Company Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Maruf Enterprise"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="Bangladesh"
                />
              </div>
              <div className="grid gap-2">
                <Label>Currency</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

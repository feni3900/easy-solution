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
import { Plus, Pencil, Loader2 } from "lucide-react";

interface RolePermission {
  id: string;
  role: string;
  permission: string;
  description: string;
}

const columns: ColumnDef<RolePermission>[] = [
  { accessorKey: "role", header: "Role" },
  { accessorKey: "permission", header: "Permission" },
  { accessorKey: "description", header: "Description" },
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RolePermission | null>(null);
  const [form, setForm] = useState({ role: "", permission: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("roles_permissions").select("*").order("role");
    setRoles(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const openAdd = () => { setEditing(null); setForm({ role: "", permission: "", description: "" }); setOpen(true); };
  const openEdit = (row: RolePermission) => { setEditing(row); setForm({ role: row.role, permission: row.permission, description: row.description }); setOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      await supabase.from("roles_permissions").update(form).eq("id", editing.id);
    } else {
      await supabase.from("roles_permissions").insert([form]);
    }
    setSaving(false);
    setOpen(false);
    fetchRoles();
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
    } as ColumnDef<RolePermission>,
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
      <PageHeader title="Roles & Permissions" description="Manage user roles and access permissions" />

      <div className="flex justify-end">
        <Button onClick={openAdd}><Plus className="size-4" /> Add Role</Button>
      </div>

      <DataTable columns={cols} data={roles} searchKey="role" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Role" : "Add Role"}</DialogTitle>
            <DialogDescription>Define role and permission details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Role</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Permission</Label>
              <Input value={form.permission} onChange={(e) => setForm({ ...form, permission: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

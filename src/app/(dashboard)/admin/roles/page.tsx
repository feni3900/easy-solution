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
import { getClientLocale, t } from "@/lib/i18n";

interface RolePermission {
  id: string;
  role: string;
  permission: string;
  description: string;
}

const makeColumns = (locale: "en" | "bn"): ColumnDef<RolePermission>[] => [
  { accessorKey: "role", header: t("admin.roles.role", locale) },
  { accessorKey: "permission", header: t("admin.roles.permission", locale) },
  { accessorKey: "description", header: t("admin.roles.description", locale) },
];

export default function AdminRolesPage() {
  const locale = getClientLocale();
  const columns = makeColumns(locale);
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
      <PageHeader title={t("nav.admin.roles", locale)} description={t("admin.roles.desc", locale)} />

      <div className="flex justify-end">
        <Button onClick={openAdd}><Plus className="size-4" /> {t("admin.roles.addRole", locale)}</Button>
      </div>

      <DataTable columns={cols} data={roles} searchKey="role" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.roles.editRole", locale) : t("admin.roles.addRole", locale)}</DialogTitle>
            <DialogDescription>{t("admin.roles.dialogDesc", locale)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("admin.roles.role", locale)}</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("admin.roles.permission", locale)}</Label>
              <Input value={form.permission} onChange={(e) => setForm({ ...form, permission: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>{t("admin.roles.description", locale)}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("app.cancel", locale)}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? t("crud.saveChanges", locale) : t("app.create", locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

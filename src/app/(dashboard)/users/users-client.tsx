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
import { ROLES } from "@/lib/constants";

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  mobile: string | null;
  status: string;
  role_id: string;
  branch_id: string | null;
  roles?: { name: string }[] | { name: string } | null;
  branches?: { name: string }[] | { name: string } | null;
}

const getName = (v: { name?: string }[] | { name?: string } | null | undefined) => {
  if (Array.isArray(v)) return v[0]?.name ?? "—";
  return v?.name ?? "—";
};

const roleLabel = (name: string) => {
  const r = ROLES.find((r) => r.value === name);
  return r?.label ?? name.replace("_", " ");
};

export function UsersClient({
  users,
  roles,
  branches,
}: {
  users: UserRow[];
  roles: { id: string; name: string; description: string }[];
  branches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    mobile: "",
    role_id: "",
    branch_id: "",
    status: "active",
  });

  const splitName = (full: string) => {
    const trimmed = full.trim();
    const first = trimmed.split(" ")[0] ?? "";
    const last = trimmed.slice(first.length).trim();
    return { first_name: first, last_name: last };
  };

  const openAdd = () => {
    setEditing(null);
    setErrorMsg("");
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      mobile: "",
      role_id: roles[0]?.id ?? "",
      branch_id: branches[0]?.id ?? "",
      status: "active",
    });
    setOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditing(u);
    setErrorMsg("");
    const split = splitName(u.full_name);
    setForm({
      first_name: split.first_name,
      last_name: split.last_name,
      email: u.email ?? "",
      password: "",
      mobile: u.mobile ?? "",
      role_id: u.role_id,
      branch_id: u.branch_id ?? "",
      status: u.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      full_name: `${form.first_name} ${form.last_name}`.trim(),
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || null,
      mobile: form.mobile || null,
      role_id: form.role_id,
      branch_id: form.branch_id || null,
      status: form.status,
    };

    let res;
    if (editing) {
      res = await supabase.from("users").update(payload).eq("id", editing.id);
    } else {
      const http = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, password: form.password }),
      });
      const json = await http.json().catch(() => ({}));
      if (!http.ok) {
        setErrorMsg(json.error ?? "Failed to create user.");
        setSaving(false);
        return;
      }
      res = { error: null };
    }

    if (res.error) {
      setErrorMsg(res.error.message ?? "Failed to save user.");
      setSaving(false);
      return;
    }
    setErrorMsg("");
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  const columns: ColumnDef<UserRow>[] = [
    { accessorKey: "full_name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {roleLabel(getName(row.original.roles))}
        </Badge>
      ),
    },
    { header: "Branch", cell: ({ row }) => getName(row.original.branches) },
    {
      accessorKey: "status",
      header: "Status",
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
          Add User
        </Button>
      </div>
      <DataTable columns={columns} data={users} searchKey="full_name" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the user profile."
                : "Creates the Supabase Auth account and profile in one step."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Last Name *</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              {!editing && (
                <div className="grid gap-2">
                  <Label>Password *</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              {editing && (
                <div className="grid gap-2">
                  <Label>Mobile</Label>
                  <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                </div>
              )}
            </div>
            {!editing && (
              <div className="grid gap-2">
                <Label>Mobile</Label>
                <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Role</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {roleLabel(r.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Branch</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                >
                  <option value="">None</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            {errorMsg && (
              <p className="w-full text-xs text-destructive">{errorMsg}</p>
            )}
            <Button onClick={handleSave} disabled={saving || !form.first_name || !form.last_name || !form.email || (!editing && !form.password)}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

interface Page {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const buildColumns = (onEdit: (p: Page) => void, onDelete: (p: Page) => void): ColumnDef<Page>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => <span className="font-mono text-xs">/{row.original.slug}</span>,
  },
  {
    accessorKey: "is_published",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={row.original.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-600"} variant="outline">
        {row.original.is_published ? "Published" : "Draft"}
      </Badge>
    ),
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => new Date(row.original.updated_at).toLocaleDateString(),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(row.original)}>
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>
    ),
  },
];

export function PagesClient({ pages }: { pages: Page[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState({ slug: "", title: "", body: "", is_published: true });

  const openNew = () => {
    setEditing(null);
    setForm({ slug: "", title: "", body: "", is_published: true });
    setOpen(true);
  };

  const openEdit = (p: Page) => {
    setEditing(p);
    setForm({ slug: p.slug, title: p.title, body: p.body ?? "", is_published: p.is_published });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      body: form.body.trim() || null,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase.from("ecommerce_pages").update(payload).eq("id", editing.id)
      : await supabase.from("ecommerce_pages").insert(payload);
    if (error) {
      console.error(error);
      setSaving(false);
      return;
    }
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async (p: Page) => {
    if (!confirm(`Delete page "${p.title}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("ecommerce_pages").delete().eq("id", p.id);
    if (error) console.error(error);
    router.refresh();
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="size-4" />
          New Page
        </Button>
      </div>

      <DataTable columns={buildColumns(openEdit, handleDelete)} data={pages} searchKey="title" searchPlaceholder="Search pages..." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Page" : "New Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. About Us" />
            </div>
            <div className="grid gap-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. about" disabled={!!editing} />
            </div>
            <div className="grid gap-2">
              <Label>Content (HTML)</Label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={8}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              Published
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              {editing ? "Save Changes" : "Create Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

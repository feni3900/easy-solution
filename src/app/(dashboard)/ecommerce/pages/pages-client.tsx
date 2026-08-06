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
import { t, translateWithVars } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface Page {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const makeColumns = (locale: Locale, onEdit: (p: Page) => void, onDelete: (p: Page) => void): ColumnDef<Page>[] => [
  {
    accessorKey: "title",
    header: t("webstore.pages.titleColumn", locale),
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
  },
  {
    accessorKey: "slug",
    header: t("webstore.pages.slug", locale),
    cell: ({ row }) => <span className="font-mono text-xs">/{row.original.slug}</span>,
  },
  {
    accessorKey: "is_published",
    header: t("app.status", locale),
    cell: ({ row }) => (
      <Badge className={row.original.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-600"} variant="outline">
        {row.original.is_published ? t("webstore.pages.published", locale) : t("webstore.pages.draft", locale)}
      </Badge>
    ),
  },
  {
    accessorKey: "updated_at",
    header: t("webstore.pages.updated", locale),
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

export function PagesClient({ pages, locale }: { pages: Page[]; locale: Locale }) {
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
    if (!confirm(translateWithVars(t("webstore.pages.deleteConfirm", locale), { title: p.title }))) return;
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
          {t("webstore.pages.newPage", locale)}
        </Button>
      </div>

      <DataTable columns={makeColumns(locale, openEdit, handleDelete)} data={pages} searchKey="title" searchPlaceholder={t("webstore.pages.search", locale)} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("webstore.pages.editPage", locale) : t("webstore.pages.newPage", locale)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>{t("webstore.pages.titleColumn", locale)}</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("webstore.pages.titlePh", locale)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("webstore.pages.slug", locale)}</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={t("webstore.pages.slugPh", locale)} disabled={!!editing} />
            </div>
            <div className="grid gap-2">
              <Label>{t("webstore.pages.content", locale)}</Label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={8}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              {t("webstore.pages.published", locale)}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("app.cancel", locale)}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              {editing ? t("crud.saveChanges", locale) : t("webstore.pages.createPage", locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

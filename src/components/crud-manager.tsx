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

export interface CrudField {
  name: string;
  label: string;
  type?: "text" | "select" | "textarea";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

export interface CrudConfig<T> {
  table: string;
  title: string;
  description: string;
  searchKey: string;
  columns: ColumnDef<T>[];
  fields: CrudField[];
  toForm: (row: T) => Record<string, unknown>;
  defaultForm: Record<string, unknown>;
}

export function CrudManager<T extends { id: string }>({
  config,
  rows,
  parentLabel,
}: {
  config: CrudConfig<T>;
  rows: T[];
  parentLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(config.defaultForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(config.defaultForm);
    setOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setForm(config.toForm(row));
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    if (editing) {
      await supabase.from(config.table).update(form).eq("id", editing.id);
    } else {
      await supabase.from(config.table).insert([form]);
    }
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  const cols = config.columns.concat([
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
          <Pencil className="size-3.5" />
        </Button>
      ),
    } as ColumnDef<T>,
  ]);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add {config.title}
        </Button>
      </div>
      <DataTable columns={cols} data={rows} searchKey={config.searchKey} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${config.title}` : `Add ${config.title}`}
              {parentLabel ? ` — ${parentLabel}` : ""}
            </DialogTitle>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {config.fields.map((field) => (
              <div key={field.name} className="grid gap-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                {field.type === "select" ? (
                  <select
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={String(form[field.name] ?? "")}
                    onChange={(e) =>
                      setForm({ ...form, [field.name]: e.target.value })
                    }
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={String(form[field.name] ?? "")}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      setForm({ ...form, [field.name]: e.target.value })
                    }
                  />
                )}
              </div>
            ))}
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

export { Badge };

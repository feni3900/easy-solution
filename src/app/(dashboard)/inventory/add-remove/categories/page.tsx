"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";

interface Category {
  category_id: number;
  category_name: string;
  parent_category_id: number | null;
  is_active: boolean;
}

export default function AddRemoveCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("*").order("category_name");
    setCategories(data ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleAdd = async () => {
    if (!name.trim()) {
      alert("Category name is required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("categories")
      .select("category_id")
      .ilike("category_name", name.trim());
    if (existing && existing.length > 0) {
      setSaving(false);
      alert(`Category "${name.trim()}" already exists.`);
      return;
    }
    const { error } = await supabase.from("categories").insert({ category_name: name.trim(), is_active: true });
    setSaving(false);
    if (error) {
      alert("Error adding category: " + error.message);
      return;
    }
    setName("");
    await load();
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.category_name}"?`)) return;
    setDeletingId(cat.category_id);
    const supabase = createClient();
    const { error } = await supabase.from("categories").delete().eq("category_id", cat.category_id);
    setDeletingId(null);
    if (error) {
      alert("Error deleting category: " + error.message);
      return;
    }
    setCategories((prev) => prev.filter((x) => x.category_id !== cat.category_id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Add and remove categories" />

      <div className="flex items-end gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-1 flex-1 max-w-sm">
          <Label>Category Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electronics" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        </div>
        <Button onClick={handleAdd} disabled={saving}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
          Add Category
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Parent</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-muted-foreground">
                  <FolderOpen className="size-8 mx-auto mb-2 opacity-50" />
                  <p>No categories yet.</p>
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.category_id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.category_name}</td>
                  <td className="p-3 text-muted-foreground">
                    {categories.find((x) => x.category_id === c.parent_category_id)?.category_name ?? "—"}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" disabled={deletingId === c.category_id} onClick={() => handleDelete(c)}>
                      {deletingId === c.category_id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

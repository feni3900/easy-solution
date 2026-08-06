"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Loader2, Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";

interface Category {
  category_id: number;
  category_name: string;
}

interface Unit {
  id: string;
  name: string;
  symbol: string | null;
  category_id: number | null;
  status: string;
}

export default function AddRemoveUnitsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<number>(0);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [c, u] = await Promise.all([
      supabase.from("categories").select("category_id, category_name").eq("is_active", true).order("category_name"),
      supabase.from("units").select("*").order("name"),
    ]);
    setCategories(c.data ?? []);
    setUnits(u.data ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleAdd = async () => {
    if (!categoryId) {
      alert("Please select a category first.");
      return;
    }
    if (!name.trim()) {
      alert("Unit name is required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("units")
      .select("id")
      .eq("category_id", categoryId)
      .ilike("name", name.trim());
    if (existing && existing.length > 0) {
      setSaving(false);
      alert(`Unit "${name.trim()}" already exists for this category.`);
      return;
    }
    const { error } = await supabase
      .from("units")
      .insert({ name: name.trim(), symbol: symbol.trim() || null, category_id: categoryId, status: "active" });
    setSaving(false);
    if (error) {
      alert("Error adding unit: " + error.message);
      return;
    }
    setName("");
    setSymbol("");
    await load();
  };

  const handleDelete = async (u: Unit) => {
    if (!confirm(`Delete unit "${u.name}"?`)) return;
    setDeletingId(u.id);
    const supabase = createClient();
    const { error } = await supabase.from("units").delete().eq("id", u.id);
    setDeletingId(null);
    if (error) {
      alert("Error deleting unit: " + error.message);
      return;
    }
    setUnits((prev) => prev.filter((x) => x.id !== u.id));
  };

  const filtered = categoryId ? units.filter((u) => u.category_id === categoryId) : units;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Units" description="Add and remove units by category" />

      <div className="flex items-end gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-1 w-64">
          <Label>Category *</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value={0}>Select Category</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1 flex-1 max-w-sm">
          <Label>Unit Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. pcs, kg, box" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        </div>
        <div className="space-y-1 w-24">
          <Label>Symbol</Label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g. pc" />
        </div>
        <Button onClick={handleAdd} disabled={saving || !categoryId}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
          Add Unit
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Symbol</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                  <Weight className="size-8 mx-auto mb-2 opacity-50" />
                  <p>{categoryId ? "No units for this category yet." : "Select a category to see its units."}</p>
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {categories.find((c) => c.category_id === u.category_id)?.category_name ?? "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.symbol ?? "—"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" disabled={deletingId === u.id} onClick={() => handleDelete(u)}>
                      {deletingId === u.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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

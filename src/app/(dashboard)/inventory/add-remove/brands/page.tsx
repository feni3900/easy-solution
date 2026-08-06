"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";

interface Brand {
  brand_id: number;
  brand_name: string;
  is_active: boolean;
}

export default function AddRemoveBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("brands").select("*").order("brand_name");
    setBrands(data ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleAdd = async () => {
    if (!name.trim()) {
      alert("Brand name is required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("brands")
      .select("brand_id")
      .ilike("brand_name", name.trim());
    if (existing && existing.length > 0) {
      setSaving(false);
      alert(`Brand "${name.trim()}" already exists.`);
      return;
    }
    const { error } = await supabase.from("brands").insert({ brand_name: name.trim(), is_active: true });
    setSaving(false);
    if (error) {
      alert("Error adding brand: " + error.message);
      return;
    }
    setName("");
    await load();
  };

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`Delete brand "${brand.brand_name}"?`)) return;
    setDeletingId(brand.brand_id);
    const supabase = createClient();
    const { error } = await supabase.from("brands").delete().eq("brand_id", brand.brand_id);
    setDeletingId(null);
    if (error) {
      alert("Error deleting brand: " + error.message);
      return;
    }
    setBrands((prev) => prev.filter((x) => x.brand_id !== brand.brand_id));
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
      <PageHeader title="Brands" description="Add and remove brands" />

      <div className="flex items-end gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-1 flex-1 max-w-sm">
          <Label>Brand Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Samsung" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        </div>
        <Button onClick={handleAdd} disabled={saving}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
          Add Brand
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-12 text-center text-muted-foreground">
                  <Tag className="size-8 mx-auto mb-2 opacity-50" />
                  <p>No brands yet.</p>
                </td>
              </tr>
            ) : (
              brands.map((b) => (
                <tr key={b.brand_id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{b.brand_name}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {b.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" disabled={deletingId === b.brand_id} onClick={() => handleDelete(b)}>
                      {deletingId === b.brand_id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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

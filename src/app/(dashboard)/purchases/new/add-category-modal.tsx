"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onClose: () => void;
  onAdded: (category: { category_id: number; category_name: string }) => void;
}

export default function AddCategoryModal({ onClose, onAdded }: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const handleSave = async () => {
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
    const { data, error } = await supabase
      .from("categories")
      .insert({ category_name: name.trim(), is_active: true })
      .select("category_id, category_name")
      .single();

    setSaving(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    onAdded(data);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Category</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Category Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electronics" autoFocus onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {saving ? "Saving..." : "Add Category"}
          </Button>
        </div>
      </div>
    </div>
  );
}

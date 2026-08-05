"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onClose: () => void;
  onAdded: (brand: { brand_id: number; brand_name: string }) => void;
}

export default function AddBrandModal({ onClose, onAdded }: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Brand name is required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("brands")
      .insert({ brand_name: name.trim(), is_active: true })
      .select("brand_id, brand_name")
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
          <h2 className="text-lg font-semibold">Add Brand</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Brand Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Samsung" autoFocus onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {saving ? "Saving..." : "Add Brand"}
          </Button>
        </div>
      </div>
    </div>
  );
}

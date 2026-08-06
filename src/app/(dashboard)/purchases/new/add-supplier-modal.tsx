"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  onClose: () => void;
  onAdded: (supplier: { supplier_id: number; supplier_name: string; company_name: string | null; phone: string }) => void;
}

export default function AddSupplierModal({ onClose, onAdded }: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      alert("Supplier name and phone are required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        supplier_name: name.trim(),
        phone: phone.trim(),
        company_name: company.trim() || null,
        address: address.trim() || null,
      })
      .select("supplier_id, supplier_name, company_name, phone")
      .single();

    setSaving(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    onAdded(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-lg border bg-card p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Supplier</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Supplier Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ABC Traders" />
          </div>
          <div className="space-y-1">
            <Label>Phone *</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 01700-000000" />
          </div>
          <div className="space-y-1">
            <Label>Company Name</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" className="h-16 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {saving ? "Saving..." : "Add Supplier"}
          </Button>
        </div>
      </div>
    </div>
  );
}

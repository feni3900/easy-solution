"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  phone: string;
  company_name: string | null;
  address: string | null;
}

export default function AddRemoveSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("suppliers").select("*").order("supplier_name");
    setSuppliers(data ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const handleAdd = async () => {
    if (!name.trim()) {
      alert("Supplier name is required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("suppliers")
      .select("supplier_id")
      .ilike("supplier_name", name.trim());
    if (existing && existing.length > 0) {
      setSaving(false);
      alert(`Supplier "${name.trim()}" already exists.`);
      return;
    }
    const { error } = await supabase.from("suppliers").insert({
      supplier_name: name.trim(),
      phone: phone.trim(),
      company_name: companyName.trim() || null,
      address: address.trim() || null,
    });
    setSaving(false);
    if (error) {
      alert("Error adding supplier: " + error.message);
      return;
    }
    setName("");
    setPhone("");
    setCompanyName("");
    setAddress("");
    await load();
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Delete supplier "${s.supplier_name}"?`)) return;
    setDeletingId(s.supplier_id);
    const supabase = createClient();
    const { error } = await supabase.from("suppliers").delete().eq("supplier_id", s.supplier_id);
    setDeletingId(null);
    if (error) {
      alert("Error deleting supplier: " + error.message);
      return;
    }
    setSuppliers((prev) => prev.filter((x) => x.supplier_id !== s.supplier_id));
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
      <PageHeader title="Suppliers" description="Add and remove suppliers" />

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Supplier Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ABC Traders" />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
          <div className="space-y-1">
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="mt-3">
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium">Company</th>
              <th className="p-3 font-medium">Address</th>
              <th className="p-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-muted-foreground">
                  <Truck className="size-8 mx-auto mb-2 opacity-50" />
                  <p>No suppliers yet.</p>
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.supplier_id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{s.supplier_name}</td>
                  <td className="p-3 text-muted-foreground">{s.phone}</td>
                  <td className="p-3 text-muted-foreground">{s.company_name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{s.address ?? "—"}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" disabled={deletingId === s.supplier_id} onClick={() => handleDelete(s)}>
                      {deletingId === s.supplier_id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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

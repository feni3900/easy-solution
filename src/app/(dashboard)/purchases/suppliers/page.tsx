"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getClientLocale, t } from "@/lib/i18n";

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  phone: string;
  company_name: string | null;
  address: string | null;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ supplier_name: "", phone: "", company_name: "", address: "" });
  const locale = getClientLocale();

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("suppliers").select("*").order("supplier_name");
    setSuppliers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ supplier_name: "", phone: "", company_name: "", address: "" }); setDialogOpen(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ supplier_name: s.supplier_name, phone: s.phone, company_name: s.company_name ?? "", address: s.address ?? "" }); setDialogOpen(true); };

  const handleSave = async () => {
    const supabase = createClient();
    const payload = { supplier_name: form.supplier_name, phone: form.phone, company_name: form.company_name || null, address: form.address || null };
    if (editing) {
      await supabase.from("suppliers").update(payload).eq("supplier_id", editing.supplier_id);
    } else {
      await supabase.from("suppliers").insert(payload);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("suppliers.deleteConfirm", locale))) return;
    const supabase = createClient();
    await supabase.from("suppliers").delete().eq("supplier_id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("purchases.suppliers.title", locale)}</h1>
        <Button onClick={openCreate}><Plus className="size-4 mr-2" />{t("suppliers.add.add", locale)}</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t("app.name", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.phone", locale)}</th>
                <th className="p-3 text-left font-medium">{t("suppliers.company", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.actions", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.supplier_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{s.supplier_name}</td>
                  <td className="p-3 text-muted-foreground">{s.phone}</td>
                  <td className="p-3 text-muted-foreground">{s.company_name ?? "-"}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.supplier_id)}><Trash2 className="size-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("suppliers.edit", locale) : t("suppliers.add.add", locale)}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>{t("suppliers.add.name", locale)}</Label><Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} /></div>
            <div className="space-y-1"><Label>{t("suppliers.add.phone", locale)}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1"><Label>{t("suppliers.add.company", locale)}</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
            <div className="space-y-1"><Label>{t("suppliers.add.address", locale)}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("purchases.new.cancel", locale)}</Button>
            <Button onClick={handleSave}>{editing ? t("suppliers.update", locale) : t("suppliers.create", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getClientLocale, t, fmtMoney } from "@/lib/i18n";

interface Customer {
  customer_id: number;
  mobile_number: string;
  full_name: string | null;
  address: string | null;
  city: string | null;
  previous_due: number;
  total_lifetime_spent: number;
  account_status: string;
}

export default function CustomersPage() {
  const locale = getClientLocale();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ mobile_number: "", full_name: "", address: "", city: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    setCustomers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) =>
    c.mobile_number.includes(search) || (c.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ mobile_number: "", full_name: "", address: "", city: "" }); setDialogOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setForm({ mobile_number: c.mobile_number, full_name: c.full_name ?? "", address: c.address ?? "", city: c.city ?? "" }); setDialogOpen(true); };

  const handleSave = async () => {
    const supabase = createClient();
    const payload = { mobile_number: form.mobile_number, full_name: form.full_name || null, address: form.address || null, city: form.city || null };
    if (editing) {
      await supabase.from("customers").update(payload).eq("customer_id", editing.customer_id);
    } else {
      await supabase.from("customers").insert(payload);
    }
    setDialogOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("customers.title", locale)}</h1>
        <Button onClick={openCreate}><Plus className="size-4 mr-2" />{t("customers.add", locale)}</Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder={t("customers.search", locale)} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t("app.name", locale)}</th>
                <th className="p-3 text-left font-medium">{t("customers.mobile", locale)}</th>
                <th className="p-3 text-left font-medium">{t("customers.city", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.due", locale)}</th>
                <th className="p-3 text-right font-medium">{t("customers.lifetimeSpent", locale)}</th>
                <th className="p-3 text-center font-medium">{t("app.status", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.actions", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.customer_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.full_name ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{c.mobile_number}</td>
                  <td className="p-3 text-muted-foreground">{c.city ?? "-"}</td>
                  <td className={`p-3 text-right font-medium ${c.previous_due > 0 ? "text-amber-600" : ""}`}>{fmtMoney(Number(c.previous_due), locale)}</td>
                  <td className="p-3 text-right">{fmtMoney(Number(c.total_lifetime_spent), locale)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.account_status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.account_status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="size-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("customers.edit", locale) : t("customers.add", locale)}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>{t("customers.mobileNumber", locale)}</Label><Input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} /></div>
            <div className="space-y-1"><Label>{t("customers.fullName", locale)}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-1"><Label>{t("app.address", locale)}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-1"><Label>{t("customers.city", locale)}</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("app.cancel", locale)}</Button>
            <Button onClick={handleSave}>{editing ? t("app.update", locale) : t("app.create", locale)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

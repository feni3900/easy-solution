"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Truck } from "lucide-react";
import { getClientLocale, t, fmtMoney } from "@/lib/i18n";

interface Supplier {
  supplier_id: number;
  supplier_name: string;
  phone: string;
  company_name: string | null;
  address: string | null;
}

interface PurchaseRow {
  invoice_no: string;
  purchase_date: string;
  payment_type: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  created_at: string;
}

interface PaymentRow {
  payment_id: number;
  amount_paid: number;
  payment_mode: string;
  transaction_ref: string | null;
  remarks: string | null;
  created_at: string;
  purchases: { invoice_no: string } | { invoice_no: string }[] | null;
}

export default function SupplierLedgerPage() {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Supplier[]>([]);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locale = getClientLocale();

  const handleSearch = (value: string) => {
    setSearch(value);
    setError("");
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const term = `%${value.trim()}%`;
      const { data } = await supabase
        .from("suppliers")
        .select("supplier_id, supplier_name, phone, company_name, address")
        .or(`supplier_name.ilike.${term},phone.ilike.${term}`)
        .order("supplier_name", { ascending: true })
        .limit(15);
      setResults(data ?? []);
      setSearching(false);
    }, 300);
  };

  const selectSupplier = async (supplier: Supplier) => {
    setSelected(supplier);
    setSearch("");
    setResults([]);
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("purchases")
      .select("invoice_no, purchase_date, payment_type, total_amount, paid_amount, due_amount, created_at")
      .eq("supplier_id", supplier.supplier_id)
      .order("purchase_date", { ascending: false });
    if (err) setError(err.message);
    setPurchases(data ?? []);

    const { data: paymentRows, error: payErr } = await supabase
      .from("supplier_payments")
      .select("payment_id, amount_paid, payment_mode, transaction_ref, remarks, created_at, purchases(invoice_no)")
      .eq("supplier_id", supplier.supplier_id)
      .order("created_at", { ascending: false });
    if (payErr) setError(payErr.message);
    setPayments(paymentRows ?? []);

    setLoading(false);
  };

  const totalPurchases = purchases.reduce((s, p) => s + Number(p.total_amount), 0);
  const totalPaid = purchases.reduce((s, p) => s + Number(p.paid_amount), 0);
  const currentDue = purchases.reduce((s, p) => s + Number(p.due_amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("purchases.ledger.title", locale)} description={t("suppliers.ledger.desc", locale)} />

      <div className="rounded-lg border bg-card p-4">
        <Label>{t("suppliers.ledger.search", locale)}</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("suppliers.ledger.searchPh", locale)}
            className="pl-9"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
              {results.map((s) => (
                <button
                  key={s.supplier_id}
                  onClick={() => selectSupplier(s)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <Truck className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.supplier_name}</span>
                    <span className="block text-xs text-muted-foreground font-mono">{s.phone}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {!searching && search.trim() && results.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{t("suppliers.ledger.noFound", locale)}</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {selected && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{selected.supplier_name}</h2>
              <p className="text-sm text-muted-foreground font-mono">{selected.phone}</p>
              {selected.company_name && <p className="text-sm text-muted-foreground">{selected.company_name}</p>}
            </div>
            <Button variant="outline" onClick={() => { setSelected(null); setPurchases([]); }}>{t("sales.returns.clear", locale)}</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title={t("suppliers.ledger.totalPurchases", locale)} value={fmtMoney(totalPurchases, locale)} />
            <StatCard title={t("suppliers.ledger.totalPaid", locale)} value={fmtMoney(totalPaid, locale)} />
            <StatCard title={t("suppliers.ledger.currentDue", locale)} value={fmtMoney(currentDue, locale)} variant={currentDue > 0 ? "destructive" : "default"} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-lg border bg-card overflow-x-auto">
              <h3 className="border-b p-4 font-medium">{t("suppliers.ledger.purchaseHistory", locale)}</h3>
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">{t("app.date", locale)}</th>
                    <th className="p-3 font-medium">{t("purchases.purchaseNo", locale)}</th>
                    <th className="p-3 text-right font-medium">{t("app.total", locale)}</th>
                    <th className="p-3 text-right font-medium">{t("app.paid", locale)}</th>
                    <th className="p-3 text-right font-medium">{t("app.due", locale)}</th>
                    <th className="p-3 font-medium">{t("suppliers.ledger.paymentType", locale)}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("purchases.noPurchases", locale)}</td></tr>
                  ) : (
                    purchases.map((p, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{new Date(p.purchase_date).toLocaleDateString()}</td>
                        <td className="p-3 font-medium">{p.invoice_no}</td>
                        <td className="p-3 text-right">{fmtMoney(Number(p.total_amount), locale)}</td>
                        <td className="p-3 text-right">{fmtMoney(Number(p.paid_amount), locale)}</td>
                        <td className={`p-3 text-right ${Number(p.due_amount) > 0 ? "text-destructive font-medium" : ""}`}>{fmtMoney(Number(p.due_amount), locale)}</td>
                        <td className="p-3">
                          <Badge variant={p.payment_type === "Cash" ? "default" : "destructive"} className="capitalize">
                            {p.payment_type}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-lg border bg-card overflow-x-auto">
              <h3 className="border-b p-4 font-medium">{t("suppliers.ledger.paymentHistory", locale)}</h3>
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3 font-medium">{t("app.date", locale)}</th>
                    <th className="p-3 font-medium">{t("purchases.purchaseNo", locale)}</th>
                    <th className="p-3 text-right font-medium">{t("app.amount", locale)}</th>
                    <th className="p-3 font-medium">{t("suppliers.ledger.mode", locale)}</th>
                    <th className="p-3 font-medium">{t("suppliers.ledger.remarks", locale)}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("suppliers.ledger.noPayments", locale)}</td></tr>
                  ) : (
                    payments.map((pm, i) => (
                      <tr key={pm.payment_id ?? i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">{new Date(pm.created_at).toLocaleDateString()}</td>
                        <td className="p-3 font-medium">{Array.isArray(pm.purchases) ? pm.purchases[0]?.invoice_no ?? "-" : pm.purchases?.invoice_no ?? "-"}</td>
                        <td className="p-3 text-right">{fmtMoney(Number(pm.amount_paid), locale)}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">{pm.payment_mode}</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{pm.remarks ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selected && !search && (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {t("suppliers.ledger.empty", locale)}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium">{children}</label>;
}

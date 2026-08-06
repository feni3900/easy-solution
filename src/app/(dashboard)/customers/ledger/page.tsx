"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, User } from "lucide-react";
import { getClientLocale, t, fmtMoney } from "@/lib/i18n";

interface Customer {
  customer_id: number;
  full_name: string | null;
  mobile_number: string;
  city: string | null;
  previous_due: number;
  total_lifetime_spent: number;
}

interface LedgerInvoice {
  invoice_no: string;
  sale_date: string;
  channel: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
}

interface LedgerPayment {
  amount_paid: number;
  payment_mode: string;
  transaction_ref: string | null;
  remarks: string | null;
  created_at: string;
}

export default function CustomerLedgerPage() {
  const locale = getClientLocale();
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<LedgerInvoice[]>([]);
  const [payments, setPayments] = useState<LedgerPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDueOnly, setShowDueOnly] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        .from("customers")
        .select("customer_id, full_name, mobile_number, city, previous_due, total_lifetime_spent")
        .or(`full_name.ilike.${term},mobile_number.ilike.${term}`)
        .order("full_name", { ascending: true })
        .limit(15);
      setResults(data ?? []);
      setSearching(false);
    }, 300);
  };

  const selectCustomer = async (customer: Customer) => {
    setSelected(customer);
    setSearch("");
    setResults([]);
    setLoading(true);
    setError("");
    const supabase = createClient();
    const [invRes, payRes] = await Promise.all([
      supabase
        .from("sales_invoices")
        .select("invoice_no, sale_date, channel, total_amount, paid_amount, due_amount, payment_status")
        .eq("customer_id", customer.customer_id)
        .order("sale_date", { ascending: false }),
      supabase
        .from("customer_due_payments")
        .select("amount_paid, payment_mode, transaction_ref, remarks, created_at")
        .eq("customer_id", customer.customer_id)
        .order("created_at", { ascending: false }),
    ]);
    if (invRes.error) setError(invRes.error.message);
    setInvoices(invRes.data ?? []);
    setPayments(payRes.data ?? []);
    setLoading(false);
  };

  const filteredInvoices = showDueOnly ? invoices.filter((i) => Number(i.due_amount) > 0) : invoices;
  const totalSpent = filteredInvoices.reduce((s, i) => s + Number(i.total_amount), 0);
  const totalPaid = filteredInvoices.reduce((s, i) => s + Number(i.paid_amount), 0);
  const currentDue = filteredInvoices.reduce((s, i) => s + Number(i.due_amount), 0) + Number(selected?.previous_due ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("customers.ledger.title", locale)} description={t("customers.ledger.desc", locale)} />

      <div className="rounded-lg border bg-card p-4">
        <Label>{t("customers.ledger.search", locale)}</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("customers.ledger.searchPh", locale)}
            className="pl-9"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />}
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md">
              {results.map((c) => (
                <button
                  key={c.customer_id}
                  onClick={() => selectCustomer(c)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.full_name ?? t("customers.ledger.unnamed", locale)}</span>
                    <span className="block text-xs text-muted-foreground font-mono">{c.mobile_number}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {!searching && search.trim() && results.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{t("customers.ledger.noFound", locale)}</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {selected && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{selected.full_name ?? t("customers.ledger.unnamed", locale)}</h2>
              <p className="text-sm text-muted-foreground font-mono">{selected.mobile_number}</p>
            </div>
            <Button variant="outline" onClick={() => { setSelected(null); setInvoices([]); setPayments([]); }}>{t("customers.ledger.clear", locale)}</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={t("customers.lifetimeSpent", locale)} value={fmtMoney(Number(selected.total_lifetime_spent), locale)} />
            <StatCard title={t("customers.ledger.totalPurchases", locale)} value={fmtMoney(totalSpent, locale)} />
            <StatCard title={t("customers.ledger.totalPaid", locale)} value={fmtMoney(totalPaid, locale)} />
            <StatCard title={t("customers.currentDue", locale)} value={fmtMoney(currentDue, locale)} variant={currentDue > 0 ? "destructive" : "default"} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="rounded-lg border bg-card overflow-x-auto">
                <div className="flex items-center justify-between gap-3 border-b p-4">
                  <h3 className="font-medium">{t("customers.ledger.invoiceHistory", locale)}</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showDueOnly}
                      onChange={(e) => setShowDueOnly(e.target.checked)}
                      className="size-4"
                    />
                    {t("customers.ledger.dueOnly", locale)}
                  </label>
                </div>
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-3 font-medium">{t("app.date", locale)}</th>
                      <th className="p-3 font-medium">{t("customers.ledger.invoiceNo", locale)}</th>
                      <th className="p-3 font-medium">{t("app.channel", locale)}</th>
                      <th className="p-3 text-right font-medium">{t("app.total", locale)}</th>
                      <th className="p-3 text-right font-medium">{t("app.paid", locale)}</th>
                      <th className="p-3 text-right font-medium">{t("app.due", locale)}</th>
                      <th className="p-3 font-medium">{t("app.status", locale)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t(showDueOnly ? "customers.ledger.noDueInvoices" : "customers.ledger.noInvoices", locale)}</td></tr>
                    ) : (
                      filteredInvoices.map((inv, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 whitespace-nowrap">{new Date(inv.sale_date).toLocaleDateString()}</td>
                          <td className="p-3 font-medium">{inv.invoice_no}</td>
                          <td className="p-3">{inv.channel}</td>
                          <td className="p-3 text-right">{fmtMoney(Number(inv.total_amount), locale)}</td>
                          <td className="p-3 text-right">{fmtMoney(Number(inv.paid_amount), locale)}</td>
                          <td className={`p-3 text-right ${Number(inv.due_amount) > 0 ? "text-destructive font-medium" : ""}`}>{fmtMoney(Number(inv.due_amount), locale)}</td>
                          <td className="p-3">
                            <Badge variant={inv.payment_status === "Cash" ? "default" : "destructive"} className="capitalize">
                              {inv.payment_status === "Cash" ? t("customers.ledger.paid", locale) : inv.payment_status === "Partial Due" ? t("customers.ledger.partial", locale) : inv.payment_status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border bg-card overflow-x-auto">
                <h3 className="border-b p-4 font-medium">{t("customers.ledger.paymentHistory", locale)}</h3>
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="p-3 font-medium">{t("app.date", locale)}</th>
                      <th className="p-3 text-right font-medium">{t("customers.ledger.amount", locale)}</th>
                      <th className="p-3 font-medium">{t("customers.ledger.mode", locale)}</th>
                      <th className="p-3 font-medium">{t("app.reference", locale)}</th>
                      <th className="p-3 font-medium">{t("customers.ledger.remarks", locale)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("customers.ledger.noPayments", locale)}</td></tr>
                    ) : (
                      payments.map((p, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 whitespace-nowrap">{new Date(p.created_at).toLocaleString()}</td>
                          <td className="p-3 text-right font-medium">{fmtMoney(Number(p.amount_paid), locale)}</td>
                          <td className="p-3">{p.payment_mode}</td>
                          <td className="p-3">{p.transaction_ref ?? "—"}</td>
                          <td className="p-3">{p.remarks ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {!selected && !search && (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {t("customers.ledger.empty", locale)}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium">{children}</label>;
}

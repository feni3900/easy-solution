"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getClientLocale, t, fmtMoney, fmtInt, translateWithVars } from "@/lib/i18n";

interface Invoice {
  invoice_id: number;
  invoice_no: string;
  sale_date: string;
  channel: string;
  salesperson_nickname: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  customers: { full_name: string; mobile_number: string } | null;
}

interface ReturnItem {
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
  reason: string | null;
  date: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewItems, setViewItems] = useState<{ product_name_snapshot: string; unit_price: number; quantity: number; total_price: number; discount_applied: number; cost_price: number | null }[]>([]);
  const [viewReturns, setViewReturns] = useState<ReturnItem[]>([]);
  const locale = getClientLocale();

  const paymentStatusLabel = (status: string) => {
    if (status === "Cash") return t("app.paymentStatusCash", locale);
    if (status === "Partial Due") return t("app.paymentStatusPartial", locale);
    if (status === "Paid") return t("app.paymentStatusPaid", locale);
    if (status === "Unpaid") return t("app.paymentStatusUnpaid", locale);
    return t("app.paymentStatusDue", locale);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("sales_invoices")
      .select("*, customers(full_name, mobile_number)")
      .order("created_at", { ascending: false });
    setInvoices(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const viewDetail = async (invoice: Invoice) => {
    setViewInvoice(invoice);
    const supabase = createClient();
    const [itemsRes, returnsRes] = await Promise.all([
      supabase
        .from("sales_items")
        .select("product_name_snapshot, unit_price, quantity, total_price, discount_applied, product_id")
        .eq("invoice_id", invoice.invoice_id),
      supabase
        .from("sales_returns")
        .select("product_id, quantity, reason, date")
        .eq("invoice_id", invoice.invoice_id),
    ]);

    const itemsData = itemsRes.data ?? [];
    const itemProductIds = [...new Set(itemsData.map((i) => i.product_id))];
    let costMap = new Map<number, number | null>();
    if (itemProductIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("product_id, cost_price")
        .in("product_id", itemProductIds);
      costMap = new Map((products ?? []).map((p) => [p.product_id, p.cost_price]));
    }

    setViewItems(
      itemsData.map((item) => ({
        product_name_snapshot: item.product_name_snapshot,
        unit_price: Number(item.unit_price),
        quantity: item.quantity,
        total_price: Number(item.total_price),
        discount_applied: Number(item.discount_applied ?? 0),
        cost_price: costMap.get(item.product_id) ?? null,
      }))
    );

    const returns = returnsRes.data ?? [];
    if (returns.length > 0) {
      const productIds = [...new Set(returns.map((r) => r.product_id))];
      const { data: products } = await supabase
        .from("products")
        .select("product_id, product_name")
        .in("product_id", productIds);
      const productMap = new Map((products ?? []).map((p) => [p.product_id, p.product_name]));
      setViewReturns(
        returns.map((r) => ({
          product_name_snapshot: productMap.get(r.product_id) ?? "Unknown",
          unit_price: 0,
          quantity: r.quantity,
          reason: r.reason,
          date: r.date,
        }))
      );
    } else {
      setViewReturns([]);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("sales.invoices.title", locale)}</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t("sales.invoiceNo", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.date", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.customer", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.channel", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.total", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.paid", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.due", locale)}</th>
                <th className="p-3 text-center font-medium">{t("app.status", locale)}</th>
                <th className="p-3 text-center font-medium">{t("app.actions", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.invoice_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{inv.invoice_no}</td>
                  <td className="p-3 text-muted-foreground">{new Date(inv.sale_date).toLocaleDateString()}</td>
                  <td className="p-3">{(inv.customers as { full_name?: string })?.full_name ?? t("app.walkIn", locale)}</td>
                  <td className="p-3 text-muted-foreground">{inv.channel}</td>
                  <td className="p-3 text-right">{fmtMoney(Number(inv.total_amount), locale)}</td>
                  <td className="p-3 text-right">{fmtMoney(Number(inv.paid_amount), locale)}</td>
                  <td className={`p-3 text-right ${inv.due_amount > 0 ? "text-amber-600 font-medium" : ""}`}>{fmtMoney(Number(inv.due_amount), locale)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.payment_status === "Cash" ? "bg-green-100 text-green-700" :
                      inv.payment_status === "Due" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{paymentStatusLabel(inv.payment_status)}</span>
                  </td>
                  <td className="p-3 text-center">
                    <Button variant="ghost" size="icon" onClick={() => viewDetail(inv)}><Eye className="size-4" /></Button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">{t("sales.noInvoices", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{translateWithVars(t("sales.invoiceTitle", locale), { no: viewInvoice?.invoice_no ?? "" })}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p>{t("sales.salesperson", locale)} {viewInvoice?.salesperson_nickname}</p>
            <p>{t("sales.channelLabel", locale)} {viewInvoice?.channel}</p>
            <p>{t("sales.dateLabel", locale)} {viewInvoice ? new Date(viewInvoice.sale_date).toLocaleString() : ""}</p>
            <div className="overflow-x-auto">
              <table className="w-full mt-4 min-w-[480px]">
                <thead><tr className="border-b"><th className="p-2 text-left">{t("app.item", locale)}</th><th className="text-right">{t("app.qty", locale)}</th><th className="text-right">{t("app.price", locale)}</th><th className="text-right">{t("app.total", locale)}</th><th className="text-right">{t("app.profit", locale)}</th></tr></thead>
                <tbody>
                  {viewItems.map((item, i) => {
                    const profit = item.cost_price != null
                      ? Number(item.total_price) - (item.cost_price * item.quantity) - Number(item.discount_applied)
                      : null;
                    return (
                      <tr key={i} className="border-b">
                        <td className="p-2">{item.product_name_snapshot}</td>
                        <td className="text-right whitespace-nowrap">{fmtInt(item.quantity, locale)}</td>
                        <td className="text-right whitespace-nowrap">{fmtMoney(Number(item.unit_price), locale)}</td>
                        <td className="text-right whitespace-nowrap">{fmtMoney(Number(item.total_price), locale)}</td>
                        <td className={`text-right whitespace-nowrap ${profit != null && profit >= 0 ? "text-green-600" : profit != null ? "text-red-600" : "text-muted-foreground"}`}>
                          {profit != null ? fmtMoney(profit, locale) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {viewReturns.length > 0 && (
              <>
                <p className="font-medium text-red-600 mt-3">{t("sales.returnedItems", locale)}</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px]">
                    <thead><tr className="border-b"><th className="p-2 text-left">{t("app.item", locale)}</th><th className="text-right">{t("app.qty", locale)}</th><th className="text-left">{t("sales.reason", locale)}</th></tr></thead>
                    <tbody>
                      {viewReturns.map((r, i) => (
                        <tr key={i} className="border-b text-red-600">
                          <td className="p-2">{r.product_name_snapshot}</td>
                          <td className="text-right whitespace-nowrap">-{fmtInt(r.quantity, locale)}</td>
                          <td className="text-left text-muted-foreground">{r.reason ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm font-bold text-green-600">
                {t("sales.profitLabel", locale)} {fmtMoney(viewItems.reduce((s, item) => s + (item.cost_price != null ? Number(item.total_price) - item.cost_price * item.quantity - Number(item.discount_applied) : 0), 0), locale)}
              </div>
              <div className="text-right font-bold">{t("sales.totalLabel", locale)} {fmtMoney(Number(viewInvoice?.total_amount ?? 0), locale)}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

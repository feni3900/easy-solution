"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
      <h1 className="text-2xl font-semibold">POS Invoices</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Invoice #</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-left font-medium">Customer</th>
                <th className="p-3 text-left font-medium">Channel</th>
                <th className="p-3 text-right font-medium">Total</th>
                <th className="p-3 text-right font-medium">Paid</th>
                <th className="p-3 text-right font-medium">Due</th>
                <th className="p-3 text-center font-medium">Status</th>
                <th className="p-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.invoice_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{inv.invoice_no}</td>
                  <td className="p-3 text-muted-foreground">{new Date(inv.sale_date).toLocaleDateString()}</td>
                  <td className="p-3">{(inv.customers as { full_name?: string })?.full_name ?? "Walk-in"}</td>
                  <td className="p-3 text-muted-foreground">{inv.channel}</td>
                  <td className="p-3 text-right">৳{Number(inv.total_amount).toFixed(2)}</td>
                  <td className="p-3 text-right">৳{Number(inv.paid_amount).toFixed(2)}</td>
                  <td className={`p-3 text-right ${inv.due_amount > 0 ? "text-amber-600 font-medium" : ""}`}>৳{Number(inv.due_amount).toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.payment_status === "Cash" ? "bg-green-100 text-green-700" :
                      inv.payment_status === "Due" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{inv.payment_status}</span>
                  </td>
                  <td className="p-3 text-center">
                    <Button variant="ghost" size="icon" onClick={() => viewDetail(inv)}><Eye className="size-4" /></Button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No invoices yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Invoice {viewInvoice?.invoice_no}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Salesperson: {viewInvoice?.salesperson_nickname}</p>
            <p>Channel: {viewInvoice?.channel}</p>
            <p>Date: {viewInvoice ? new Date(viewInvoice.sale_date).toLocaleString() : ""}</p>
            <div className="overflow-x-auto">
              <table className="w-full mt-4 min-w-[480px]">
                <thead><tr className="border-b"><th className="p-2 text-left">Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th><th className="text-right">Profit</th></tr></thead>
                <tbody>
                  {viewItems.map((item, i) => {
                    const profit = item.cost_price != null
                      ? Number(item.total_price) - (item.cost_price * item.quantity) - Number(item.discount_applied)
                      : null;
                    return (
                      <tr key={i} className="border-b">
                        <td className="p-2">{item.product_name_snapshot}</td>
                        <td className="text-right whitespace-nowrap">{item.quantity}</td>
                        <td className="text-right whitespace-nowrap">৳{Number(item.unit_price).toFixed(2)}</td>
                        <td className="text-right whitespace-nowrap">৳{Number(item.total_price).toFixed(2)}</td>
                        <td className={`text-right whitespace-nowrap ${profit != null && profit >= 0 ? "text-green-600" : profit != null ? "text-red-600" : "text-muted-foreground"}`}>
                          {profit != null ? `৳${profit.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {viewReturns.length > 0 && (
              <>
                <p className="font-medium text-red-600 mt-3">Returned Items</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px]">
                    <thead><tr className="border-b"><th className="p-2 text-left">Item</th><th className="text-right">Qty</th><th className="text-left">Reason</th></tr></thead>
                    <tbody>
                      {viewReturns.map((r, i) => (
                        <tr key={i} className="border-b text-red-600">
                          <td className="p-2">{r.product_name_snapshot}</td>
                          <td className="text-right whitespace-nowrap">-{r.quantity}</td>
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
                Profit: ৳{viewItems.reduce((s, item) => s + (item.cost_price != null ? Number(item.total_price) - item.cost_price * item.quantity - Number(item.discount_applied) : 0), 0).toFixed(2)}
              </div>
              <div className="text-right font-bold">Total: ৳{viewInvoice?.total_amount.toFixed(2)}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

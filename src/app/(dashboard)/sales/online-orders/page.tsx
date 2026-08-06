"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getClientLocale, t, fmtMoney, translateWithVars } from "@/lib/i18n";

interface OrderItem {
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface WebOrder {
  order_id: number;
  order_no: string;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_city: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  tracking_number: string | null;
  items?: OrderItem[];
}

export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState<WebOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState<WebOrder | null>(null);
  const locale = getClientLocale();

  const statusLabel = (status: string) => {
    switch (status) {
      case "Pending": return t("sales.online.statusPending", locale);
      case "Confirmed": return t("sales.online.statusConfirmed", locale);
      case "Processing": return t("sales.online.statusProcessing", locale);
      case "Shipped": return t("sales.online.statusShipped", locale);
      case "Delivered": return t("sales.online.statusDelivered", locale);
      case "Cancelled": return t("sales.online.statusCancelled", locale);
      default: return status;
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: ordersData } = await supabase
      .from("web_orders")
      .select("*")
      .order("created_at", { ascending: false });

    const orders = ordersData ?? [];

    if (orders.length > 0) {
      const ids = orders.map((o: WebOrder) => o.order_id);
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("order_id, product_name_snapshot, unit_price, quantity, total_price")
        .in("order_id", ids);

      const itemsByOrder = (itemsData ?? []).reduce((acc: Record<number, OrderItem[]>, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {} as Record<number, OrderItem[]>);

      orders.forEach((o: WebOrder) => {
        o.items = itemsByOrder[o.order_id] ?? [];
      });
    }

    setOrders(orders);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId: number, status: string) => {
    const supabase = createClient();
    await supabase.from("web_orders").update({ order_status: status }).eq("order_id", orderId);
    load();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-amber-100 text-amber-700";
      case "Confirmed": return "bg-blue-100 text-blue-700";
      case "Processing": return "bg-indigo-100 text-indigo-700";
      case "Shipped": return "bg-purple-100 text-purple-700";
      case "Delivered": return "bg-green-100 text-green-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("sales.online.title", locale)}</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t("sales.online.orderNo", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.customer", locale)}</th>
                <th className="p-3 text-left font-medium">{t("app.city", locale)}</th>
                <th className="p-3 text-right font-medium">{t("app.amount", locale)}</th>
                <th className="p-3 text-center font-medium">{t("app.paymentStatus", locale)}</th>
                <th className="p-3 text-center font-medium">{t("sales.online.orderStatus", locale)}</th>
                <th className="p-3 text-center font-medium">{t("app.actions", locale)}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.order_id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{o.order_no}</td>
                  <td className="p-3">{o.shipping_full_name}</td>
                  <td className="p-3 text-muted-foreground">{o.shipping_city}</td>
                  <td className="p-3 text-right">{fmtMoney(Number(o.total_amount), locale)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.payment_status === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {o.payment_status === "Paid" ? t("app.paymentStatusPaid", locale) : t("app.paymentStatusUnpaid", locale)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(o.order_status)}`}>{statusLabel(o.order_status)}</span>
                  </td>
                  <td className="p-3 text-center space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setViewOrder(o)}><Eye className="size-4" /></Button>
                    {o.order_status === "Pending" && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(o.order_id, "Confirmed")}>{t("sales.online.confirm", locale)}</Button>
                    )}
                    {o.order_status === "Confirmed" && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(o.order_id, "Processing")}>{t("sales.online.process", locale)}</Button>
                    )}
                    {o.order_status === "Processing" && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(o.order_id, "Shipped")}>{t("sales.online.ship", locale)}</Button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("sales.online.noOrders", locale)}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{translateWithVars(t("sales.online.orderNo", locale), { no: viewOrder?.order_no ?? "" })}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p>{t("sales.online.customer", locale)} {viewOrder?.shipping_full_name}</p>
            <p>{t("sales.online.phone", locale)} {viewOrder?.shipping_phone}</p>
            <p>{t("sales.online.city", locale)} {viewOrder?.shipping_city}</p>
            <p>{t("sales.online.payment", locale)} {viewOrder?.payment_method} ({statusLabel(viewOrder?.payment_status ?? "")})</p>
            {viewOrder?.tracking_number && <p>{t("sales.online.tracking", locale)} {viewOrder.tracking_number}</p>}
            {viewOrder?.items && viewOrder.items.length > 0 && (
              <div className="mt-3">
                <p className="font-medium mb-1">{t("sales.online.products", locale)}</p>
                <div className="rounded-md border divide-y">
                  {viewOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between p-2">
                      <span>{item.product_name_snapshot} × {item.quantity}</span>
                      <span>{fmtMoney(Number(item.total_price), locale)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-right font-medium mt-2">{t("sales.totalLabel", locale)} {fmtMoney(Number(viewOrder?.total_amount ?? 0), locale)}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

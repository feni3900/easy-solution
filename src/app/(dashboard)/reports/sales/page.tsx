"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ShoppingCart, Users, CreditCard, TrendingUp, Calendar } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Invoice {
  invoice_id: number;
  total_amount: number;
  paid_amount: number;
  channel: string;
  payment_status: string;
  sale_date: string;
}

interface WebOrder {
  order_id: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export default function SalesReportPage() {
  const [posInvoices, setPosInvoices] = useState<Invoice[]>([]);
  const [webOrders, setWebOrders] = useState<WebOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const from = dateFrom ? `${dateFrom}T00:00:00` : undefined;
    const to = dateTo ? `${dateTo}T23:59:59` : undefined;

    const [posRes, webRes] = await Promise.all([
      supabase
        .from("sales_invoices")
        .select("invoice_id, total_amount, paid_amount, channel, payment_status, sale_date")
        .gte("sale_date", from ?? "")
        .lte("sale_date", to ?? ""),
      supabase
        .from("web_orders")
        .select("order_id, total_amount, payment_method, created_at")
        .gte("created_at", from ?? "")
        .lte("created_at", to ?? ""),
    ]);
    setPosInvoices(posRes.data ?? []);
    setWebOrders(webRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const posSales = posInvoices.reduce((s, o) => s + Number(o.total_amount), 0);
  const onlineSales = webOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalSales = posSales + onlineSales;
  const cashSales = posInvoices
    .filter((o) => o.payment_status === "Cash")
    .reduce((s, o) => s + Number(o.total_amount), 0);
  const creditSales = posInvoices
    .filter((o) => o.payment_status === "Due" || o.payment_status === "Partial Due")
    .reduce((s, o) => s + (Number(o.total_amount) - Number(o.paid_amount)), 0);
  const totalOrders = posInvoices.length + webOrders.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Report" description="Sales performance across channels and payment methods" />

      <div className="flex items-end gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-1">
          <Label>From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label>To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <Calendar className="size-4 mr-2" /> Filter
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sales" value={`৳${totalSales.toFixed(2)}`} icon={<ShoppingCart className="size-4" />} />
        <StatCard title="POS Sales" value={`৳${posSales.toFixed(2)}`} icon={<TrendingUp className="size-4" />} />
        <StatCard title="Online Sales" value={`৳${onlineSales.toFixed(2)}`} icon={<ShoppingCart className="size-4" />} />
        <StatCard title="Orders" value={String(totalOrders)} icon={<Users className="size-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash vs Credit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatCard title="Cash Sales" value={`৳${cashSales.toFixed(2)}`} icon={<CreditCard className="size-4" />} />
            <StatCard
              title="Credit Sales"
              value={`৳${creditSales.toFixed(2)}`}
              icon={<CreditCard className="size-4" />}
              variant={creditSales > 0 ? "destructive" : "default"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

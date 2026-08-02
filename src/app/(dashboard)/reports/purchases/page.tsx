import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Truck } from "lucide-react";
import { PurchasesReportClient } from "./purchases-report-client";

export const metadata = { title: "Purchases Report | Smart Solution ERP" };

export default async function PurchasesReportPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("*, suppliers(name)")
    .order("purchase_date", { ascending: false });

  const rows = (data ?? []) as {
    id: string;
    purchase_no: string | null;
    total: number;
    status: string;
    purchase_date: string;
    suppliers?: { name: string }[] | { name: string } | null;
  }[];
  const total = rows.reduce((s, p) => s + Number(p.total), 0);
  const received = rows.filter((p) => p.status === "received");

  return (
    <div className="space-y-6">
      <PageHeader title="Purchases Report" description="Purchase activity" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Purchases" value={`৳${total.toFixed(2)}`} icon={<Truck className="size-4" />} />
        <StatCard title="Purchase Orders" value={String(rows.length)} />
        <StatCard title="Received" value={String(received.length)} />
      </div>

      <PurchasesReportClient rows={rows} />
    </div>
  );
}

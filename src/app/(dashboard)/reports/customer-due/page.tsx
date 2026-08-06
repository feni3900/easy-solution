"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface CustomerDue {
  id: string;
  customer_name: string;
  mobile_number: string;
  sales_person: string;
  invoice_no: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  status: string;
}

const columns: ColumnDef<CustomerDue>[] = [
  { accessorKey: "customer_name", header: "Customer" },
  { accessorKey: "mobile_number", header: "Mobile" },
  { accessorKey: "sales_person", header: "Sales Person" },
  { accessorKey: "invoice_no", header: "Invoice" },
  {
    accessorKey: "total_amount",
    header: "Total",
    cell: ({ row }) => `৳${Number(row.original.total_amount).toFixed(2)}`,
  },
  {
    accessorKey: "due_amount",
    header: "Due",
    cell: ({ row }) => (
      <span className={row.original.due_amount > 0 ? "text-destructive font-medium" : ""}>
        ৳{Number(row.original.due_amount).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "paid" ? "default" : "destructive"} className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
];

export default function CustomerDueReportPage() {
  const [dues, setDues] = useState<CustomerDue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sales_invoices")
      .select("invoice_id, invoice_no, total_amount, paid_amount, due_amount, payment_status, sale_date, salesperson_nickname, customers(full_name, mobile_number)")
      .gt("due_amount", 0)
      .order("sale_date", { ascending: false })
      .then(({ data }) => {
        setDues(
          (data ?? []).map((inv: {
            invoice_id: number;
            invoice_no: string;
            total_amount: number;
            paid_amount: number;
            due_amount: number;
            payment_status: string;
            sale_date: string;
            salesperson_nickname: string | null;
            customers: { full_name: string | null; mobile_number: string | null } | { full_name: string | null; mobile_number: string | null }[] | null;
          }) => ({
            id: String(inv.invoice_id),
            customer_name: Array.isArray(inv.customers) ? inv.customers[0]?.full_name ?? "Walk-in" : inv.customers?.full_name ?? "Walk-in",
            mobile_number: Array.isArray(inv.customers) ? inv.customers[0]?.mobile_number ?? "—" : inv.customers?.mobile_number ?? "—",
            sales_person: inv.salesperson_nickname ?? "—",
            invoice_no: inv.invoice_no,
            total_amount: inv.total_amount,
            paid_amount: inv.paid_amount,
            due_amount: inv.due_amount,
            due_date: inv.sale_date,
            status: inv.payment_status === "Cash" ? "paid" : inv.payment_status === "Partial Due" ? "partial" : "due",
          }))
        );
        setLoading(false);
      });
  }, []);

  const totalDue = dues.reduce((s, d) => s + Number(d.due_amount), 0);
  const unpaidCount = dues.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Due Report" description="Outstanding customer payments overview" />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Total Due" value={`৳${totalDue.toFixed(2)}`} variant={totalDue > 0 ? "destructive" : "default"} />
        <StatCard title="Unpaid Invoices" value={String(unpaidCount)} />
      </div>

      <DataTable
        columns={columns}
        data={dues}
        searchColumns={[
          { key: "invoice_no", placeholder: "Search invoice no..." },
          { key: "mobile_number", placeholder: "Search mobile no..." },
        ]}
      />
    </div>
  );
}

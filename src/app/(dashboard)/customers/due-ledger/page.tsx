"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getClientLocale, t, fmtMoney } from "@/lib/i18n";

interface DueEntry {
  id: string;
  customer_name: string;
  mobile_number: string;
  invoice_no: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  status: string;
}

const makeColumns = (locale: "en" | "bn"): ColumnDef<DueEntry>[] => [
  { accessorKey: "customer_name", header: t("app.customer", locale) },
  {
    accessorKey: "mobile_number",
    header: t("customers.dueLedger.mobileNo", locale),
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.mobile_number}</span>,
  },
  { accessorKey: "invoice_no", header: t("customers.dueLedger.invoice", locale) },
  {
    accessorKey: "total_amount",
    header: t("app.total", locale),
    cell: ({ row }) => fmtMoney(Number(row.original.total_amount), locale),
  },
  {
    accessorKey: "paid_amount",
    header: t("app.paid", locale),
    cell: ({ row }) => fmtMoney(Number(row.original.paid_amount), locale),
  },
  {
    accessorKey: "due_amount",
    header: t("app.due", locale),
    cell: ({ row }) => (
      <span className={row.original.due_amount > 0 ? "text-destructive font-medium" : ""}>
        {fmtMoney(Number(row.original.due_amount), locale)}
      </span>
    ),
  },
  {
    accessorKey: "due_date",
    header: t("customers.dueLedger.dueDate", locale),
    cell: ({ row }) => row.original.due_date ? new Date(row.original.due_date).toLocaleDateString() : "—",
  },
  {
    accessorKey: "status",
    header: t("app.status", locale),
    cell: ({ row }) => (
      <Badge variant={row.original.status === "paid" ? "default" : "destructive"} className="capitalize">
        {row.original.status}
      </Badge>
    ),
  },
];

export default function CustomerDueLedgerPage() {
  const locale = getClientLocale();
  const columns = makeColumns(locale);
  const [entries, setEntries] = useState<DueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sales_invoices")
      .select("invoice_id, invoice_no, total_amount, paid_amount, due_amount, payment_status, sale_date, customers(full_name, mobile_number)")
      .gt("due_amount", 0)
      .order("sale_date", { ascending: false })
      .then(({ data }) => {
        setEntries(
          (data ?? []).map((inv: {
            invoice_id: number;
            invoice_no: string;
            total_amount: number;
            paid_amount: number;
            due_amount: number;
            payment_status: string;
            sale_date: string;
            customers: { full_name: string | null; mobile_number: string | null } | { full_name: string | null; mobile_number: string | null }[] | null;
          }) => ({
            id: String(inv.invoice_id),
            customer_name: Array.isArray(inv.customers) ? inv.customers[0]?.full_name ?? "Walk-in" : inv.customers?.full_name ?? "Walk-in",
            mobile_number: Array.isArray(inv.customers) ? inv.customers[0]?.mobile_number ?? "—" : inv.customers?.mobile_number ?? "—",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("customers.dueLedger.title", locale)} description={t("customers.dueLedger.desc", locale)} />
      <DataTable
        columns={columns}
        data={entries}
        searchColumns={[
          { key: "customer_name", placeholder: t("customers.dueLedger.searchName", locale) },
          { key: "mobile_number", placeholder: t("customers.dueLedger.searchMobile", locale) },
        ]}
      />
    </div>
  );
}

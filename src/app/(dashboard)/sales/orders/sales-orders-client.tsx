"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface SalesOrder {
  id: string;
  invoice_no: string | null;
  total: number;
  paid_amount: number;
  payment_method: string;
  sales_channel: string;
  status: string;
  order_date: string;
  customers: { name: string }[] | { name: string } | null;
  branches?: { name: string }[] | { name: string } | null;
  users?: { full_name: string }[] | { full_name: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-blue-500/10 text-blue-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-red-500/10 text-red-600",
};

const getName = (v: { name?: string; full_name?: string }[] | { name?: string; full_name?: string } | null | undefined) => {
  if (Array.isArray(v)) return v[0]?.name ?? v[0]?.full_name ?? "—";
  return v?.name ?? v?.full_name ?? "—";
};

const columns: ColumnDef<SalesOrder>[] = [
  {
    accessorKey: "invoice_no",
    header: "Invoice",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.invoice_no ?? "—"}</span>
    ),
  },
  {
    header: "Customer",
    cell: ({ row }) => getName(row.original.customers),
  },
  {
    header: "Salesperson",
    cell: ({ row }) => getName(row.original.users),
  },
  {
    accessorKey: "sales_channel",
    header: "Channel",
    cell: ({ row }) => <span className="uppercase">{row.original.sales_channel}</span>,
  },
  {
    accessorKey: "payment_method",
    header: "Payment",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.payment_method.replace("_", " ")}</span>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => `৳${Number(row.original.total).toFixed(2)}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={`${statusColors[row.original.status] ?? ""} border-0 capitalize`}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "order_date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.order_date).toLocaleString(),
  },
];

export function SalesOrdersClient({ orders }: { orders: SalesOrder[] }) {
  return (
    <DataTable
      columns={columns}
      data={orders}
      searchKey="invoice_no"
      searchPlaceholder="Search by invoice..."
    />
  );
}

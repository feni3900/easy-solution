"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface ReturnRow {
  id: string;
  quantity: number;
  reason: string | null;
  date: string;
  products?: { name: string } | null;
  sales_orders?: { invoice_no: string }[] | { invoice_no: string } | null;
}

const getName = (
  v: { invoice_no?: string }[] | { invoice_no?: string } | null | undefined
) => {
  if (Array.isArray(v)) return v[0]?.invoice_no ?? "—";
  return v?.invoice_no ?? "—";
};

const columns: ColumnDef<ReturnRow>[] = [
  {
    header: "Invoice",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{getName(row.original.sales_orders)}</span>
    ),
  },
  { header: "Product", cell: ({ row }) => row.original.products?.name ?? "—" },
  { accessorKey: "quantity", header: "Qty" },
  { accessorKey: "reason", header: "Reason" },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.date).toLocaleString(),
  },
];

export function SalesReturnsClient({ returns }: { returns: ReturnRow[] }) {
  return (
    <DataTable columns={columns} data={returns} searchKey="reason" />
  );
}

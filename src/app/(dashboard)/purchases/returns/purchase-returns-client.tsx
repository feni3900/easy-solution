"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface ReturnRow {
  id: string;
  quantity: number;
  reason: string | null;
  date: string;
  products?: { name: string } | null;
  purchases?: { purchase_no: string }[] | { purchase_no: string } | null;
}

const getName = (
  v: { purchase_no?: string }[] | { purchase_no?: string } | null | undefined
) => {
  if (Array.isArray(v)) return v[0]?.purchase_no ?? "—";
  return v?.purchase_no ?? "—";
};

const columns: ColumnDef<ReturnRow>[] = [
  {
    header: "Purchase",
    cell: ({ row }) => <span className="font-mono text-xs">{getName(row.original.purchases)}</span>,
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

export function PurchaseReturnsClient({ returns }: { returns: ReturnRow[] }) {
  return <DataTable columns={columns} data={returns} searchKey="reason" />;
}

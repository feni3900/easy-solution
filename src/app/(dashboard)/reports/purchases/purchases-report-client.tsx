"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface PurchaseRow {
  id: string;
  purchase_no: string | null;
  total: number;
  status: string;
  purchase_date: string;
  suppliers?: { name: string }[] | { name: string } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600",
  ordered: "bg-blue-500/10 text-blue-600",
  received: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-red-500/10 text-red-600",
};

const getName = (v: { name?: string }[] | { name?: string } | null | undefined) => {
  if (Array.isArray(v)) return v[0]?.name ?? "—";
  return v?.name ?? "—";
};

const columns: ColumnDef<PurchaseRow>[] = [
  {
    accessorKey: "purchase_no",
    header: "No.",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.purchase_no ?? "—"}</span>,
  },
  { header: "Supplier", cell: ({ row }) => getName(row.original.suppliers) },
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
    accessorKey: "purchase_date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.purchase_date).toLocaleDateString(),
  },
];

export function PurchasesReportClient({ rows }: { rows: PurchaseRow[] }) {
  return <DataTable columns={columns} data={rows} searchKey="purchase_no" />;
}

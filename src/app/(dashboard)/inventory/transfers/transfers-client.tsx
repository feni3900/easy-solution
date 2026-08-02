"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface TransferRow {
  id: string;
  quantity: number;
  created_at: string;
  products?: { name: string } | null;
  from_warehouses?: { name: string } | null;
  to_warehouses?: { name: string } | null;
}

const columns: ColumnDef<TransferRow>[] = [
  { header: "Product", cell: ({ row }) => row.original.products?.name ?? "—" },
  {
    header: "From",
    cell: ({ row }) => row.original.from_warehouses?.name ?? "—",
  },
  {
    header: "To",
    cell: ({ row }) => row.original.to_warehouses?.name ?? "—",
  },
  { accessorKey: "quantity", header: "Qty" },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
  },
];

export function TransfersClient({ transfers }: { transfers: TransferRow[] }) {
  return <DataTable columns={columns} data={transfers} searchKey="quantity" />;
}

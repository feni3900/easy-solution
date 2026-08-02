"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface DamageRow {
  id: string;
  quantity: number;
  reason: string | null;
  date: string;
  products?: { name: string } | null;
}

const columns: ColumnDef<DamageRow>[] = [
  { header: "Product", cell: ({ row }) => row.original.products?.name ?? "—" },
  { accessorKey: "quantity", header: "Qty" },
  { accessorKey: "reason", header: "Reason" },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.date).toLocaleString(),
  },
];

export function DamagesClient({ damages }: { damages: DamageRow[] }) {
  return <DataTable columns={columns} data={damages} searchKey="reason" />;
}

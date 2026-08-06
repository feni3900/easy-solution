"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { t, fmtInt } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface TransferRow {
  id: string;
  quantity: number;
  created_at: string;
  products?: { name: string } | null;
  from_warehouses?: { name: string } | null;
  to_warehouses?: { name: string } | null;
}

const makeColumns = (locale: Locale): ColumnDef<TransferRow>[] => [
  { header: t("sales.returns.product", locale), cell: ({ row }) => row.original.products?.name ?? "—" },
  {
    header: t("inventory.transfers.from", locale),
    cell: ({ row }) => row.original.from_warehouses?.name ?? "—",
  },
  {
    header: t("inventory.transfers.to", locale),
    cell: ({ row }) => row.original.to_warehouses?.name ?? "—",
  },
  { accessorKey: "quantity", header: t("app.qty", locale), cell: ({ row }) => fmtInt(row.original.quantity, locale) },
  {
    accessorKey: "created_at",
    header: t("app.date", locale),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
  },
];

export function TransfersClient({ transfers, locale }: { transfers: TransferRow[]; locale: Locale }) {
  return <DataTable columns={makeColumns(locale)} data={transfers} searchKey="quantity" />;
}

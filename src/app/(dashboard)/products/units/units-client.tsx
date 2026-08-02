"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";

interface Unit {
  id: string;
  name: string;
  symbol: string | null;
  status: string;
}

const columns: ColumnDef<Unit>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "symbol", header: "Symbol" },
  { accessorKey: "status", header: "Status" },
];

const config: CrudConfig<Unit> = {
  table: "units",
  title: "Unit",
  description: "Measurement units (Piece, Box, Kilogram...).",
  searchKey: "name",
  columns,
  defaultForm: { name: "", symbol: "", status: "active" },
  toForm: (u: Unit) => ({
    name: u.name,
    symbol: u.symbol ?? "",
    status: u.status,
  }),
  fields: [
    { name: "name", label: "Unit Name", required: true },
    { name: "symbol", label: "Symbol" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

export function UnitsClient({ rows }: { rows: Unit[] }) {
  return <CrudManager config={config} rows={rows} />;
}

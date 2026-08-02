"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";

interface CustomerGroup {
  id: string;
  name: string;
  discount_percent: number;
}

const columns: ColumnDef<CustomerGroup>[] = [
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "discount_percent",
    header: "Discount %",
    cell: ({ row }) => `${Number(row.original.discount_percent)}%`,
  },
];

const config: CrudConfig<CustomerGroup> = {
  table: "customer_groups",
  title: "Customer Group",
  description: "Groups with default discount percentages.",
  searchKey: "name",
  columns,
  defaultForm: { name: "", discount_percent: "0" },
  toForm: (g) => ({
    name: g.name,
    discount_percent: String(g.discount_percent),
  }),
  fields: [
    { name: "name", label: "Group Name", required: true },
    { name: "discount_percent", label: "Discount %" },
  ],
};

export function CustomerGroupsClient({ rows }: { rows: CustomerGroup[] }) {
  return <CrudManager config={config} rows={rows} />;
}

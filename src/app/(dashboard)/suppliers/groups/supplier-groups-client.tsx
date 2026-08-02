"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";

interface SupplierGroup {
  id: string;
  name: string;
}

const columns: ColumnDef<SupplierGroup>[] = [
  { accessorKey: "name", header: "Name" },
];

const config: CrudConfig<SupplierGroup> = {
  table: "supplier_groups",
  title: "Supplier Group",
  description: "Categorize suppliers.",
  searchKey: "name",
  columns,
  defaultForm: { name: "" },
  toForm: (g) => ({ name: g.name }),
  fields: [{ name: "name", label: "Group Name", required: true }],
};

export function SupplierGroupsClient({ rows }: { rows: SupplierGroup[] }) {
  return <CrudManager config={config} rows={rows} />;
}

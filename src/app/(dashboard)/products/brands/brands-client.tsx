"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";

interface Brand {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

const columns: ColumnDef<Brand>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "status", header: "Status" },
];

const config: CrudConfig<Brand> = {
  table: "brands",
  title: "Brand",
  description: "Brands your products belong to.",
  searchKey: "name",
  columns,
  defaultForm: { name: "", description: "", status: "active" },
  toForm: (b: Brand) => ({
    name: b.name,
    description: b.description ?? "",
    status: b.status,
  }),
  fields: [
    { name: "name", label: "Brand Name", required: true },
    { name: "description", label: "Description" },
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

export function BrandsClient({ rows }: { rows: Brand[] }) {
  return <CrudManager config={config} rows={rows} />;
}

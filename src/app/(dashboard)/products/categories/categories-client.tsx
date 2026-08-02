"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";

interface Category {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

const columns: ColumnDef<Category>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "status", header: "Status" },
];

const config: CrudConfig<Category> = {
  table: "categories",
  title: "Category",
  description: "Product categories (e.g. Perfume, Electronics, Stationery).",
  searchKey: "name",
  columns,
  defaultForm: { name: "", description: "", status: "active" },
  toForm: (c: Category) => ({
    name: c.name,
    description: c.description ?? "",
    status: c.status,
  }),
  fields: [
    { name: "name", label: "Category Name", required: true },
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

export function CategoriesClient({ rows }: { rows: Category[] }) {
  return <CrudManager config={config} rows={rows} />;
}

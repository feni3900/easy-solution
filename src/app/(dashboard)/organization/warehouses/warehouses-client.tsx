"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";

interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  status: string;
  branches?: { name: string } | null;
}

const columns: ColumnDef<Warehouse>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "location", header: "Location" },
  { accessorKey: "status", header: "Status" },
];

const config: CrudConfig<Warehouse> = {
  table: "warehouses",
  title: "Warehouse",
  description: "Stock locations tied to a branch.",
  searchKey: "name",
  columns,
  defaultForm: { branch_id: "", name: "", location: "", status: "active" },
  toForm: (w) => ({
    name: w.name,
    location: w.location ?? "",
    status: w.status,
  }),
  fields: [
    { name: "name", label: "Warehouse Name", required: true },
    { name: "location", label: "Location" },
    { name: "status", label: "Status", type: "select", options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]},
  ],
};

export function WarehousesClient({
  warehouses,
  branches,
}: {
  warehouses: Warehouse[];
  branches: { id: string; name: string }[];
}) {
  const configWithBranch: CrudConfig<Warehouse> = {
    ...config,
    fields: [
      {
        name: "branch_id",
        label: "Branch",
        type: "select",
        required: true,
        options: branches.map((b) => ({ value: b.id, label: b.name })),
      },
      ...config.fields,
    ],
    defaultForm: { ...config.defaultForm, branch_id: branches[0]?.id ?? "" },
  };

  return <CrudManager config={configWithBranch} rows={warehouses} />;
}

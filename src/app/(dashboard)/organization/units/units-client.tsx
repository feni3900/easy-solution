"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";

interface BusinessUnit {
  id: string;
  name: string;
  description: string | null;
  status: string;
  branches?: { name: string } | null;
}

const columns: ColumnDef<BusinessUnit>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "status", header: "Status" },
];

const config: CrudConfig<BusinessUnit> = {
  table: "business_units",
  title: "Business Unit",
  description: "Sub-divisions within a branch (e.g. Perfume, Electronics).",
  searchKey: "name",
  columns,
  defaultForm: { branch_id: "", name: "", description: "", status: "active" },
  toForm: (u) => ({
    name: u.name,
    description: u.description ?? "",
    status: u.status,
  }),
  fields: [
    { name: "name", label: "Unit Name", required: true },
    { name: "description", label: "Description" },
    { name: "status", label: "Status", type: "select", options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ]},
  ],
};

export function BusinessUnitsClient({
  units,
  branches,
}: {
  units: BusinessUnit[];
  branches: { id: string; name: string }[];
}) {
  const configWithBranch: CrudConfig<BusinessUnit> = {
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

  return <CrudManager config={configWithBranch} rows={units} />;
}

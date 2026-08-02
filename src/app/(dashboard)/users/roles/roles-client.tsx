"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  permissions: { module_name: string; access_level: string }[];
}

const columns: ColumnDef<RoleRow>[] = [
  {
    accessorKey: "name",
    header: "Role",
    cell: ({ row }) => (
      <span className="font-medium capitalize">{row.original.name.replace("_", " ")}</span>
    ),
  },
  { accessorKey: "description", header: "Description" },
  {
    header: "Permissions",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {(row.original.permissions ?? []).length} module(s)
      </span>
    ),
  },
];

export function RolesClient({ roles }: { roles: RoleRow[] }) {
  return <DataTable columns={columns} data={roles} searchKey="name" />;
}

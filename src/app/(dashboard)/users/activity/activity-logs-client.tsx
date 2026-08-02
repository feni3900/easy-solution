"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface LogRow {
  id: string;
  action: string;
  entity: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
  users?: { full_name: string } | null;
}

const columns: ColumnDef<LogRow>[] = [
  {
    accessorKey: "created_at",
    header: "Time",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
  },
  { header: "User", cell: ({ row }) => row.original.users?.full_name ?? "System" },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => <Badge variant="outline">{row.original.action}</Badge>,
  },
  { accessorKey: "entity", header: "Entity" },
  { accessorKey: "ip_address", header: "IP" },
];

export function ActivityLogsClient({ logs }: { logs: LogRow[] }) {
  return <DataTable columns={columns} data={logs} searchKey="action" />;
}

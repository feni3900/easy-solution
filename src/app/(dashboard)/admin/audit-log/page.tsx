"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { getClientLocale, t } from "@/lib/i18n";

interface AuditLogEntry {
  id: string;
  user_email: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
}

const makeColumns = (locale: "en" | "bn"): ColumnDef<AuditLogEntry>[] => [
  { accessorKey: "user_email", header: t("admin.auditLog.user", locale) },
  { accessorKey: "action", header: t("admin.auditLog.action", locale) },
  { accessorKey: "table_name", header: t("admin.auditLog.table", locale) },
  { accessorKey: "record_id", header: t("admin.auditLog.recordId", locale) },
  {
    accessorKey: "created_at",
    header: t("admin.auditLog.time", locale),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
  },
];

export default function AdminAuditLogPage() {
  const locale = getClientLocale();
  const columns = makeColumns(locale);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setLogs(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.auditLog.title", locale)} description={t("admin.auditLog.desc", locale)} />
      <DataTable columns={columns} data={logs} searchKey="user_email" />
    </div>
  );
}

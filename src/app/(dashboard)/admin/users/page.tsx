"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getClientLocale, t } from "@/lib/i18n";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const makeColumns = (locale: "en" | "bn"): ColumnDef<User>[] => [
  { accessorKey: "full_name", header: t("app.name", locale) },
  { accessorKey: "email", header: t("app.email", locale) },
  {
    accessorKey: "role",
    header: t("admin.users.role", locale),
    cell: ({ row }) => <Badge className="capitalize">{row.original.role}</Badge>,
  },
  {
    accessorKey: "is_active",
    header: t("app.status", locale),
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "default" : "secondary"}>
        {row.original.is_active ? t("app.active", locale) : t("app.inactive", locale)}
      </Badge>
    ),
  },
  {
    accessorKey: "created_at",
    header: t("admin.users.joined", locale),
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
];

export default function AdminUsersPage() {
  const locale = getClientLocale();
  const columns = makeColumns(locale);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUsers(data ?? []);
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
      <PageHeader title={t("admin.users.title", locale)} description={t("admin.users.desc", locale)} />
      <DataTable columns={columns} data={users} searchKey="full_name" />
    </div>
  );
}

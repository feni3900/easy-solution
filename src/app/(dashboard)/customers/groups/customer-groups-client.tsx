"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";
import { getClientLocale, t } from "@/lib/i18n";

interface CustomerGroup {
  id: string;
  name: string;
  discount_percent: number;
}

const makeColumns = (locale: "en" | "bn"): ColumnDef<CustomerGroup>[] => [
  { accessorKey: "name", header: t("app.name", locale) },
  {
    accessorKey: "discount_percent",
    header: t("customers.groups.discountPercent", locale),
    cell: ({ row }) => `${Number(row.original.discount_percent)}%`,
  },
];

const makeConfig = (locale: "en" | "bn"): CrudConfig<CustomerGroup> => ({
  table: "customer_groups",
  title: t("customers.groups.customerGroup", locale),
  description: t("customers.groups.groupDesc", locale),
  searchKey: "name",
  columns: makeColumns(locale),
  defaultForm: { name: "", discount_percent: "0" },
  toForm: (g) => ({
    name: g.name,
    discount_percent: String(g.discount_percent),
  }),
  fields: [
    { name: "name", label: t("customers.groups.name", locale), required: true },
    { name: "discount_percent", label: t("customers.groups.discountPercent", locale) },
  ],
});

export function CustomerGroupsClient({ rows }: { rows: CustomerGroup[] }) {
  const locale = getClientLocale();
  return <CrudManager config={makeConfig(locale)} rows={rows} />;
}

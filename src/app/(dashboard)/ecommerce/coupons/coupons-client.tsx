"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { t, fmtMoney, fmtInt } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  expiry_date: string | null;
  status: string;
}

const makeColumns = (locale: Locale): ColumnDef<Coupon>[] => [
  {
    accessorKey: "code",
    header: t("webstore.coupons.code", locale),
    cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span>,
  },
  { accessorKey: "discount_type", header: t("app.type", locale), cell: ({ row }) => <span className="capitalize">{row.original.discount_type}</span> },
  { accessorKey: "value", header: t("webstore.coupons.value", locale), cell: ({ row }) => row.original.discount_type === "percentage" ? `${fmtInt(Number(row.original.value), locale)}%` : fmtMoney(Number(row.original.value), locale) },
  {
    accessorKey: "expiry_date",
    header: t("webstore.coupons.expires", locale),
    cell: ({ row }) => (row.original.expiry_date ? new Date(row.original.expiry_date).toLocaleDateString() : "—"),
  },
  {
    accessorKey: "status",
    header: t("app.status", locale),
    cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>,
  },
];

const makeConfig = (locale: Locale): CrudConfig<Coupon> => ({
  table: "coupons",
  title: t("webstore.coupons.coupon", locale),
  description: t("webstore.coupons.description", locale),
  searchKey: "code",
  columns: makeColumns(locale),
  defaultForm: { code: "", discount_type: "percentage", value: "0", minimum_order: "0", expiry_date: "", status: "active" },
  toForm: (c) => ({
    code: c.code,
    discount_type: c.discount_type,
    value: String(c.value),
    expiry_date: c.expiry_date ?? "",
    status: c.status,
  }),
  fields: [
    { name: "code", label: t("webstore.coupons.couponCode", locale), required: true },
    {
      name: "discount_type",
      label: t("app.type", locale),
      type: "select",
      options: [
        { value: "flat", label: t("webstore.coupons.flatAmount", locale) },
        { value: "percentage", label: t("webstore.coupons.percentage", locale) },
      ],
    },
    { name: "value", label: t("webstore.coupons.value", locale) },
    { name: "expiry_date", label: t("webstore.coupons.expiryDate", locale) },
    {
      name: "status",
      label: t("app.status", locale),
      type: "select",
      options: [
        { value: "active", label: t("app.active", locale) },
        { value: "inactive", label: t("app.inactive", locale) },
      ],
    },
  ],
});

export function CouponsClient({ rows, locale }: { rows: Coupon[]; locale: Locale }) {
  return <CrudManager config={makeConfig(locale)} rows={rows} />;
}

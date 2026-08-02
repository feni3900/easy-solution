"use client";

import { CrudManager, type CrudConfig } from "@/components/crud-manager";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  value: number;
  expiry_date: string | null;
  status: string;
}

const columns: ColumnDef<Coupon>[] = [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span>,
  },
  { accessorKey: "discount_type", header: "Type", cell: ({ row }) => <span className="capitalize">{row.original.discount_type}</span> },
  { accessorKey: "value", header: "Value", cell: ({ row }) => row.original.discount_type === "percentage" ? `${Number(row.original.value)}%` : `৳${Number(row.original.value).toFixed(2)}` },
  {
    accessorKey: "expiry_date",
    header: "Expires",
    cell: ({ row }) => (row.original.expiry_date ? new Date(row.original.expiry_date).toLocaleDateString() : "—"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>,
  },
];

const config: CrudConfig<Coupon> = {
  table: "coupons",
  title: "Coupon",
  description: "Promo codes for the ecommerce store.",
  searchKey: "code",
  columns,
  defaultForm: { code: "", discount_type: "percentage", value: "0", minimum_order: "0", expiry_date: "", status: "active" },
  toForm: (c) => ({
    code: c.code,
    discount_type: c.discount_type,
    value: String(c.value),
    expiry_date: c.expiry_date ?? "",
    status: c.status,
  }),
  fields: [
    { name: "code", label: "Coupon Code", required: true },
    {
      name: "discount_type",
      label: "Type",
      type: "select",
      options: [
        { value: "flat", label: "Flat amount" },
        { value: "percentage", label: "Percentage" },
      ],
    },
    { name: "value", label: "Value" },
    { name: "expiry_date", label: "Expiry Date" },
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

export function CouponsClient({ rows }: { rows: Coupon[] }) {
  return <CrudManager config={config} rows={rows} />;
}

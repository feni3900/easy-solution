"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  date: string;
  status: string;
  products?: { name: string } | null;
  customers?: { name: string }[] | { name: string } | null;
}

const getName = (v: { name?: string }[] | { name?: string } | null | undefined) => {
  if (Array.isArray(v)) return v[0]?.name ?? "—";
  return v?.name ?? "—";
};

const makeColumns = (locale: Locale): ColumnDef<ReviewRow>[] => [
  { header: t("webstore.products.product", locale), cell: ({ row }) => row.original.products?.name ?? "—" },
  { header: t("app.customer", locale), cell: ({ row }) => getName(row.original.customers) },
  {
    accessorKey: "rating",
    header: t("webstore.reviews.rating", locale),
    cell: ({ row }) => "★".repeat(row.original.rating) + "☆".repeat(5 - row.original.rating),
  },
  { accessorKey: "comment", header: t("webstore.reviews.comment", locale) },
  {
    accessorKey: "status",
    header: t("app.status", locale),
    cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>,
  },
  {
    accessorKey: "date",
    header: t("app.date", locale),
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
  },
];

export function ReviewsClient({ reviews, locale }: { reviews: ReviewRow[]; locale: Locale }) {
  return <DataTable columns={makeColumns(locale)} data={reviews} searchKey="comment" />;
}

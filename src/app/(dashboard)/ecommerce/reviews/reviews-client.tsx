"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

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

const columns: ColumnDef<ReviewRow>[] = [
  { header: "Product", cell: ({ row }) => row.original.products?.name ?? "—" },
  { header: "Customer", cell: ({ row }) => getName(row.original.customers) },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => "★".repeat(row.original.rating) + "☆".repeat(5 - row.original.rating),
  },
  { accessorKey: "comment", header: "Comment" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge className="capitalize">{row.original.status}</Badge>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
  },
];

export function ReviewsClient({ reviews }: { reviews: ReviewRow[] }) {
  return <DataTable columns={columns} data={reviews} searchKey="comment" />;
}

"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  purchase_price: number;
  minimum_stock: number;
  product_variants?: { stock_quantity: number }[];
}

const columns: ColumnDef<ProductRow>[] = [
  { accessorKey: "name", header: "Product" },
  { accessorKey: "sku", header: "SKU" },
  {
    header: "Stock",
    cell: ({ row }) => {
      const stock = (row.original.product_variants ?? []).reduce(
        (s, v) => s + Number(v.stock_quantity ?? 0),
        0
      );
      return <Badge variant={stock <= Number(row.original.minimum_stock) ? "destructive" : "default"}>{stock}</Badge>;
    },
  },
  {
    header: "Min Stock",
    cell: ({ row }) => Number(row.original.minimum_stock),
  },
  {
    header: "Cost",
    cell: ({ row }) => `৳${Number(row.original.purchase_price).toFixed(2)}`,
  },
  {
    header: "Price",
    cell: ({ row }) => `৳${Number(row.original.selling_price).toFixed(2)}`,
  },
];

export function InventoryReportClient({ products }: { products: ProductRow[] }) {
  return (
    <DataTable columns={columns} data={products} searchKey="name" />
  );
}

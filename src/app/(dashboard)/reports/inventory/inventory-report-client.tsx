"use client";

import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { getClientLocale, t, fmtMoney, fmtInt } from "@/lib/i18n";

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
  purchase_price: number;
  minimum_stock: number;
  product_variants?: { stock_quantity: number }[];
}

const makeColumns = (locale: "en" | "bn"): ColumnDef<ProductRow>[] => [
  { accessorKey: "name", header: t("sales.returns.product", locale) },
  { accessorKey: "sku", header: t("app.sku", locale) },
  {
    header: t("inventory.products.stock", locale),
    cell: ({ row }) => {
      const stock = (row.original.product_variants ?? []).reduce(
        (s, v) => s + Number(v.stock_quantity ?? 0),
        0
      );
      return <Badge variant={stock <= Number(row.original.minimum_stock) ? "destructive" : "default"}>{fmtInt(stock, locale)}</Badge>;
    },
  },
  {
    header: t("reports.minStock", locale),
    cell: ({ row }) => fmtInt(Number(row.original.minimum_stock), locale),
  },
  {
    header: t("app.cost", locale),
    cell: ({ row }) => fmtMoney(Number(row.original.purchase_price), locale),
  },
  {
    header: t("app.price", locale),
    cell: ({ row }) => fmtMoney(Number(row.original.selling_price), locale),
  },
];

export function InventoryReportClient({ products }: { products: ProductRow[] }) {
  const locale = getClientLocale();
  const columns = makeColumns(locale);
  return (
    <DataTable columns={columns} data={products} searchKey="name" />
  );
}

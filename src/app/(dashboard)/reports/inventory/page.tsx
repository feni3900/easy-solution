"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

interface Product {
  product_id: number;
  product_name: string;
  sku: string | null;
  selling_price: number;
  cost_price: number;
  min_stock_threshold: number;
  current_stock: number;
}

const columns: ColumnDef<Product>[] = [
  { accessorKey: "product_name", header: "Product" },
  { accessorKey: "sku", header: "SKU" },
  {
    accessorKey: "cost_price",
    header: "Cost",
    cell: ({ row }) => `৳${Number(row.original.cost_price).toFixed(2)}`,
  },
  {
    accessorKey: "selling_price",
    header: "Price",
    cell: ({ row }) => `৳${Number(row.original.selling_price).toFixed(2)}`,
  },
  {
    accessorKey: "current_stock",
    header: "Stock",
    cell: ({ row }) => (
      <span className={row.original.current_stock <= row.original.min_stock_threshold ? "text-destructive font-medium" : ""}>
        {row.original.current_stock}
      </span>
    ),
  },
  { accessorKey: "min_stock_threshold", header: "Min Stock" },
];

export default function InventoryReportPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: purchasedRows } = await supabase.from("purchase_items").select("product_id");
      const purchasedIds = Array.from(new Set((purchasedRows ?? []).map((r) => r.product_id)));
      if (purchasedIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("product_id, product_name, sku, selling_price, cost_price, min_stock_threshold, current_stock")
        .in("product_id", purchasedIds)
        .order("product_name");
      setProducts(data ?? []);
      setLoading(false);
    })();
  }, []);

  const stockValue = products.reduce((s, p) => s + p.current_stock * Number(p.cost_price), 0);
  const lowStockCount = products.filter((p) => p.current_stock <= Number(p.min_stock_threshold)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Report" description="Stock summary and valuation" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Products" value={String(products.length)} />
        <StatCard title="Stock Value (Cost)" value={`৳${stockValue.toFixed(2)}`} />
        <StatCard
          title="Low Stock Items"
          value={String(lowStockCount)}
          variant={lowStockCount > 0 ? "destructive" : "default"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={products} searchKey="product_name" />
        </CardContent>
      </Card>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { InventoryReportClient } from "./inventory-report-client";

export const metadata = { title: "Inventory Report | Smart Solution ERP" };

export default async function InventoryReportPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, sku, selling_price, purchase_price, minimum_stock, product_variants(stock_quantity)")
    .order("name");

  const products = (data ?? []) as {
    id: string;
    name: string;
    sku: string | null;
    selling_price: number;
    purchase_price: number;
    minimum_stock: number;
    product_variants?: { stock_quantity: number }[];
  }[];
  const stockValue = products.reduce((s, p) => {
    const stock = (p.product_variants ?? []).reduce((x, v) => x + Number(v.stock_quantity ?? 0), 0);
    return s + stock * Number(p.purchase_price);
  }, 0);
  const lowStockCount = products.filter((p) => {
    const stock = (p.product_variants ?? []).reduce((x, v) => x + Number(v.stock_quantity ?? 0), 0);
    return stock <= Number(p.minimum_stock);
  }).length;

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
          <InventoryReportClient products={products} />
        </CardContent>
      </Card>
    </div>
  );
}

import { Suspense } from "react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Package,
  Wallet,
  AlertTriangle,
  TrendingUp,
  ArrowDownRight,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { LowStockList } from "@/components/dashboard/low-stock";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00.000Z`;

  const [salesRes, productRes, stockRes, ordersRes, lowStockRes] =
    await Promise.all([
      supabase
        .from("sales_orders")
        .select("total, payment_method")
        .gte("order_date", todayStart),
      supabase.from("products").select("id"),
      supabase
        .from("inventory_ledger")
        .select("quantity"),
      supabase
        .from("sales_orders")
        .select("id, invoice_no, total, customer_id, order_date, status, sales_channel, customers(name)")
        .order("order_date", { ascending: false })
        .limit(5),
      supabase
        .from("products")
        .select("id, name, minimum_stock, selling_price, product_variants(stock_quantity)")
        .limit(200),
    ]);

  const todaySales = salesRes.data ?? [];
  const totalToday = todaySales.reduce((s, o) => s + Number(o.total), 0);
  const cashToday = todaySales
    .filter((o) => o.payment_method === "cash")
    .reduce((s, o) => s + Number(o.total), 0);

  const products = productRes.data ?? [];
  const stockRows = stockRes.data ?? [];
  const stockIn = stockRows.filter((r) => Number(r.quantity) > 0).reduce((s, r) => s + Number(r.quantity), 0);
  const stockOut = stockRows.filter((r) => Number(r.quantity) < 0).reduce((s, r) => s + Math.abs(Number(r.quantity)), 0);

  const lowStock = (lowStockRes.data ?? []).filter((p) => {
    const variantStock = (p.product_variants ?? []).reduce(
      (s: number, v: { stock_quantity: number }) => s + Number(v.stock_quantity ?? 0),
      0
    );
    return Number(p.minimum_stock) > 0 && variantStock <= Number(p.minimum_stock);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {profile.full_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening in your business today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={`৳${totalToday.toFixed(2)}`}
          icon={<ShoppingCart className="size-4" />}
          description={`${todaySales.length} orders · Cash ৳${cashToday.toFixed(2)}`}
        />
        <StatCard
          title="Products"
          value={String(products.length)}
          icon={<Package className="size-4" />}
          description="Active inventory items"
        />
        <StatCard
          title="Stock Movement"
          value={`+${stockIn.toFixed(0)} / -${stockOut.toFixed(0)}`}
          icon={<TrendingUp className="size-4" />}
          description="Units in vs out"
        />
        <StatCard
          title="Low Stock Alerts"
          value={String(lowStock.length)}
          icon={<AlertTriangle className="size-4" />}
          description="Products below threshold"
          variant={lowStock.length > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <RecentOrders orders={ordersRes.data ?? []} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <LowStockList products={lowStock} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Cash In (Today)"
              value={`৳${cashToday.toFixed(2)}`}
              icon={<ArrowDownRight className="size-4" />}
              description="POS + online cash"
            />
            <StatCard
              title="Total Stock Value (Cost)"
              value={`৳0.00`}
              icon={<Wallet className="size-4" />}
              description="Coming soon"
            />
            <StatCard
              title="Gross Profit"
              value={`৳0.00`}
              icon={<TrendingUp className="size-4" />}
              description="Coming soon"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

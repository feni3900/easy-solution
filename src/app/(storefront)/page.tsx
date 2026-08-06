import { createClient } from "@/lib/supabase/server";
import { getWebSettings } from "@/lib/store";
import Link from "next/link";
import { ArrowRight, Truck, BadgePercent, Package, Clock, TrendingUp, Star } from "lucide-react";

export default async function StorefrontHome() {
  const supabase = await createClient();

  const [{ data: section1 }, { data: products }, { data: topSelling }, webSettings] = await Promise.all([
    supabase
      .from("page_sections")
      .select("*")
      .eq("page_name", "home")
      .eq("section_number", 1)
      .single(),
    supabase
      .from("products")
      .select("product_id, product_name, selling_price, image_url, is_popular, current_stock, category_id, size, unit, brands(brand_name)")
      .eq("is_active", true)
      .order("product_name")
      .limit(30),
    supabase
      .from("stock_journal")
      .select("product_id")
      .in("movement_type", ["Sale_POS", "Sale_Online"]),
    getWebSettings(),
  ]);

  const allProducts = products ?? [];

  // Coming Soon: active products with 0 stock
  const comingSoon = allProducts.filter((p) => p.current_stock === 0).slice(0, 8);

  // Popular: products marked as popular
  const popular = allProducts.filter((p) => p.is_popular).slice(0, 8);

  // Top Sell: count sales from stock_journal
  const salesCount: Record<number, number> = {};
  (topSelling ?? []).forEach((row) => {
    salesCount[row.product_id] = (salesCount[row.product_id] || 0) + 1;
  });
  const topSellIds = Object.entries(salesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => Number(id));
  const topSell = topSellIds
    .map((id) => allProducts.find((p) => p.product_id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 8);

  const bulkDiscountPct = webSettings?.bulk_discount_percent ?? 20;
  const bulkDiscountMin = webSettings?.bulk_discount_min_items ?? 6;

  return (
    <div>
      {/* Hero / Banner */}
      <section className="relative">
        {section1?.banner_image_url ? (
          <>
            <img
              src={section1.banner_image_url}
              alt={section1.hero_title ?? "Banner"}
              className="h-[70vh] w-full object-cover object-bottom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-start pt-20 gap-4 px-4 text-center">
              <h1 className="max-w-3xl text-3xl font-bold text-white sm:text-5xl">
                {section1.hero_title ?? "Smart ERP Store"}
              </h1>
              <p className="max-w-xl text-xl sm:text-2xl text-white/90">
                {section1.hero_subtitle ?? "Quality Products, Best Prices"}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Shop Now <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                {section1?.hero_title ?? "Smart ERP Store"}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                {section1?.hero_subtitle ?? "Quality Products, Best Prices — Shop with confidence"}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Shop Now <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="size-5" />
            </div>
            <div>
              <p className="font-medium">{section1?.col1_title ?? "Fast Delivery"}</p>
              <p className="text-sm text-muted-foreground">{section1?.col1_desc ?? "Quick courier delivery nationwide"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BadgePercent className="size-5" />
            </div>
            <div>
              <p className="font-medium">{section1?.col2_title ?? "Bulk Discounts"}</p>
              <p className="text-sm text-muted-foreground">{section1?.col2_desc ?? "Save up to 20% on 12+ items"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <p className="font-medium">{section1?.col3_title ?? "Quality Products"}</p>
              <p className="text-sm text-muted-foreground">{section1?.col3_desc ?? "100% authentic products"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Sell */}
      {comingSoon.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl flex items-center gap-2">
              <Clock className="size-5 text-blue-500" /> Hot Sell
            </h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comingSoon.map((p) => (
              <Link
                key={p.product_id}
                href={`/product/${p.product_id}`}
                className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="size-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary">{p.product_name}</h3>
                <p className="mt-1 flex items-center gap-2">
                  <span className="font-semibold">৳{Number(p.selling_price).toFixed(2)}</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                    {bulkDiscountPct}% off {bulkDiscountMin}+
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular Products */}
      {popular.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl flex items-center gap-2">
              <Star className="size-5 text-yellow-500" /> Popular Products
            </h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((p) => (
              <Link
                key={p.product_id}
                href={`/product/${p.product_id}`}
                className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="size-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary">{p.product_name}</h3>
                <p className="mt-1 flex items-center gap-2">
                  <span className="font-semibold">৳{Number(p.selling_price).toFixed(2)}</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                    {bulkDiscountPct}% off {bulkDiscountMin}+
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top Selling */}
      {topSell.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl flex items-center gap-2">
              <TrendingUp className="size-5 text-red-500" /> Top Selling
            </h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topSell.map((p) => (
              <Link
                key={p.product_id}
                href={`/product/${p.product_id}`}
                className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="size-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary">{p.product_name}</h3>
                <p className="mt-1 flex items-center gap-2">
                  <span className="font-semibold">৳{Number(p.selling_price).toFixed(2)}</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                    {bulkDiscountPct}% off {bulkDiscountMin}+
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h2 className="text-xl font-semibold sm:text-2xl">Browse the Full Catalog</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Every product in our catalog is available with cash on delivery.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Shop <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}

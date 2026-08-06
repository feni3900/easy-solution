import { createClient } from "@/lib/supabase/server";
import { getWebSettings } from "@/lib/store";
import Link from "next/link";
import { Package, Search } from "lucide-react";
import ShopFilters from "./shop-filters";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; brand?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("product_id, product_name, sku, selling_price, image_url, current_stock, is_active, size, unit, storage_location, categories(category_name), brands(brand_name)")
    .eq("is_active", true)
    .order("product_name");

  if (params.q) {
    query = query.or(`product_name.ilike.%${params.q}%,sku.ilike.%${params.q}%`);
  }
  if (params.category) {
    query = query.eq("category_id", params.category);
  }
  if (params.brand) {
    query = query.eq("brand_id", params.brand);
  }

  const { data: products } = await query;
  const allProducts = products ?? [];

  const [{ data: categories }, { data: brands }, webSettings] = await Promise.all([
    supabase.from("categories").select("category_id, category_name").eq("is_active", true).order("category_name"),
    supabase.from("brands").select("brand_id, brand_name").eq("is_active", true).order("brand_name"),
    getWebSettings(),
  ]);

  const bulkDiscountPct = webSettings?.bulk_discount_percent ?? 20;
  const bulkDiscountMin = webSettings?.bulk_discount_min_items ?? 6;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Shop</h1>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <form className="flex-1 relative" action="/shop" method="get">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            placeholder="Search products..."
            defaultValue={params.q}
            className="w-full rounded-lg border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </form>
        <ShopFilters
          categories={(categories ?? []).map((c) => ({ id: c.category_id, label: c.category_name }))}
          brands={(brands ?? []).map((b) => ({ id: b.brand_id, label: b.brand_name }))}
          category={params.category ?? ""}
          brand={params.brand ?? ""}
        />
      </div>

      {/* Product Grid */}
      {allProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No products found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allProducts.map((p) => (
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
              <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary">
                {p.product_name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {(Array.isArray(p.categories) ? p.categories[0]?.category_name : (p.categories as { category_name?: string } | null)?.category_name) ?? ""}
                {(Array.isArray(p.brands) ? p.brands[0]?.brand_name : (p.brands as { brand_name?: string } | null)?.brand_name) ? ` · ${Array.isArray(p.brands) ? p.brands[0]?.brand_name : (p.brands as { brand_name?: string } | null)?.brand_name}` : ""}
                {p.size ? ` · ${p.size}` : ""}
                {p.unit ? ` ${p.unit}` : ""}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">৳{Number(p.selling_price).toFixed(2)}</p>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                    {bulkDiscountPct}% off {bulkDiscountMin}+
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.current_stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {p.current_stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

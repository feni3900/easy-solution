import { createClient } from "@/lib/supabase/server";
import { getWebSettings } from "@/lib/store";
import { Search } from "lucide-react";
import ShopFilters from "./shop-filters";
import ProductView from "./product-view";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; brand?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const locale = await getLocale();

  const [{ data: purchased }, { data: categories }, { data: brands }, webSettings] = await Promise.all([
    supabase.from("purchase_items").select("product_id"),
    supabase.from("categories").select("category_id, category_name").eq("is_active", true).order("category_name"),
    supabase.from("brands").select("brand_id, brand_name").eq("is_active", true).order("brand_name"),
    getWebSettings(),
  ]);

  const purchasedIds = Array.from(new Set((purchased ?? []).map((r) => r.product_id)));

  let query = supabase
    .from("products")
    .select("product_id, product_name, sku, selling_price, image_url, current_stock, is_active, size, unit, storage_location, categories(category_name), brands(brand_name)")
    .eq("is_active", true)
    .order("product_name");

  if (purchasedIds.length > 0) {
    query = query.in("product_id", purchasedIds);
  } else {
    query = query.eq("product_id", -1);
  }

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

  const bulkDiscountPct = webSettings?.bulk_discount_percent ?? 20;
  const bulkDiscountMin = webSettings?.bulk_discount_min_items ?? 6;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">{t("store.shop.title", locale)}</h1>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <form className="flex-1 relative" action="/shop" method="get">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            placeholder={t("store.searchPlaceholder", locale)}
            defaultValue={params.q}
            className="w-full rounded-lg border bg-card pl-10 pr-4 py-2 text-sm"
          />
        </form>
        <ShopFilters
          locale={locale}
          categories={(categories ?? []).map((c) => ({ id: c.category_id, label: c.category_name }))}
          brands={(brands ?? []).map((b) => ({ id: b.brand_id, label: b.brand_name }))}
          category={params.category ?? ""}
          brand={params.brand ?? ""}
        />
      </div>

      {/* Product Grid */}
      {allProducts.length === 0 ? (
        <div className="text-center py-16">
          <Search className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t("store.noProducts", locale)}</p>
        </div>
      ) : (
        <ProductView
          products={allProducts}
          locale={locale}
          bulkDiscountPct={bulkDiscountPct}
          bulkDiscountMin={bulkDiscountMin}
        />
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getWebSettings } from "@/lib/store";
import { HeroSlider } from "@/components/storefront/hero-slider";
import Link from "next/link";
import { ArrowRight, Truck, BadgePercent, Package, Clock, TrendingUp, Star } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";
import { t, fmtMoney, fmtInt, translateWithVars } from "@/lib/i18n";

export default async function StorefrontHome() {
  const supabase = await createClient();
  const locale = await getLocale();

  const [{ data: homeSections }, { data: purchased }, { data: topSelling }, webSettings] = await Promise.all([
    supabase
      .from("page_sections")
      .select("*")
      .eq("page_name", "home")
      .order("section_number"),
    supabase.from("purchase_items").select("product_id"),
    supabase
      .from("stock_journal")
      .select("product_id")
      .in("movement_type", ["Sale_POS", "Sale_Online"]),
    getWebSettings(),
  ]);

  const section1 = (homeSections ?? []).find((s) => s.section_number === 1) ?? null;

  const purchasedIds = Array.from(new Set((purchased ?? []).map((r) => r.product_id)));
  let productQuery = supabase
    .from("products")
    .select("product_id, product_name, selling_price, image_url, is_popular, current_stock, category_id, size, unit, brands(brand_name)")
    .eq("is_active", true)
    .order("product_name")
    .limit(30);
  if (purchasedIds.length > 0) {
    productQuery = productQuery.in("product_id", purchasedIds);
  } else {
    productQuery = productQuery.eq("product_id", -1);
  }
  const { data: products } = await productQuery;

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
      {/* Hero / Banner Slider */}
      <HeroSlider
        slides={(homeSections ?? [])
          .filter((s) => s.banner_image_url)
          .map((s) => ({
            image: s.banner_image_url,
            title: s.hero_title,
            subtitle: s.hero_subtitle,
          }))}
      />
      {section1 && (
<section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="size-5" />
            </div>
            <div>
              <p className="font-medium">{section1?.col1_title ?? t("store.home.fastDelivery", locale)}</p>
              <p className="text-sm text-muted-foreground">{section1?.col1_desc ?? t("store.home.fastDeliveryDesc", locale)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BadgePercent className="size-5" />
            </div>
            <div>
              <p className="font-medium">{section1?.col2_title ?? t("store.home.authenticProducts", locale)}</p>
              <p className="text-sm text-muted-foreground">{section1?.col2_desc ?? t("store.home.authenticProductsDesc", locale)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-5" />
            </div>
            <div>
              <p className="font-medium">{section1?.col3_title ?? t("store.home.securePayment", locale)}</p>
              <p className="text-sm text-muted-foreground">{section1?.col3_desc ?? t("store.home.securePaymentDesc", locale)}</p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Hot Sell */}
      {comingSoon.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl flex items-center gap-2">
              <Clock className="size-5 text-blue-500" /> {t("store.home.hotSell", locale)}
            </h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              {t("store.home.viewAll", locale)} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                  <span className="font-semibold">{fmtMoney(Number(p.selling_price), locale)}</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                    {translateWithVars(t("store.bulkOff", locale), { p: fmtInt(bulkDiscountPct, locale), m: fmtInt(bulkDiscountMin, locale) })}
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
              <Star className="size-5 text-yellow-500" /> {t("store.home.popular", locale)}
            </h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              {t("store.home.viewAll", locale)} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                  <span className="font-semibold">{fmtMoney(Number(p.selling_price), locale)}</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                    {translateWithVars(t("store.bulkOff", locale), { p: fmtInt(bulkDiscountPct, locale), m: fmtInt(bulkDiscountMin, locale) })}
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
              <TrendingUp className="size-5 text-red-500" /> {t("store.home.topSelling", locale)}
            </h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              {t("store.home.viewAll", locale)} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                  <span className="font-semibold">{fmtMoney(Number(p.selling_price), locale)}</span>
                  <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                    {translateWithVars(t("store.bulkOff", locale), { p: fmtInt(bulkDiscountPct, locale), m: fmtInt(bulkDiscountMin, locale) })}
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h2 className="text-xl font-semibold sm:text-2xl">{t("store.home.browseCatalog", locale)}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          {t("store.home.browseCatalogDesc", locale)}
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("store.home.goToShop", locale)} <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getWebSettings } from "@/lib/store";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { AddToCartButton } from "./add-to-cart-button";
import { getLocale } from "@/lib/i18n-server";
import { t, fmtMoney, fmtInt, translateWithVars } from "@/lib/i18n";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = await getLocale();

  const [{ data: purchased }, webSettings] = await Promise.all([
    supabase.from("purchase_items").select("product_id"),
    getWebSettings(),
  ]);

  const purchasedIds = Array.from(new Set((purchased ?? []).map((r) => r.product_id)));

  let productQuery = supabase
    .from("products")
    .select("*, categories(category_name), brands(brand_name), product_variants(*)")
    .eq("product_id", id)
    .eq("is_active", true);
  if (purchasedIds.length > 0) {
    productQuery = productQuery.in("product_id", purchasedIds);
  } else {
    productQuery = productQuery.eq("product_id", -1);
  }
  const { data: product } = await productQuery.single();

  if (!product) notFound();

  const bulkDiscountPct = webSettings?.bulk_discount_percent ?? 20;
  const bulkDiscountMin = webSettings?.bulk_discount_min_items ?? 6;

  const category = product.categories as { category_name?: string } | null;
  const brand = product.brands as { brand_name?: string } | null;
  const variants = (product.product_variants ?? []) as {
    variant_id: number;
    variant_key: string;
    variant_value: string;
    sku_override: string | null;
    stock_adjustment: number;
    price_adjustment: number;
  }[];

  const effectiveStock = product.current_stock + variants.reduce((s, v) => s + (v.stock_adjustment ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="size-4" /> {t("store.product.backToShop", locale)}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.product_name} className="h-full w-full object-cover" />
          ) : (
            <Package className="size-24 text-muted-foreground" />
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {category?.category_name ?? ""} {brand?.brand_name ? `· ${brand.brand_name}` : ""}
            </p>
            <h1 className="text-2xl font-bold mt-1">{product.product_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("store.product.sku", locale)}: {product.sku}</p>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">{fmtMoney(Number(product.selling_price), locale)}</p>
            <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
              {translateWithVars(t("store.bulkOff", locale), { p: fmtInt(bulkDiscountPct, locale), m: fmtInt(bulkDiscountMin, locale) })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-0.5 rounded-full ${effectiveStock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {effectiveStock > 0
                ? translateWithVars(t("store.product.inStockCount", locale), { n: fmtInt(effectiveStock, locale) })
                : t("store.product.outOfStock", locale)}
            </span>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          {variants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">{t("store.product.variants", locale)}</h3>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v) => (
                  <div key={v.variant_id} className="rounded-md border p-2 text-sm">
                    <span className="font-medium">{v.variant_key}:</span> {v.variant_value}
                    {v.price_adjustment !== 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({fmtMoney(Number(product.selling_price + v.price_adjustment), locale)})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <AddToCartButton
            productId={product.product_id}
            productName={product.product_name}
            price={Number(product.selling_price)}
            inStock={effectiveStock > 0}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

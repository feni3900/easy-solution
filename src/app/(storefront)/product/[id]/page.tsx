import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { AddToCartButton } from "./add-to-cart-button";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, categories(category_name), brands(brand_name), product_variants(*)")
    .eq("product_id", id)
    .eq("is_active", true)
    .single();

  if (!product) notFound();

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
        <ArrowLeft className="size-4" /> Back to Shop
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
            <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
          </div>

          <p className="text-3xl font-bold">৳{Number(product.selling_price).toFixed(2)}</p>

          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-0.5 rounded-full ${effectiveStock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {effectiveStock > 0 ? `${effectiveStock} in stock` : "Out of stock"}
            </span>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          {variants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Variants</h3>
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v) => (
                  <div key={v.variant_id} className="rounded-md border p-2 text-sm">
                    <span className="font-medium">{v.variant_key}:</span> {v.variant_value}
                    {v.price_adjustment !== 0 && (
                      <span className="text-muted-foreground ml-1">
                        (৳{Number(product.selling_price + v.price_adjustment).toFixed(2)})
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
          />
        </div>
      </div>
    </div>
  );
}

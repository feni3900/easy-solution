import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Star, Truck, BadgePercent } from "lucide-react";
import Link from "next/link";
import { AddToCart } from "./add-to-cart";
import { bulkDiscountPct } from "@/app/cart/cart-storage";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, barcode, sku, selling_price, purchase_price, minimum_stock, image, status, is_coming_soon, is_popular, is_best_seller, categories(name), brands(name), product_variants(id, name, additional_price, stock_quantity)"
    )
    .eq("id", id)
    .single();

  if (!product || product.status !== "active") notFound();

  const categories = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;
  const brands = Array.isArray(product.brands) ? product.brands[0] : product.brands;

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, date")
    .eq("product_id", id)
    .eq("status", "approved");

  const avgRating = (reviews ?? []).length
    ? (reviews ?? []).reduce((s, r) => s + r.rating, 0) / (reviews ?? []).length
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/shop" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        ← Back to shop
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-8xl">📦</span>
          )}
        </div>
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {categories && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {categories.name}
              </span>
            )}
            {brands && (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {brands.name}
              </span>
            )}
            {product.is_popular && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                Popular
              </span>
            )}
            {product.is_best_seller && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Best Seller
              </span>
            )}
            {product.is_coming_soon && (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Coming Soon
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex gap-0.5 text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`size-4 ${i < Math.round(avgRating) ? "fill-yellow-500" : ""}`} />
              ))}
            </span>
            <span className="text-muted-foreground">({reviews?.length ?? 0} reviews)</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-primary">৳{Number(product.selling_price).toFixed(2)}</p>

          <div className="mt-5 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Truck className="size-4" />
              Cash on delivery available — pay when your order arrives.
            </p>
            <p className="flex items-center gap-2">
              <BadgePercent className="size-4" />
              Bulk discount: 5% on 6+, 10% on 12+, 15% on 24+ items.
            </p>
          </div>

          <div className="mt-8">
            <AddToCart
              productId={product.id}
              name={product.name}
              price={Number(product.selling_price)}
              image={product.image}
              comingSoon={product.is_coming_soon}
            />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
        {(reviews ?? []).length === 0 ? (
          <p className="text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {(reviews ?? []).map((r, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-1 flex gap-0.5 text-yellow-500">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`size-4 ${j < r.rating ? "fill-yellow-500" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <p className="text-sm">{r.comment}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

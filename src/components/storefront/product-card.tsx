import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export interface ShopProduct {
  id: string;
  name: string;
  selling_price: number;
  image: string | null;
  minimum_stock: number;
  is_coming_soon: boolean;
  categories?: { name: string }[] | { name: string } | null;
  brands?: { name: string }[] | { name: string } | null;
}

const catName = (v: { name: string }[] | { name: string } | null | undefined) =>
  Array.isArray(v) ? v[0]?.name : v?.name;

export function ProductCard({ p }: { p: ShopProduct }) {
  return (
    <Link
      href={`/product/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:border-primary hover:shadow-md"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image}
            alt={p.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <span className="text-5xl">📦</span>
        )}
        {p.is_coming_soon && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Coming Soon
          </span>
        )}
        {catName(p.categories) && (
          <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {catName(p.categories)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary">
          {p.name}
        </h3>
        {catName(p.brands) && (
          <p className="text-xs text-muted-foreground">{catName(p.brands)}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-primary">
            ৳{Number(p.selling_price).toFixed(2)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShoppingCart className="size-3" />
            Order
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ShopProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}

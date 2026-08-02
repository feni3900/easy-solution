import { createClient } from "@/lib/supabase/server";
import { ProductGrid, type ShopProduct } from "@/components/storefront/product-card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getStoreContext } from "@/lib/store";

const SELECT = "id, name, selling_price, image, minimum_stock, is_coming_soon, categories(name), brands(name)";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  const supabase = await createClient();
  const { active } = await getStoreContext();

  const query = q.trim().toLowerCase();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(SELECT)
      .eq("status", "active")
      .eq("branch_id", active.id)
      .order("name"),
    supabase.from("categories").select("id, name").eq("status", "active").order("name"),
  ]);

  let rows = (products ?? []) as ShopProduct[];
  if (query) rows = rows.filter((p) => p.name.toLowerCase().includes(query));
  if (category) {
    const cname = categories?.find((c) => c.id === category)?.name;
    if (cname) {
      rows = rows.filter((p) => {
        const n = Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name;
        return n === cname;
      });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
        <form action="/shop" method="GET" className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search products..."
            className="pl-9"
          />
          {category && <input type="hidden" name="category" value={category} />}
        </form>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="/shop"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            !category ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          All
        </a>
        {categories?.map((c) => (
          <a
            key={c.id}
            href={`/shop?category=${c.id}`}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              category === c.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {c.name}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border py-20 text-center">
          <p className="text-muted-foreground">
            {query || category
              ? "No products match your filters."
              : "No products available yet."}
          </p>
        </div>
      ) : (
        <ProductGrid products={rows} />
      )}
    </div>
  );
}

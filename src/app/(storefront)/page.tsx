import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, Truck, BadgePercent, Package } from "lucide-react";
import { ProductGrid, type ShopProduct } from "@/components/storefront/product-card";
import { getStoreContext } from "@/lib/store";

const SELECT = "id, name, selling_price, image, minimum_stock, is_coming_soon, categories(name), brands(name)";

interface ProductRow {
  id: string;
  name: string;
  selling_price: number;
  image: string | null;
  minimum_stock: number;
  is_coming_soon: boolean;
  categories?: { name: string }[] | { name: string } | null;
  brands?: { name: string }[] | { name: string } | null;
}

const toShop = (p: ProductRow): ShopProduct => p;

export default async function StorefrontHome() {
  const supabase = await createClient();
  const { active } = await getStoreContext();

  const { data: popular } = await supabase
    .from("products")
    .select(SELECT)
    .eq("status", "active")
    .eq("branch_id", active.id)
    .eq("is_popular", true)
    .order("name")
    .limit(8);

  const { data: bestSellers } = await supabase
    .from("products")
    .select(SELECT)
    .eq("status", "active")
    .eq("branch_id", active.id)
    .eq("is_best_seller", true)
    .order("name")
    .limit(8);

  const { data: comingSoon } = await supabase
    .from("products")
    .select(SELECT)
    .eq("status", "active")
    .eq("branch_id", active.id)
    .eq("is_coming_soon", true)
    .order("name")
    .limit(8);

  return (
    <div>
      <section className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/home-banner.png" alt="Home banner" className="h-auto w-full" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4 text-center">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] sm:text-5xl">
            Discover Premium Fragrances &amp; Smart Gadgets
          </h1>
          <p className="max-w-xl text-gray-100 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
            Explore our exclusive collection of oil-based perfumes, spray
            perfumes, mobile gadgets, speakers, and premium accessories—all in
            one place.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Shop Now
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Cash on Delivery", desc: "Pay when it arrives" },
            { icon: BadgePercent, title: "Bulk Discounts", desc: "Save up to 15% on 6+" },
            { icon: Package, title: "Live Stock", desc: "Synced from the ERP" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <div>
                <p className="font-medium">{f.title}</p>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {popular && popular.length > 0 && (
        <Section title="Popular" href="/shop">
          <ProductGrid products={(popular as ProductRow[]).map(toShop)} />
        </Section>
      )}

      {bestSellers && bestSellers.length > 0 && (
        <Section title="Best Sellers" href="/shop">
          <ProductGrid products={(bestSellers as ProductRow[]).map(toShop)} />
        </Section>
      )}

      {comingSoon && comingSoon.length > 0 && (
        <Section title="Coming Soon" href="/shop">
          <ProductGrid products={(comingSoon as ProductRow[]).map(toShop)} />
        </Section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h2 className="text-xl font-semibold sm:text-2xl">Browse the full catalog</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Every product in our ERP catalog is available to order with cash on
          delivery.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Shop
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}

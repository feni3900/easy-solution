import { getPageSections } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import { Package } from "lucide-react";

export default async function AboutPage() {
  const [sections, supabase] = await Promise.all([
    getPageSections("about"),
    createClient(),
  ]);

  const section1 = sections.find((s) => s.section_number === 1);

  const { data: featuredProducts } = await supabase
    .from("products")
    .select("product_id, product_name, selling_price, image_url")
    .eq("is_active", true)
    .eq("is_popular", true)
    .limit(8);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">
            {section1?.hero_title ?? "Our Story"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {section1?.hero_subtitle ?? "Building trust through quality products"}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: section1?.col1_title ?? "Direct Sourcing", desc: section1?.col1_desc ?? "We source directly from manufacturers" },
            { title: section1?.col2_title ?? "Quality Control", desc: section1?.col2_desc ?? "Every product passes rigorous QC" },
            { title: section1?.col3_title ?? "Customer Care", desc: section1?.col3_desc ?? "Dedicated support for every customer" },
          ].map((v) => (
            <div key={v.title} className="rounded-lg border p-6 text-center">
              <h3 className="font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-xl font-semibold mb-6">Featured Products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <div key={p.product_id} className="rounded-lg border bg-card p-4">
                <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.product_name} className="h-full w-full object-cover rounded-md" />
                  ) : (
                    <Package className="size-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-sm font-medium">{p.product_name}</h3>
                <p className="mt-1 font-semibold">৳{Number(p.selling_price).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

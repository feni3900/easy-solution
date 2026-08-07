import { getPageSections } from "@/lib/store";
import { createClient } from "@/lib/supabase/server";
import { Package } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";
import { t, fmtMoney } from "@/lib/i18n";

export default async function AboutPage() {
  const [sections, supabase] = await Promise.all([
    getPageSections("about"),
    createClient(),
  ]);
  const locale = await getLocale();

  const section1 = sections.find((s) => s.section_number === 1);

  const [{ data: purchased }, { data: featuredProducts }] = await Promise.all([
    supabase.from("purchase_items").select("product_id"),
    supabase
      .from("products")
      .select("product_id, product_name, selling_price, image_url")
      .eq("is_active", true)
      .eq("is_popular", true)
      .limit(8),
  ]);

  const purchasedIds = Array.from(new Set((purchased ?? []).map((r) => r.product_id)));
  const visibleProducts = (featuredProducts ?? []).filter(
    (p) => purchasedIds.length === 0 || purchasedIds.includes(p.product_id)
  );

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">
            {section1?.hero_title ?? t("store.about.title", locale)}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {section1?.hero_subtitle ?? t("store.about.subtitle", locale)}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: section1?.col1_title ?? t("store.about.value1Title", locale), desc: section1?.col1_desc ?? t("store.about.value1Desc", locale) },
            { title: section1?.col2_title ?? t("store.about.value2Title", locale), desc: section1?.col2_desc ?? t("store.about.value2Desc", locale) },
            { title: section1?.col3_title ?? t("store.about.value3Title", locale), desc: section1?.col3_desc ?? t("store.about.value3Desc", locale) },
          ].map((v) => (
            <div key={v.title} className="rounded-lg border p-6 text-center">
              <h3 className="font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {visibleProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-xl font-semibold mb-6">{t("store.about.featured", locale)}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((p) => (
              <div key={p.product_id} className="rounded-lg border bg-card p-4">
                <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.product_name} className="h-full w-full object-cover rounded-md" />
                  ) : (
                    <Package className="size-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-sm font-medium">{p.product_name}</h3>
                <p className="mt-1 font-semibold">{fmtMoney(Number(p.selling_price), locale)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EcommerceHomeClient } from "./home-client";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const metadata = { title: "Ecommerce Home | Smart Solution ERP" };

const KEYS = [
  "home_hero_title", "home_hero_subhead", "home_banner_url",
  "home_feature_1_title", "home_feature_1_desc",
  "home_feature_2_title", "home_feature_2_desc",
  "home_feature_3_title", "home_feature_3_desc",
  "home_popular_title", "home_bestsellers_title", "home_comingsoon_title",
  "home_catalog_heading", "home_catalog_subhead",
  "home_address_line1", "home_address_line2", "home_address_city", "home_address_country",
  "home_phone", "home_email",
  "home_map_embed_url", "home_map_title",
];

export default async function EcommerceHomePage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value").in("key", KEYS);

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (typeof row.value === "string") map.set(row.key, row.value);
    else if (row.value !== null && typeof row.value === "object") {
      map.set(row.key, String((row.value as { value?: unknown }).value ?? ""));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("webstore.home.pageTitle", locale)} description={t("webstore.home.pageDesc", locale)} />
      <EcommerceHomeClient
        bannerUrl={map.get("home_banner_url") ?? "/images/home-banner.png"}
        heroTitle={map.get("home_hero_title") ?? ""}
        heroSubhead={map.get("home_hero_subhead") ?? ""}
        feature1Title={map.get("home_feature_1_title") ?? "Cash on Delivery"}
        feature1Desc={map.get("home_feature_1_desc") ?? "Pay when it arrives"}
        feature2Title={map.get("home_feature_2_title") ?? "Bulk Discounts"}
        feature2Desc={map.get("home_feature_2_desc") ?? "Save up to 15% on 6+"}
        feature3Title={map.get("home_feature_3_title") ?? "Live Stock"}
        feature3Desc={map.get("home_feature_3_desc") ?? "Synced from the ERP"}
        popularTitle={map.get("home_popular_title") ?? "Popular"}
        bestsellersTitle={map.get("home_bestsellers_title") ?? "Best Sellers"}
        comingsoonTitle={map.get("home_comingsoon_title") ?? "Coming Soon"}
        catalogHeading={map.get("home_catalog_heading") ?? "Browse the full catalog"}
        catalogSubhead={map.get("home_catalog_subhead") ?? "Every product in our ERP catalog is available to order with cash on delivery."}
        addressLine1={map.get("home_address_line1") ?? ""}
        addressLine2={map.get("home_address_line2") ?? ""}
        addressCity={map.get("home_address_city") ?? ""}
        addressCountry={map.get("home_address_country") ?? ""}
        phone={map.get("home_phone") ?? ""}
        email={map.get("home_email") ?? ""}
        mapEmbedUrl={map.get("home_map_embed_url") ?? ""}
        mapTitle={map.get("home_map_title") ?? "Find Us on the Map"}
      />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";

export interface WebSettings {
  store_name: string;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  courier_flat_rate: number;
  free_shipping_threshold: number | null;
  online_cod_enabled: boolean;
  online_payment_gateway_enabled: boolean;
  seo_title: string | null;
  seo_description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  operating_hours: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
}

export interface PageSection {
  section_id: number;
  page_name: string;
  section_number: number;
  hero_title: string | null;
  hero_subtitle: string | null;
  banner_image_url: string | null;
  col1_title: string | null;
  col1_desc: string | null;
  col1_icon: string | null;
  col2_title: string | null;
  col2_desc: string | null;
  col2_icon: string | null;
  col3_title: string | null;
  col3_desc: string | null;
  col3_icon: string | null;
  featured_products_tab_label: string | null;
  best_sellers_tab_label: string | null;
}

export async function getWebSettings(): Promise<WebSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("web_settings")
    .select("*")
    .limit(1)
    .single();

  return (data as WebSettings) ?? {
    store_name: "Smart ERP Store",
    tagline: null,
    logo_url: null,
    favicon_url: null,
    courier_flat_rate: 60,
    free_shipping_threshold: null,
    online_cod_enabled: true,
    online_payment_gateway_enabled: false,
    seo_title: null,
    seo_description: null,
    contact_email: null,
    contact_phone: null,
    whatsapp_number: null,
    operating_hours: null,
    facebook_url: null,
    instagram_url: null,
  };
}

export async function getPageSections(pageName: string): Promise<PageSection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page_sections")
    .select("*")
    .eq("page_name", pageName)
    .order("section_number");

  return (data as PageSection[]) ?? [];
}

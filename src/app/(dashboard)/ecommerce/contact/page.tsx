import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ContactPageClient } from "./contact-client";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export const metadata = { title: "Contact Page | Maruf Enterprise" };

const KEYS = [
  "contact_heading", "contact_subhead",
  "contact_addr1_label", "contact_addr1_street", "contact_addr1_street2",
  "contact_addr1_city", "contact_addr1_state", "contact_addr1_postal", "contact_addr1_country",
  "contact_addr2_label", "contact_addr2_street", "contact_addr2_street2",
  "contact_addr2_city", "contact_addr2_state", "contact_addr2_postal", "contact_addr2_country",
  "contact_phone_1", "contact_phone_2",
  "contact_email_1", "contact_email_2",
  "contact_hours_1", "contact_hours_2",
  "contact_contract_heading", "contact_company_name", "contact_trade_license",
  "contact_bin", "contact_tin", "contact_vat_reg", "contact_reg_no",
  "contact_form_heading", "contact_form_subtext", "contact_cta_email",
  "contact_map_embed_url",
];

export default async function ContactPageAdmin() {
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
      <PageHeader title={t("webstore.contacts.pageTitle", locale)} description={t("webstore.contacts.pageDesc", locale)} />
      <ContactPageClient
        heading={map.get("contact_heading") ?? "Contact Us"}
        subhead={map.get("contact_subhead") ?? ""}
        addr1Label={map.get("contact_addr1_label") ?? "Head Office"}
        addr1Street={map.get("contact_addr1_street") ?? ""}
        addr1Street2={map.get("contact_addr1_street2") ?? ""}
        addr1City={map.get("contact_addr1_city") ?? ""}
        addr1State={map.get("contact_addr1_state") ?? ""}
        addr1Postal={map.get("contact_addr1_postal") ?? ""}
        addr1Country={map.get("contact_addr1_country") ?? ""}
        addr2Label={map.get("contact_addr2_label") ?? "Branch Office"}
        addr2Street={map.get("contact_addr2_street") ?? ""}
        addr2Street2={map.get("contact_addr2_street2") ?? ""}
        addr2City={map.get("contact_addr2_city") ?? ""}
        addr2State={map.get("contact_addr2_state") ?? ""}
        addr2Postal={map.get("contact_addr2_postal") ?? ""}
        addr2Country={map.get("contact_addr2_country") ?? ""}
        phone1={map.get("contact_phone_1") ?? ""}
        phone2={map.get("contact_phone_2") ?? ""}
        email1={map.get("contact_email_1") ?? ""}
        email2={map.get("contact_email_2") ?? ""}
        hours1={map.get("contact_hours_1") ?? ""}
        hours2={map.get("contact_hours_2") ?? ""}
        contractHeading={map.get("contact_contract_heading") ?? "Company Information"}
        companyName={map.get("contact_company_name") ?? ""}
        tradeLicense={map.get("contact_trade_license") ?? ""}
        bin={map.get("contact_bin") ?? ""}
        tin={map.get("contact_tin") ?? ""}
        vatReg={map.get("contact_vat_reg") ?? ""}
        regNo={map.get("contact_reg_no") ?? ""}
        formHeading={map.get("contact_form_heading") ?? "Send us a message"}
        formSubtext={map.get("contact_form_subtext") ?? ""}
        ctaEmail={map.get("contact_cta_email") ?? ""}
        mapEmbedUrl={map.get("contact_map_embed_url") ?? ""}
      />
    </div>
  );
}

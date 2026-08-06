"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, MapPin, Phone, Mail, Clock, Map, FileText, Building2 } from "lucide-react";
import { getClientLocale, t } from "@/lib/i18n";

interface ContactPageClientProps {
  heading: string;
  subhead: string;
  addr1Label: string;
  addr1Street: string;
  addr1Street2: string;
  addr1City: string;
  addr1State: string;
  addr1Postal: string;
  addr1Country: string;
  addr2Label: string;
  addr2Street: string;
  addr2Street2: string;
  addr2City: string;
  addr2State: string;
  addr2Postal: string;
  addr2Country: string;
  phone1: string;
  phone2: string;
  email1: string;
  email2: string;
  hours1: string;
  hours2: string;
  contractHeading: string;
  companyName: string;
  tradeLicense: string;
  bin: string;
  tin: string;
  vatReg: string;
  regNo: string;
  formHeading: string;
  formSubtext: string;
  ctaEmail: string;
  mapEmbedUrl: string;
}

function AddressCard({ label, street, street2, city, state, postal, country, setLabel, setStreet, setStreet2, setCity, setState, setPostal, setCountry }: {
  label: string; street: string; street2: string; city: string; state: string; postal: string; country: string;
  setLabel: (v: string) => void; setStreet: (v: string) => void; setStreet2: (v: string) => void;
  setCity: (v: string) => void; setState: (v: string) => void; setPostal: (v: string) => void; setCountry: (v: string) => void;
}) {
  const locale = getClientLocale();
  return (
    <CardContent className="space-y-4">
      <div className="grid gap-2">
        <Label>{t("webstore.contacts.label", locale)}</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("webstore.contacts.labelPh", locale)} />
      </div>
      <div className="grid gap-2">
        <Label>{t("webstore.contacts.streetAddress", locale)}</Label>
        <Input value={street} onChange={(e) => setStreet(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>{t("webstore.contacts.streetAddress2", locale)}</Label>
        <Input value={street2} onChange={(e) => setStreet2(e.target.value)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{t("app.city", locale)}</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>{t("webstore.contacts.stateDivision", locale)}</Label>
          <Input value={state} onChange={(e) => setState(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>{t("store.checkout.postalCode", locale)}</Label>
          <Input value={postal} onChange={(e) => setPostal(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>{t("webstore.contacts.country", locale)}</Label>
          <Input value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>
    </CardContent>
  );
}

export function ContactPageClient(props: ContactPageClientProps) {
  const locale = getClientLocale();
  const router = useRouter();
  const [heading, setHeading] = useState(props.heading);
  const [subhead, setSubhead] = useState(props.subhead);
  const [a1Label, setA1Label] = useState(props.addr1Label);
  const [a1Street, setA1Street] = useState(props.addr1Street);
  const [a1Street2, setA1Street2] = useState(props.addr1Street2);
  const [a1City, setA1City] = useState(props.addr1City);
  const [a1State, setA1State] = useState(props.addr1State);
  const [a1Postal, setA1Postal] = useState(props.addr1Postal);
  const [a1Country, setA1Country] = useState(props.addr1Country);
  const [a2Label, setA2Label] = useState(props.addr2Label);
  const [a2Street, setA2Street] = useState(props.addr2Street);
  const [a2Street2, setA2Street2] = useState(props.addr2Street2);
  const [a2City, setA2City] = useState(props.addr2City);
  const [a2State, setA2State] = useState(props.addr2State);
  const [a2Postal, setA2Postal] = useState(props.addr2Postal);
  const [a2Country, setA2Country] = useState(props.addr2Country);
  const [ph1, setPh1] = useState(props.phone1);
  const [ph2, setPh2] = useState(props.phone2);
  const [em1, setEm1] = useState(props.email1);
  const [em2, setEm2] = useState(props.email2);
  const [h1, setH1] = useState(props.hours1);
  const [h2, setH2] = useState(props.hours2);
  const [contractH, setContractH] = useState(props.contractHeading);
  const [companyName, setCompanyName] = useState(props.companyName);
  const [tradeLicense, setTradeLicense] = useState(props.tradeLicense);
  const [bin, setBin] = useState(props.bin);
  const [tin, setTin] = useState(props.tin);
  const [vatReg, setVatReg] = useState(props.vatReg);
  const [regNo, setRegNo] = useState(props.regNo);
  const [formH, setFormH] = useState(props.formHeading);
  const [formS, setFormS] = useState(props.formSubtext);
  const [ctaE, setCtaE] = useState(props.ctaEmail);
  const [mapUrl, setMapUrl] = useState(props.mapEmbedUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const rows = [
      { key: "contact_heading", value: JSON.stringify(heading.trim()) },
      { key: "contact_subhead", value: JSON.stringify(subhead.trim()) },
      { key: "contact_addr1_label", value: JSON.stringify(a1Label.trim()) },
      { key: "contact_addr1_street", value: JSON.stringify(a1Street.trim()) },
      { key: "contact_addr1_street2", value: JSON.stringify(a1Street2.trim()) },
      { key: "contact_addr1_city", value: JSON.stringify(a1City.trim()) },
      { key: "contact_addr1_state", value: JSON.stringify(a1State.trim()) },
      { key: "contact_addr1_postal", value: JSON.stringify(a1Postal.trim()) },
      { key: "contact_addr1_country", value: JSON.stringify(a1Country.trim()) },
      { key: "contact_addr2_label", value: JSON.stringify(a2Label.trim()) },
      { key: "contact_addr2_street", value: JSON.stringify(a2Street.trim()) },
      { key: "contact_addr2_street2", value: JSON.stringify(a2Street2.trim()) },
      { key: "contact_addr2_city", value: JSON.stringify(a2City.trim()) },
      { key: "contact_addr2_state", value: JSON.stringify(a2State.trim()) },
      { key: "contact_addr2_postal", value: JSON.stringify(a2Postal.trim()) },
      { key: "contact_addr2_country", value: JSON.stringify(a2Country.trim()) },
      { key: "contact_phone_1", value: JSON.stringify(ph1.trim()) },
      { key: "contact_phone_2", value: JSON.stringify(ph2.trim()) },
      { key: "contact_email_1", value: JSON.stringify(em1.trim()) },
      { key: "contact_email_2", value: JSON.stringify(em2.trim()) },
      { key: "contact_hours_1", value: JSON.stringify(h1.trim()) },
      { key: "contact_hours_2", value: JSON.stringify(h2.trim()) },
      { key: "contact_contract_heading", value: JSON.stringify(contractH.trim()) },
      { key: "contact_company_name", value: JSON.stringify(companyName.trim()) },
      { key: "contact_trade_license", value: JSON.stringify(tradeLicense.trim()) },
      { key: "contact_bin", value: JSON.stringify(bin.trim()) },
      { key: "contact_tin", value: JSON.stringify(tin.trim()) },
      { key: "contact_vat_reg", value: JSON.stringify(vatReg.trim()) },
      { key: "contact_reg_no", value: JSON.stringify(regNo.trim()) },
      { key: "contact_form_heading", value: JSON.stringify(formH.trim()) },
      { key: "contact_form_subtext", value: JSON.stringify(formS.trim()) },
      { key: "contact_cta_email", value: JSON.stringify(ctaE.trim()) },
      { key: "contact_map_embed_url", value: JSON.stringify(mapUrl.trim()) },
    ];
    const { error } = await supabase.from("settings").upsert(rows, { onConflict: "key" });
    if (error) {
      console.error(error);
    } else {
      setSaved(true);
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("webstore.contacts.pageHeader", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.heading", locale)}</Label>
            <Input value={heading} onChange={(e) => setHeading(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.subheading", locale)}</Label>
            <textarea
              value={subhead}
              onChange={(e) => setSubhead(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="size-4" /> {t("webstore.contacts.addresses", locale)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="address1">
            <TabsList>
              <TabsTrigger value="address1">{t("webstore.contacts.address1", locale)}</TabsTrigger>
              <TabsTrigger value="address2">{t("webstore.contacts.address2", locale)}</TabsTrigger>
            </TabsList>
            <TabsContent value="address1" className="pt-4">
              <AddressCard
                label={a1Label} street={a1Street} street2={a1Street2} city={a1City} state={a1State} postal={a1Postal} country={a1Country}
                setLabel={setA1Label} setStreet={setA1Street} setStreet2={setA1Street2} setCity={setA1City} setState={setA1State} setPostal={setA1Postal} setCountry={setA1Country}
              />
            </TabsContent>
            <TabsContent value="address2" className="pt-4">
              <AddressCard
                label={a2Label} street={a2Street} street2={a2Street2} city={a2City} state={a2State} postal={a2Postal} country={a2Country}
                setLabel={setA2Label} setStreet={setA2Street} setStreet2={setA2Street2} setCity={setA2City} setState={setA2State} setPostal={setA2Postal} setCountry={setA2Country}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Phone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="size-4" /> {t("app.phone", locale)}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.phone1", locale)}</Label>
            <Input value={ph1} onChange={(e) => setPh1(e.target.value)} placeholder={t("webstore.contacts.phone1Ph", locale)} />
          </div>
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.phone2", locale)}</Label>
            <Input value={ph2} onChange={(e) => setPh2(e.target.value)} placeholder={t("webstore.contacts.phone2Ph", locale)} />
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="size-4" /> {t("app.email", locale)}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.email1", locale)}</Label>
            <Input value={em1} onChange={(e) => setEm1(e.target.value)} placeholder={t("webstore.contacts.emailPh", locale)} />
          </div>
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.email2", locale)}</Label>
            <Input value={em2} onChange={(e) => setEm2(e.target.value)} placeholder={t("webstore.contacts.emailPh", locale)} />
          </div>
        </CardContent>
      </Card>

      {/* Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-4" /> {t("webstore.contacts.businessHours", locale)}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.hours1", locale)}</Label>
            <Input value={h1} onChange={(e) => setH1(e.target.value)} placeholder={t("webstore.contacts.hours1Ph", locale)} />
          </div>
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.hours2", locale)}</Label>
            <Input value={h2} onChange={(e) => setH2(e.target.value)} placeholder={t("webstore.contacts.hours2Ph", locale)} />
          </div>
        </CardContent>
      </Card>

      {/* Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4" /> {t("webstore.contacts.contractInfo", locale)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.sectionHeading", locale)}</Label>
            <Input value={contractH} onChange={(e) => setContractH(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.companyName", locale)}</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("webstore.contacts.tradeLicense", locale)}</Label>
              <Input value={tradeLicense} onChange={(e) => setTradeLicense(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("webstore.contacts.regNo", locale)}</Label>
              <Input value={regNo} onChange={(e) => setRegNo(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>{t("webstore.contacts.bin", locale)}</Label>
              <Input value={bin} onChange={(e) => setBin(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("webstore.contacts.tin", locale)}</Label>
              <Input value={tin} onChange={(e) => setTin(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("webstore.contacts.vatReg", locale)}</Label>
              <Input value={vatReg} onChange={(e) => setVatReg(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message CTA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="size-4" /> {t("webstore.contacts.messageCta", locale)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.sectionHeading", locale)}</Label>
            <Input value={formH} onChange={(e) => setFormH(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.subtext", locale)}</Label>
            <textarea
              value={formS}
              onChange={(e) => setFormS(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.ctaEmail", locale)}</Label>
            <Input value={ctaE} onChange={(e) => setCtaE(e.target.value)} placeholder={t("webstore.contacts.emailPh", locale)} />
          </div>
        </CardContent>
      </Card>

      {/* Location Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="size-4" /> {t("webstore.contacts.locationMap", locale)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("webstore.contacts.mapsEmbedUrl", locale)}</Label>
            <Input
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder={t("webstore.contacts.mapsPh", locale)}
            />
            <p className="text-xs text-muted-foreground">
              {t("webstore.contacts.mapsHelp", locale)}
            </p>
          </div>
          {mapUrl && (
            <div className="rounded-lg border overflow-hidden">
              <iframe
                src={mapUrl}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t("crud.saveChanges", locale)}
        </Button>
        {saved && <span className="text-sm text-emerald-600">{t("webstore.contacts.saved", locale)}</span>}
      </div>
    </div>
  );
}

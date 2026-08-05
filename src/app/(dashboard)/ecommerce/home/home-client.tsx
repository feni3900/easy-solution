"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryPicker } from "@/components/gallery-picker";
import { Loader2, ImagePlus, Save, MapPin, Phone, Mail, Map } from "lucide-react";

interface HomeClientProps {
  bannerUrl: string;
  heroTitle: string;
  heroSubhead: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  popularTitle: string;
  bestsellersTitle: string;
  comingsoonTitle: string;
  catalogHeading: string;
  catalogSubhead: string;
  addressLine1: string;
  addressLine2: string;
  addressCity: string;
  addressCountry: string;
  phone: string;
  email: string;
  mapEmbedUrl: string;
  mapTitle: string;
}

export function EcommerceHomeClient(props: HomeClientProps) {
  const router = useRouter();
  const [banner, setBanner] = useState(props.bannerUrl);
  const [title, setTitle] = useState(props.heroTitle);
  const [subhead, setSubhead] = useState(props.heroSubhead);
  const [f1t, setF1t] = useState(props.feature1Title);
  const [f1d, setF1d] = useState(props.feature1Desc);
  const [f2t, setF2t] = useState(props.feature2Title);
  const [f2d, setF2d] = useState(props.feature2Desc);
  const [f3t, setF3t] = useState(props.feature3Title);
  const [f3d, setF3d] = useState(props.feature3Desc);
  const [popularT, setPopularT] = useState(props.popularTitle);
  const [bestT, setBestT] = useState(props.bestsellersTitle);
  const [comingT, setComingT] = useState(props.comingsoonTitle);
  const [catHead, setCatHead] = useState(props.catalogHeading);
  const [catSub, setCatSub] = useState(props.catalogSubhead);
  const [addr1, setAddr1] = useState(props.addressLine1);
  const [addr2, setAddr2] = useState(props.addressLine2);
  const [city, setCity] = useState(props.addressCity);
  const [country, setCountry] = useState(props.addressCountry);
  const [phone, setPhone] = useState(props.phone);
  const [email, setEmail] = useState(props.email);
  const [mapUrl, setMapUrl] = useState(props.mapEmbedUrl);
  const [mapT, setMapT] = useState(props.mapTitle);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const rows = [
      { key: "home_banner_url", value: JSON.stringify(banner) },
      { key: "home_hero_title", value: JSON.stringify(title.trim()) },
      { key: "home_hero_subhead", value: JSON.stringify(subhead.trim()) },
      { key: "home_feature_1_title", value: JSON.stringify(f1t.trim()) },
      { key: "home_feature_1_desc", value: JSON.stringify(f1d.trim()) },
      { key: "home_feature_2_title", value: JSON.stringify(f2t.trim()) },
      { key: "home_feature_2_desc", value: JSON.stringify(f2d.trim()) },
      { key: "home_feature_3_title", value: JSON.stringify(f3t.trim()) },
      { key: "home_feature_3_desc", value: JSON.stringify(f3d.trim()) },
      { key: "home_popular_title", value: JSON.stringify(popularT.trim()) },
      { key: "home_bestsellers_title", value: JSON.stringify(bestT.trim()) },
      { key: "home_comingsoon_title", value: JSON.stringify(comingT.trim()) },
      { key: "home_catalog_heading", value: JSON.stringify(catHead.trim()) },
      { key: "home_catalog_subhead", value: JSON.stringify(catSub.trim()) },
      { key: "home_address_line1", value: JSON.stringify(addr1.trim()) },
      { key: "home_address_line2", value: JSON.stringify(addr2.trim()) },
      { key: "home_address_city", value: JSON.stringify(city.trim()) },
      { key: "home_address_country", value: JSON.stringify(country.trim()) },
      { key: "home_phone", value: JSON.stringify(phone.trim()) },
      { key: "home_email", value: JSON.stringify(email.trim()) },
      { key: "home_map_embed_url", value: JSON.stringify(mapUrl.trim()) },
      { key: "home_map_title", value: JSON.stringify(mapT.trim()) },
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
      {/* Banner */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banner Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner}
            alt="Home banner preview"
            className="max-h-64 w-full rounded-lg border object-cover"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <ImagePlus className="size-4" />
              Choose from Gallery
            </Button>
            {banner !== "/images/home-banner.png" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBanner("/images/home-banner.png")}
              >
                Use default banner
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hero Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hero Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="home-title">Hero Title</Label>
            <Input
              id="home-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Discover Premium Fragrances & Smart Gadgets"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="home-subhead">Hero Subhead</Label>
            <textarea
              id="home-subhead"
              value={subhead}
              onChange={(e) => setSubhead(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="Short description shown under the title"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { t: f1t, d: f1d, setT: setF1t, setD: setF1d, label: "Feature 1" },
            { t: f2t, d: f2d, setT: setF2t, setD: setF2d, label: "Feature 2" },
            { t: f3t, d: f3d, setT: setF3t, setD: setF3d, label: "Feature 3" },
          ].map((f) => (
            <div key={f.label} className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>{f.label} Title</Label>
                <Input value={f.t} onChange={(e) => f.setT(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{f.label} Description</Label>
                <Input value={f.d} onChange={(e) => f.setD(e.target.value)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Section Titles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section Titles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Popular Section</Label>
            <Input value={popularT} onChange={(e) => setPopularT(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Best Sellers Section</Label>
            <Input value={bestT} onChange={(e) => setBestT(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Coming Soon Section</Label>
            <Input value={comingT} onChange={(e) => setComingT(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Catalog CTA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Browse Catalog CTA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Heading</Label>
            <Input value={catHead} onChange={(e) => setCatHead(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Subheading</Label>
            <textarea
              value={catSub}
              onChange={(e) => setCatSub(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="size-4" /> Business Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Address Line 1</Label>
            <Input value={addr1} onChange={(e) => setAddr1(e.target.value)} placeholder="Street address" />
          </div>
          <div className="grid gap-2">
            <Label>Address Line 2</Label>
            <Input value={addr2} onChange={(e) => setAddr2(e.target.value)} placeholder="Suite, building, floor" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="flex items-center gap-1"><Phone className="size-3" /> Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1234-567890" />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1"><Mail className="size-3" /> Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@example.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="size-4" /> Location Map
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Section Title</Label>
            <Input value={mapT} onChange={(e) => setMapT(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Google Maps Embed URL</Label>
            <Input
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="text-xs text-muted-foreground">
              Go to Google Maps, search for your location, click Share &gt; Embed, and paste the URL.
            </p>
          </div>
          {mapUrl && (
            <div className="rounded-lg border overflow-hidden">
              { }
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
          Save Changes
        </Button>
        {saved && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>

      <GalleryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) => setBanner(url)}
        title="Choose Home Banner"
      />
    </div>
  );
}

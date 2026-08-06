"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Globe, Truck, Share2, FileText, Image as ImageIcon } from "lucide-react";

interface WebSettings {
  setting_id: number;
  store_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  courier_flat_rate: number;
  free_shipping_threshold: number;
  bulk_discount_percent: number;
  bulk_discount_min_items: number;
  online_cod_enabled: boolean;
  online_payment_gateway_enabled: boolean;
  seo_title: string;
  seo_description: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  operating_hours: string;
  facebook_url: string;
  instagram_url: string;
}

interface PageSection {
  section_id: number;
  page_name: string;
  section_number: number;
  hero_title: string;
  hero_subtitle: string;
  banner_image_url: string;
  col1_title: string;
  col1_desc: string;
  col2_title: string;
  col2_desc: string;
  col3_title: string;
  col3_desc: string;
}

export default function WebStoreSettingsPage() {
  const [settings, setSettings] = useState<Partial<WebSettings>>({});
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "shipping" | "seo" | "social" | "pages">("general");
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [galleryPickerField, setGalleryPickerField] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<{ id: number; url: string; filename: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [settingsRes, sectionsRes] = await Promise.all([
        supabase.from("web_settings").select("*").limit(1).single(),
        supabase.from("page_sections").select("*").order("page_name").order("section_number"),
      ]);
      if (settingsRes.data) setSettings(settingsRes.data);
      setSections(sectionsRes.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { setting_id, ...updateData } = settings;
    if (setting_id) {
      await supabase.from("web_settings").update(updateData).eq("setting_id", setting_id);
    }
    setSaving(false);
    alert("Settings saved!");
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;
    setSaving(true);
    const { section_id, ...updateData } = editingSection;
    const res = await fetch("/api/page-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id, ...updateData }),
    });
    const result = await res.json();
    if (!res.ok) { alert("Error: " + result.error); setSaving(false); return; }
    setSections((prev) => prev.map((s) => s.section_id === section_id ? editingSection : s));
    setEditingSection(null);
    setSaving(false);
    alert("Section saved!");
  };

  const updateSetting = (field: string, value: string | number | boolean) =>
    setSettings((s) => ({ ...s, [field]: value }));

  const updateSection = (field: string, value: string) =>
    setEditingSection((s) => s ? { ...s, [field]: value } : null);

  const openGalleryPicker = async (field: string) => {
    setGalleryPickerField(field);
    const supabase = createClient();
    const { data } = await supabase.from("gallery").select("id, url, filename").order("created_at", { ascending: false });
    setGalleryImages(data ?? []);
    setGalleryPickerOpen(true);
  };

  const pickImage = (url: string) => {
    if (galleryPickerField.startsWith("section:")) {
      const sectionField = galleryPickerField.replace("section:", "");
      setEditingSection((s) => s ? { ...s, [sectionField]: url } : null);
    } else {
      updateSetting(galleryPickerField, url);
    }
    setGalleryPickerOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs = [
    { id: "general" as const, label: "General", icon: Globe },
    { id: "shipping" as const, label: "Shipping", icon: Truck },
    { id: "seo" as const, label: "SEO", icon: FileText },
    { id: "social" as const, label: "Social", icon: Share2 },
    { id: "pages" as const, label: "Page Sections", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Web Store Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your online storefront</p>
        </div>
        {activeTab !== "pages" && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            Save Settings
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="grid gap-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-base font-medium mb-4">Store Identity</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Store Name</Label>
                <Input value={settings.store_name ?? ""} onChange={(e) => updateSetting("store_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tagline</Label>
                <Input value={settings.tagline ?? ""} onChange={(e) => updateSetting("tagline", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Logo URL</Label>
                <div className="flex gap-2">
                  <Input value={settings.logo_url ?? ""} onChange={(e) => updateSetting("logo_url", e.target.value)} placeholder="https://..." className="flex-1" />
                  <Button variant="outline" onClick={() => openGalleryPicker("logo_url")} type="button">
                    <ImageIcon className="size-4 mr-1" /> Browse
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Favicon URL</Label>
                <div className="flex gap-2">
                  <Input value={settings.favicon_url ?? ""} onChange={(e) => updateSetting("favicon_url", e.target.value)} placeholder="https://..." className="flex-1" />
                  <Button variant="outline" onClick={() => openGalleryPicker("favicon_url")} type="button">
                    <ImageIcon className="size-4 mr-1" /> Browse
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-base font-medium mb-4">Contact Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Contact Phone</Label>
                <Input value={settings.contact_phone ?? ""} onChange={(e) => updateSetting("contact_phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Contact Email</Label>
                <Input value={settings.contact_email ?? ""} onChange={(e) => updateSetting("contact_email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>WhatsApp Number</Label>
                <Input value={settings.whatsapp_number ?? ""} onChange={(e) => updateSetting("whatsapp_number", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Operating Hours</Label>
                <Input value={settings.operating_hours ?? ""} onChange={(e) => updateSetting("operating_hours", e.target.value)} placeholder="Sat-Thu: 9AM - 9PM" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Settings */}
      {activeTab === "shipping" && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-base font-medium mb-4">Shipping Configuration</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Default Courier Rate (৳)</Label>
              <Input type="number" value={settings.courier_flat_rate ?? 60} onChange={(e) => updateSetting("courier_flat_rate", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Free Shipping Threshold (৳)</Label>
              <Input type="number" value={settings.free_shipping_threshold ?? ""} onChange={(e) => updateSetting("free_shipping_threshold", parseFloat(e.target.value) || 0)} placeholder="0 = no free shipping" />
            </div>
            <div className="space-y-1">
              <Label>Bulk Discount (%)</Label>
              <Input type="number" value={settings.bulk_discount_percent ?? 20} onChange={(e) => updateSetting("bulk_discount_percent", parseFloat(e.target.value) || 0)} placeholder="e.g. 20" />
            </div>
            <div className="space-y-1">
              <Label>Bulk Discount Min Items</Label>
              <Input type="number" value={settings.bulk_discount_min_items ?? 6} onChange={(e) => updateSetting("bulk_discount_min_items", parseInt(e.target.value) || 0)} placeholder="e.g. 6" />
            </div>
            <div className="space-y-1">
              <Label>COD Enabled</Label>
              <select value={settings.online_cod_enabled ? "true" : "false"} onChange={(e) => updateSetting("online_cod_enabled", e.target.value === "true")} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Payment Gateway</Label>
              <select value={settings.online_payment_gateway_enabled ? "true" : "false"} onChange={(e) => updateSetting("online_payment_gateway_enabled", e.target.value === "true")} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SEO Settings */}
      {activeTab === "seo" && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-base font-medium mb-4">SEO Configuration</h3>
          <div className="grid gap-4">
            <div className="space-y-1">
              <Label>SEO Title</Label>
              <Input value={settings.seo_title ?? ""} onChange={(e) => updateSetting("seo_title", e.target.value)} placeholder="My Store - Best Products Online" />
            </div>
            <div className="space-y-1">
              <Label>SEO Description</Label>
              <textarea value={settings.seo_description ?? ""} onChange={(e) => updateSetting("seo_description", e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Shop the best products with cash on delivery..." />
            </div>
          </div>
        </div>
      )}

      {/* Social Media */}
      {activeTab === "social" && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-base font-medium mb-4">Social Media Links</h3>
          <div className="grid gap-4">
            <div className="space-y-1">
              <Label>Facebook URL</Label>
              <Input value={settings.facebook_url ?? ""} onChange={(e) => updateSetting("facebook_url", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-1">
              <Label>Instagram URL</Label>
              <Input value={settings.instagram_url ?? ""} onChange={(e) => updateSetting("instagram_url", e.target.value)} placeholder="https://instagram.com/..." />
            </div>
          </div>
        </div>
      )}

      {/* Page Sections Editor */}
      {activeTab === "pages" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Edit content sections for Home, About, and Contact pages.</p>

          {["home", "about", "contact"].map((pageName) => (
            <div key={pageName} className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <h3 className="text-base font-medium capitalize">{pageName} Page</h3>
              </div>
              <div className="p-4 space-y-3">
                {sections.filter((s) => s.page_name === pageName).map((section) => (
                  <div key={section.section_id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">Section {section.section_number}</p>
                      <p className="text-xs text-muted-foreground">{section.hero_title || "No title"}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingSection(section)}>Edit</Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingSection(null)}>
          <div className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-lg bg-card p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base sm:text-lg font-semibold">
                Edit {editingSection.page_name} - Section {editingSection.section_number}
              </h2>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveSection} disabled={saving}>
                  {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                  Save
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Hero Title</Label>
                <Input value={editingSection.hero_title ?? ""} onChange={(e) => updateSection("hero_title", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Hero Subtitle</Label>
                <textarea value={editingSection.hero_subtitle ?? ""} onChange={(e) => updateSection("hero_subtitle", e.target.value)} rows={2} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <Label>Banner Image URL</Label>
                <div className="flex gap-2">
                  <Input value={editingSection.banner_image_url ?? ""} onChange={(e) => updateSection("banner_image_url", e.target.value)} placeholder="https://..." className="flex-1" />
                  <Button variant="outline" onClick={() => openGalleryPicker("section:banner_image_url")}>
                    <ImageIcon className="size-4 mr-1" /> Browse
                  </Button>
                </div>
                {editingSection.banner_image_url && (
                  <img src={editingSection.banner_image_url} alt="Banner preview" className="mt-2 h-20 rounded border object-cover" />
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Feature 1 Title</Label>
                  <Input value={editingSection.col1_title ?? ""} onChange={(e) => updateSection("col1_title", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Feature 1 Description</Label>
                  <Input value={editingSection.col1_desc ?? ""} onChange={(e) => updateSection("col1_desc", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Feature 2 Title</Label>
                  <Input value={editingSection.col2_title ?? ""} onChange={(e) => updateSection("col2_title", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Feature 2 Description</Label>
                  <Input value={editingSection.col2_desc ?? ""} onChange={(e) => updateSection("col2_desc", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Feature 3 Title</Label>
                  <Input value={editingSection.col3_title ?? ""} onChange={(e) => updateSection("col3_title", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Feature 3 Description</Label>
                  <Input value={editingSection.col3_desc ?? ""} onChange={(e) => updateSection("col3_desc", e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Picker Modal */}
      {galleryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setGalleryPickerOpen(false)}>
          <div className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-lg bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Select Image from Gallery</h2>
              <Button variant="ghost" size="sm" onClick={() => setGalleryPickerOpen(false)}>Close</Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[65vh]">
              {galleryImages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No images in gallery. Upload some first.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {galleryImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => pickImage(img.url)}
                      className="group relative aspect-square rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary cursor-pointer"
                    >
                      <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                        <p className="w-full bg-black/60 text-white text-[10px] p-1 truncate">{img.filename}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

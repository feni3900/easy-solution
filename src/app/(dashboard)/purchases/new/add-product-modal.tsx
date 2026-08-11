"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, X, Image as ImageIcon, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClientLocale, t, translateWithVars } from "@/lib/i18n";

interface GalleryImage {
  id: number;
  url: string;
  filename: string;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  category_id: number;
  brand_id: number;
  image_url: string | null;
}

function generateSku(name: string, sku: string) {
  return sku.trim() || `${name.trim().substring(0, 3).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

interface Props {
  categories: Category[];
  brands: Brand[];
  prefillCategory?: number;
  prefillBrand?: number;
  onClose: () => void;
  onAdded: (product: Product) => void;
}

export default function AddProductModal({ categories, brands, prefillCategory, prefillBrand, onClose, onAdded }: Props) {
  const locale = getClientLocale();
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState<number>(prefillCategory || 0);
  const [brandId, setBrandId] = useState<number>(prefillBrand || 0);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState("");
  const [color, setColor] = useState("");
  const [sizeOptions, setSizeOptions] = useState<string[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageSource, setImageSource] = useState<"upload" | "gallery">("upload");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadGallery = async () => {
    if (galleryImages.length > 0) return;
    setGalleryLoading(true);
    try {
      const res = await fetch("/api/gallery");
      const json = await res.json();
      setGalleryImages((json.data ?? []).map((item: { id?: number; gallery_id?: number; url: string; filename: string }) => ({
        id: item.id ?? item.gallery_id,
        url: item.url,
        filename: item.filename,
      })));
    } catch { }
    setGalleryLoading(false);
  };

  const openGallery = () => {
    setImageSource("gallery");
    loadGallery();
  };

  const loadVariants = async (catId: number) => {
    const supabase = createClient();
    const [sizesRes, unitsRes, colorsRes] = await Promise.all([
      supabase.from("sizes").select("size_name").eq("status", "active").eq("category_id", catId).order("size_name"),
      supabase.from("units").select("name").eq("status", "active").eq("category_id", catId).order("name"),
      supabase.from("colors").select("color_name").eq("status", "active").eq("category_id", catId).order("color_name"),
    ]);
    setSizeOptions((sizesRes.data ?? []).map((r: { size_name: string }) => r.size_name));
    setUnitOptions((unitsRes.data ?? []).map((r: { name: string }) => r.name));
    setColorOptions((colorsRes.data ?? []).map((r: { color_name: string }) => r.color_name));
    setSize("");
    setUnit("");
    setColor("");
  };

  useEffect(() => {
    if (categoryId) loadVariants(categoryId);
  }, [categoryId]);

  const filteredGallery = galleryImages.filter(
    (img) =>
      gallerySearch === "" ||
      img.filename.toLowerCase().includes(gallerySearch.toLowerCase())
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(t("gallery.imageOnly", locale));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim() || !categoryId || !brandId) {
      alert(t("app.productRequired", locale));
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("products")
      .select("product_id")
      .ilike("product_name", name.trim());
    if (existing && existing.length > 0) {
      setSaving(false);
      alert(translateWithVars(t("app.productExists", locale), { name: name.trim() }));
      return;
    }
    const generatedSku = generateSku(name.trim(), sku);

    let productImage: string | null = imageUrl;
    if (imageFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await fetch("/api/gallery", { method: "POST", body: formData });
        const json = await res.json();
        productImage = json.data?.url || json.url || null;
      } catch { }
      setUploading(false);
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        category_id: categoryId,
        brand_id: brandId,
        product_name: name.trim(),
        sku: generatedSku,
        size: size || null,
        unit: unit || null,
        color: color || null,
        storage_location: "Self",
        cost_price: 0,
        selling_price: 0,
        current_stock: 0,
        image_url: productImage,
        is_active: true,
      })
      .select("product_id, product_name, sku, cost_price, selling_price, current_stock, category_id, brand_id, image_url, size, unit, color")
      .single();

    setSaving(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    onAdded(data);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-lg border bg-card p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("app.addNewProduct", locale)}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("purchases.new.category", locale)} *</Label>
              <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value={0}>{t("inventory.addRemove.selectCategory", locale)}</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("purchases.new.brand", locale)} *</Label>
              <select value={brandId} onChange={(e) => setBrandId(Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value={0}>{t("app.selectBrand", locale)}</option>
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t("app.productName", locale)} *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Galaxy S24 Ultra" />
          </div>

          <div className="space-y-1">
            <Label>{t("app.sku", locale)}</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder={t("app.autoIfEmpty", locale)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>{t("app.size", locale)}</Label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                disabled={!categoryId}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">{categoryId ? t("inventory.addRemove.selectCategory", locale) : t("app.none", locale)}</option>
                {sizeOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("app.unit", locale)}</Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={!categoryId}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">{categoryId ? t("inventory.addRemove.selectCategory", locale) : t("app.none", locale)}</option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>{t("inventory.addRemove.colorName", locale)}</Label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={!categoryId}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">{categoryId ? t("inventory.addRemove.selectCategory", locale) : t("app.none", locale)}</option>
                {colorOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t("app.image", locale)}</Label>
            <div className="flex gap-1 rounded-md border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setImageSource("upload")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${imageSource === "upload" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                {t("gallery.uploadTab", locale)}
              </button>
              <button
                type="button"
                onClick={openGallery}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${imageSource === "gallery" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                {t("gallery.fromGallery", locale)}
              </button>
            </div>

            {imageSource === "gallery" ? (
              <div className="rounded-md border">
                <div className="flex items-center gap-2 border-b p-2">
                  <Search className="size-3.5 shrink-0 text-muted-foreground" />
                  <Input
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    placeholder={t("gallery.search", locale)}
                    className="h-8 border-0 p-0 shadow-none"
                  />
                </div>
                {galleryLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredGallery.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">{t("gallery.noImages", locale)}</p>
                ) : (
                  <div className="grid max-h-44 grid-cols-4 gap-2 overflow-y-auto p-2">
                    {filteredGallery.map((img) => {
                      const selected = imageUrl === img.url;
                      return (
                        <button
                          key={img.id}
                          type="button"
                          title={img.filename}
                          onClick={() => {
                            setImageUrl(img.url);
                            setImageFile(null);
                          }}
                          className={`relative aspect-square overflow-hidden rounded-md border ${selected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/60"}`}
                        >
                          <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
                          {selected && (
                            <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {imageUrl && (
                  <div className="flex items-center justify-between gap-2 border-t px-2 py-1.5">
                    <span className="truncate text-xs text-muted-foreground">
                      {galleryImages.find((i) => i.url === imageUrl)?.filename ?? t("gallery.pickImage", locale)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-destructive"
                      onClick={() => {
                        setImageUrl(null);
                        setImageFile(null);
                      }}
                    >
                      {t("app.remove", locale)}
                    </Button>
                  </div>
                )}
                <p className="px-2 py-1.5 text-[10px] text-muted-foreground">{t("gallery.chooseFromGallery", locale)}</p>
              </div>
            ) : imageUrl ? (
              <div className="flex items-center gap-3 rounded-md border p-2">
                <img src={imageUrl} alt="Preview" className="size-16 rounded-md border object-cover" />
                <div className="flex flex-col gap-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || saving}>
                    {t("app.changeImage", locale)}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => { setImageUrl(null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    {t("app.remove", locale)}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-muted/50"
              >
                {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImageIcon className="size-5" />}
                <span className="text-xs">{uploading ? t("gallery.uploading", locale) : t("app.clickToUploadImage", locale)}</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={onClose}>{t("app.cancel", locale)}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {saving ? t("purchases.new.saving", locale) : t("inventory.addRemove.addProduct", locale)}
          </Button>
        </div>
      </div>
    </div>
  );
}

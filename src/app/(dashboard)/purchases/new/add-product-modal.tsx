"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
}

interface Props {
  categories: Category[];
  brands: Brand[];
  prefillCategory?: number;
  prefillBrand?: number;
  onClose: () => void;
  onAdded: (product: Product) => void;
}

const VARIANTS = ["None", "pcs", "kg", "gm", "ltr", "ml", "m", "ft", "box", "set", "pair"];

export default function AddProductModal({ categories, brands, prefillCategory, prefillBrand, onClose, onAdded }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ url: string; filename: string }[]>([]);

  const [categoryId, setCategoryId] = useState<number>(prefillCategory || 0);
  const [brandId, setBrandId] = useState<number>(prefillBrand || 0);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [size, setSize] = useState("");
  const [storageType, setStorageType] = useState("Self");
  const [storageNumber, setStorageNumber] = useState("");
  const [variant, setVariant] = useState("None");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [minStock, setMinStock] = useState(5);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("skip_record", "true");
    try {
      const res = await fetch("/api/gallery", { method: "POST", body: formData });
      const json = await res.json();
      const url = json.data?.url || json.url;
      if (url) setImageUrl(url);
    } catch { }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openGalleryPicker = async () => {
    setShowGalleryPicker(true);
    const res = await fetch("/api/gallery/list");
    const json = await res.json();
    setGalleryImages(json.data ?? []);
  };

  const handleSave = async () => {
    if (!name.trim() || !categoryId || !brandId) {
      alert("Product name, category, and brand are required.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const generatedSku = sku.trim() || `${name.trim().substring(0, 3).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    const { data, error } = await supabase
      .from("products")
      .insert({
        category_id: categoryId,
        brand_id: brandId,
        product_name: name.trim(),
        sku: generatedSku,
        variant_details: variant !== "None" ? variant : null,
        size: size.trim() || null,
        storage_location: storageNumber ? `${storageType} ${storageNumber}` : storageType,
        unit: null,
        cost_price: 0,
        selling_price: 0,
        current_stock: 0,
        min_stock_threshold: minStock,
        description: description.trim() || null,
        image_url: imageUrl || null,
        is_active: true,
      })
      .select("product_id, product_name, sku, cost_price, selling_price, current_stock, category_id, brand_id")
      .single();

    setSaving(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    onAdded(data);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Product</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <div className="space-y-4">
          {/* Image */}
          <div className="space-y-1">
            <Label>Product Image</Label>
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {imageUrl ? (
                <div className="relative size-20 rounded border overflow-hidden">
                  <img src={imageUrl} alt="Product" className="h-full w-full object-cover" />
                  <button onClick={() => setImageUrl("")} className="absolute top-0 right-0 size-5 bg-destructive text-white rounded-bl text-xs">✕</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex size-20 items-center justify-center rounded border border-dashed text-muted-foreground hover:bg-muted"
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                  </button>
                  <button
                    onClick={openGalleryPicker}
                    className="flex size-20 items-center justify-center rounded border border-dashed text-muted-foreground hover:bg-muted"
                  >
                    <ImageIcon className="size-5" />
                  </button>
                </div>
              )}
              <div className="text-xs text-muted-foreground">Upload or pick from gallery</div>
            </div>
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category *</Label>
              <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value={0}>Select Category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Brand *</Label>
              <select value={brandId} onChange={(e) => setBrandId(Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value={0}>Select Brand</option>
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-1">
            <Label>Product Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Galaxy S24 Ultra" />
          </div>

          {/* Size & Variant */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Size</Label>
              <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. XL, 500ml" />
            </div>
            <div className="space-y-1">
              <Label>Unit / Variant</Label>
              <select value={variant} onChange={(e) => setVariant(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {VARIANTS.map((v) => (
                  <option key={v} value={v}>{v === "None" ? "None" : v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Auto if empty" />
            </div>
          </div>

          {/* Min Stock */}
          <div className="space-y-1">
            <Label>Min Stock Alert</Label>
            <Input type="number" min={0} value={minStock} onChange={(e) => setMinStock(parseInt(e.target.value) || 5)} />
          </div>

          {/* Storage Location */}
          <div className="space-y-1">
            <Label>Storage Location</Label>
            <div className="flex gap-2">
              <select value={storageType} onChange={(e) => setStorageType(e.target.value)} className="shrink-0 rounded-md border bg-background px-3 py-2 text-sm">
                <option value="Self">Self</option>
                <option value="Warehouse">Warehouse</option>
              </select>
              <Input value={storageNumber} onChange={(e) => setStorageNumber(e.target.value)} placeholder="No." className="w-24" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional product description" className="h-16 resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {saving ? "Saving..." : "Create Product & Add to Purchase"}
          </Button>
        </div>
      </div>

      {showGalleryPicker && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Pick from Gallery</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowGalleryPicker(false)}><X className="size-4" /></Button>
            </div>
            {galleryImages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No images in gallery yet.</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {galleryImages.map((img) => (
                  <button
                    key={img.url}
                    onClick={() => { setImageUrl(img.url); setShowGalleryPicker(false); }}
                    className="relative size-24 rounded border overflow-hidden hover:ring-2 hover:ring-primary"
                  >
                    <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

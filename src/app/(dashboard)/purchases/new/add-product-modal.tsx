"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface Props {
  categories: Category[];
  brands: Brand[];
  prefillCategory?: number;
  prefillBrand?: number;
  onClose: () => void;
  onAdded: (product: Product) => void;
}

export default function AddProductModal({ categories, brands, prefillCategory, prefillBrand, onClose, onAdded }: Props) {
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState<number>(prefillCategory || 0);
  const [brandId, setBrandId] = useState<number>(prefillBrand || 0);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file only.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim() || !categoryId || !brandId) {
      alert("Product name, category, and brand are required.");
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
      alert(`Product "${name.trim()}" already exists.`);
      return;
    }
    const generatedSku = sku.trim() || `${name.trim().substring(0, 3).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    let productImage: string | null = null;
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
        storage_location: "Self",
        cost_price: 0,
        selling_price: 0,
        current_stock: 0,
        image_url: productImage,
        is_active: true,
      })
      .select("product_id, product_name, sku, cost_price, selling_price, current_stock, category_id, brand_id, image_url")
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
          <h2 className="text-lg font-semibold">Add New Product</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="space-y-1">
            <Label>Product Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Galaxy S24 Ultra" />
          </div>

          <div className="space-y-1">
            <Label>SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Auto if empty" />
          </div>

          <div className="space-y-1">
            <Label>Product Image</Label>
            {imageUrl ? (
              <div className="flex items-center gap-3 rounded-md border p-2">
                <img src={imageUrl} alt="Preview" className="size-16 rounded-md border object-cover" />
                <div className="flex flex-col gap-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || saving}>
                    Change Image
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => { setImageUrl(null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    Remove
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
                <span className="text-xs">{uploading ? "Uploading..." : "Click to upload image"}</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {saving ? "Saving..." : "Add Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}

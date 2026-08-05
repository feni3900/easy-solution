"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Package, Loader2, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  min_stock_threshold: number;
  is_active: boolean;
  is_popular: boolean;
  image_url: string | null;
  category_id: number;
  brand_id: number;
  description: string | null;
  size: string | null;
  unit: string | null;
  storage_location: string | null;
  categories: { category_name: string } | null;
  brands: { brand_name: string } | null;
}

interface Category { category_id: number; category_name: string; }
interface Brand { brand_id: number; brand_name: string; }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ id: string; url: string; filename: string }[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    product_name: "", sku: "", cost_price: "", selling_price: "",
    min_stock_threshold: "5", category_id: "", brand_id: "",
    description: "", is_active: true, is_popular: false,
    size: "", unit: "", storage_type: "Self", storage_number: "", sell_ratio: "2",
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [productsRes, catsRes, brandsRes] = await Promise.all([
      supabase.from("products").select("*, categories(category_name), brands(brand_name)").order("product_name"),
      supabase.from("categories").select("*").order("category_name"),
      supabase.from("brands").select("*").order("brand_name"),
    ]);
    setProducts(productsRes.data ?? []);
    setCategories(catsRes.data ?? []);
    setBrands(brandsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = products.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingProduct(null);
    setImageUrl(null);
    setForm({ product_name: "", sku: "", cost_price: "", selling_price: "", min_stock_threshold: "5", category_id: "", brand_id: "", description: "", is_active: true, is_popular: false, size: "", unit: "", storage_type: "Self", storage_number: "", sell_ratio: "2" });
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setImageUrl(product.image_url);
    const ratio = product.cost_price > 0 && product.selling_price > 0
      ? Math.round((product.selling_price / product.cost_price) * 10) / 10
      : 2;
    setForm({
      product_name: product.product_name,
      sku: product.sku,
      cost_price: String(product.cost_price),
      selling_price: String(product.selling_price),
      min_stock_threshold: String(product.min_stock_threshold),
      category_id: String(product.category_id),
      brand_id: String(product.brand_id),
      description: product.description ?? "",
      is_active: product.is_active,
      is_popular: product.is_popular,
      size: product.size ?? "",
      unit: product.unit ?? "",
      storage_type: product.storage_location?.split(" ")[0] || "Self",
      storage_number: product.storage_location?.split(" ").slice(1).join(" ") || "",
      sell_ratio: String(ratio),
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/gallery", { method: "POST", body: formData });
      const json = await res.json();
      const url = json.data?.url || json.url;
      if (url) setImageUrl(url);
    } catch { }
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openGalleryPicker = async () => {
    setGalleryOpen(true);
    setGalleryLoading(true);
    try {
      const res = await fetch("/api/gallery");
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { data: [] }; }
      setGalleryImages(json.data ?? []);
    } catch {
      setGalleryImages([]);
    }
    setGalleryLoading(false);
  };

  const handleSave = async () => {
    const supabase = createClient();
    const payload = {
      product_name: form.product_name,
      sku: form.sku,
      cost_price: parseFloat(form.cost_price),
      selling_price: parseFloat(form.selling_price),
      min_stock_threshold: parseInt(form.min_stock_threshold) || 5,
      category_id: parseInt(form.category_id),
      brand_id: parseInt(form.brand_id),
      description: form.description || null,
      is_active: form.is_active,
      is_popular: form.is_popular,
      size: form.size || null,
      unit: form.unit || null,
      storage_location: form.storage_number ? `${form.storage_type} ${form.storage_number}` : form.storage_type,
    };

    if (editingProduct) {
      // Update product fields
      const { error } = await supabase.from("products").update(payload).eq("product_id", editingProduct.product_id);
      if (error) { alert("Error updating product: " + error.message); return; }

      // Update image via server API (bypasses RLS)
      if (imageUrl !== editingProduct.image_url) {
        await fetch("/api/products/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: editingProduct.product_id, image_url: imageUrl }),
        });
      }
    } else {
      const { error } = await supabase.from("products").insert({ ...payload, current_stock: 0, image_url: imageUrl }).select("product_id").single();
      if (error) { alert("Error creating product: " + error.message); return; }
    }

    setDialogOpen(false);
    loadAll();
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Delete this product?")) return;
    const supabase = createClient();
    await supabase.from("products").delete().eq("product_id", productId);
    loadAll();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button onClick={openCreate}><Plus className="size-4 mr-2" />Add Product</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Product</th>
                <th className="p-3 text-left font-medium">SKU</th>
                <th className="p-3 text-left font-medium">Category</th>
                <th className="p-3 text-left font-medium">Size</th>
                <th className="p-3 text-left font-medium">Unit</th>
                <th className="p-3 text-left font-medium">Location</th>
                <th className="p-3 text-right font-medium">Cost</th>
                <th className="p-3 text-right font-medium">Price</th>
                <th className="p-3 text-right font-medium">Stock</th>
                <th className="p-3 text-center font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.product_id} className="border-b hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="size-8 rounded object-cover" />
                      ) : (
                        <div className="size-8 rounded bg-muted flex items-center justify-center"><Package className="size-4" /></div>
                      )}
                      <span className="font-medium">{p.product_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.sku}</td>
                  <td className="p-3 text-muted-foreground">{p.categories?.category_name ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{p.size || "-"}</td>
                  <td className="p-3 text-muted-foreground">{p.unit || "-"}</td>
                  <td className="p-3 text-muted-foreground">{p.storage_location || "Self"}</td>
                  <td className="p-3 text-right">৳{Number(p.cost_price).toFixed(2)}</td>
                  <td className="p-3 text-right">৳{Number(p.selling_price).toFixed(2)}</td>
                  <td className={`p-3 text-right font-medium ${p.current_stock <= p.min_stock_threshold ? "text-amber-600" : ""}`}>{p.current_stock}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.product_id)}><Trash2 className="size-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Product Image</Label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="flex items-center gap-3">
                {imageUrl ? (
                  <button type="button" onClick={openGalleryPicker} className="size-20 rounded border overflow-hidden hover:ring-2 hover:ring-primary">
                    <img src={imageUrl} alt="" className="size-20 object-cover" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openGalleryPicker}
                    className="flex size-20 items-center justify-center rounded border border-dashed text-muted-foreground hover:bg-muted"
                  >
                    <Upload className="size-5" />
                  </button>
                )}
                <div className="text-xs text-muted-foreground">
                  <button type="button" onClick={openGalleryPicker} className="text-primary hover:underline">
                    Choose from Gallery
                  </button>
                  <span className="mx-1">or</span>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-primary hover:underline">
                    {uploadingImage ? "Uploading..." : "Upload New"}
                  </button>
                  {imageUrl && (
                    <button type="button" onClick={() => setImageUrl(null)} className="block mt-1 text-destructive hover:underline">
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Product Name</Label>
              <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Select</option>
                {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Brand</Label>
              <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Select</option>
                {brands.map((b) => <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Size</Label>
              <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g. 50ml, XL" />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. pcs, box" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Storage Location</Label>
              <div className="flex gap-2">
                <select value={form.storage_type} onChange={(e) => setForm({ ...form, storage_type: e.target.value })} className="shrink-0 rounded-md border px-3 py-2 text-sm">
                  <option value="Self">Self</option>
                  <option value="Warehouse">Warehouse</option>
                </select>
                <Input value={form.storage_number} onChange={(e) => setForm({ ...form, storage_number: e.target.value })} placeholder="No." className="w-24" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Cost Price</Label>
              <Input type="number" value={form.cost_price} onChange={(e) => {
                const cp = e.target.value;
                const ratio = parseFloat(form.sell_ratio) || 2;
                setForm({ ...form, cost_price: cp, selling_price: (parseFloat(cp || "0") * ratio).toFixed(2) });
              }} />
            </div>
            <div className="space-y-1">
              <Label>Sell Ratio</Label>
              <Input type="number" min={1} step={0.1} value={form.sell_ratio} onChange={(e) => {
                const ratio = parseFloat(e.target.value) || 1;
                setForm({ ...form, sell_ratio: e.target.value, selling_price: (parseFloat(form.cost_price || "0") * ratio).toFixed(2) });
              }} />
            </div>
            <div className="space-y-1">
              <Label>Selling Price</Label>
              <Input type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Min Stock Threshold</Label>
              <Input type="number" value={form.min_stock_threshold} onChange={(e) => setForm({ ...form, min_stock_threshold: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Popular</Label>
              <select value={form.is_popular ? "true" : "false"} onChange={(e) => setForm({ ...form, is_popular: e.target.value === "true" })} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingProduct ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {galleryOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg border bg-card shadow-lg flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Choose from Gallery</h2>
              <Button variant="ghost" size="icon" onClick={() => setGalleryOpen(false)}><span className="text-lg">×</span></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {galleryLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
              ) : galleryImages.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No images in gallery. Upload some first.</p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {galleryImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => { setImageUrl(img.url); setGalleryOpen(false); }}
                      className={`aspect-square rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary ${imageUrl === img.url ? "ring-2 ring-primary" : ""}`}
                    >
                      <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
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

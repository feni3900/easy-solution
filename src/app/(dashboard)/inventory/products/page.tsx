"use client";

import { Fragment, useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Package, Loader2, Search, Upload, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  min_stock_threshold: number;
  is_active: boolean;
  image_url: string | null;
  size: string | null;
  unit: string | null;
  storage_location: string | null;
  category_id: number | null;
  brand_id: number | null;
  categories: { category_name: string } | null;
  brands: { brand_name: string } | null;
}

interface GalleryImage {
  id: string;
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(0);
  const [brandFilter, setBrandFilter] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryForProduct, setGalleryForProduct] = useState<Product | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [ratioEdits, setRatioEdits] = useState<Record<number, string>>({});
  const [savingRatioId, setSavingRatioId] = useState<number | null>(null);
  const [invoiceOpenFor, setInvoiceOpenFor] = useState<number | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceNos, setInvoiceNos] = useState<{ id: number; no: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<number | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: purchasedRows }, catRes, brandRes] = await Promise.all([
      supabase.from("purchase_items").select("product_id"),
      supabase.from("categories").select("category_id, category_name").order("category_name"),
      supabase.from("brands").select("brand_id, brand_name").order("brand_name"),
    ]);
    const purchasedIds = Array.from(new Set((purchasedRows ?? []).map((r) => r.product_id)));

    if (purchasedIds.length === 0) {
      setProducts([]);
      setCategories(catRes.data ?? []);
      setBrands(brandRes.data ?? []);
      setLoading(false);
      return;
    }

    const { data: prodRes } = await supabase
      .from("products")
      .select("*, categories(category_name), brands(brand_name)")
      .in("product_id", purchasedIds)
      .order("product_name");
    setProducts(prodRes ?? []);
    setCategories(catRes.data ?? []);
    setBrands(brandRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = products.filter((p) =>
    (search === "" || p.product_name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())) &&
    (categoryFilter === 0 || p.category_id === categoryFilter) &&
    (brandFilter === 0 || p.brand_id === brandFilter)
  );

  const ratioFor = (p: Product) => {
    const edited = ratioEdits[p.product_id];
    if (edited !== undefined && edited.trim() !== "") return edited;
    const cost = Number(p.cost_price);
    const sell = Number(p.selling_price);
    if (cost > 0) return String(Math.round((sell / cost) * 100) / 100);
    return "1";
  };

  const saveRatio = async (p: Product) => {
    const raw = ratioEdits[p.product_id];
    if (raw === undefined || raw.trim() === "") {
      setRatioEdits((s) => { const n = { ...s }; delete n[p.product_id]; return n; });
      return;
    }
    const ratio = parseFloat(raw);
    if (!ratio || ratio <= 0) {
      setRatioEdits((s) => { const n = { ...s }; delete n[p.product_id]; return n; });
      return;
    }
    setSavingRatioId(p.product_id);
    const sellingPrice = Math.round(Number(p.cost_price) * ratio * 100) / 100;
    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ selling_price: sellingPrice })
      .eq("product_id", p.product_id);
    if (!error) {
      setProducts((prev) =>
        prev.map((x) => (x.product_id === p.product_id ? { ...x, selling_price: sellingPrice } : x))
      );
      setRatioEdits((s) => { const n = { ...s }; delete n[p.product_id]; return n; });
    }
    setSavingRatioId(null);
  };

  const toggleInvoices = async (p: Product) => {
    if (invoiceOpenFor === p.product_id) {
      setInvoiceOpenFor(null);
      return;
    }
    setInvoiceOpenFor(p.product_id);
    setInvoiceLoading(true);
    setInvoiceNos([]);
    const supabase = createClient();
    const { data } = await supabase
      .from("purchase_items")
      .select("purchase_id")
      .eq("product_id", p.product_id);
    const purchaseIds = (data ?? []).map((x) => x.purchase_id);
    let invoices: { id: number; no: string }[] = [];
    if (purchaseIds.length > 0) {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("purchase_id, invoice_no")
        .in("purchase_id", purchaseIds)
        .order("purchase_date", { ascending: false });
      invoices = (purchases ?? [])
        .filter((x) => x.invoice_no)
        .map((x) => ({ id: x.purchase_id, no: x.invoice_no }));
    }
    setInvoiceNos(invoices);
    setInvoiceLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const productId = uploadTargetRef.current;
    if (!file || !productId) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/gallery", { method: "POST", body: formData });
      const json = await res.json();
      const url = json.data?.url || json.url;
      if (url) {
        const r = await fetch("/api/products/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id: productId, image_url: url }),
        });
        if (r.ok) {
          setProducts((prev) =>
            prev.map((x) => (x.product_id === productId ? { ...x, image_url: url } : x))
          );
        }
      }
    } catch { }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openGalleryPicker = async (p: Product) => {
    setGalleryForProduct(p);
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

  const pickGalleryImage = async (img: GalleryImage) => {
    if (!galleryForProduct) return;
    const productId = galleryForProduct.product_id;
    const r = await fetch("/api/products/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, image_url: img.url }),
    });
    if (r.ok) {
      setProducts((prev) =>
        prev.map((x) => (x.product_id === productId ? { ...x, image_url: img.url } : x))
      );
    }
    setGalleryOpen(false);
    setGalleryForProduct(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(Number(e.target.value))}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value={0}>All Categories</option>
          {categories.map((c) => (
            <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
          ))}
        </select>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(Number(e.target.value))}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value={0}>All Brands</option>
          {brands.map((b) => (
            <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
          ))}
        </select>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Product</th>
                <th className="p-3 text-left font-medium">SKU</th>
                <th className="p-3 text-left font-medium">Size</th>
                <th className="p-3 text-left font-medium">Unit</th>
                <th className="p-3 text-left font-medium">Location</th>
                <th className="p-3 text-right font-medium">P Price</th>
                <th className="p-3 text-right font-medium">S Ratio</th>
                <th className="p-3 text-right font-medium">S Price</th>
                <th className="p-3 text-right font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <Fragment key={p.product_id}>
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openGalleryPicker(p)}
                          title="Change image"
                          className="relative shrink-0 group"
                        >
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="size-8 rounded object-cover" />
                          ) : (
                            <div className="size-8 rounded bg-muted flex items-center justify-center"><Package className="size-4" /></div>
                          )}
                          <span className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded bg-black/50 text-white">
                            <Upload className="size-3" />
                          </span>
                        </button>
                        <span className="font-medium">{p.product_name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">{p.sku}</span>
                        <button
                          type="button"
                          onClick={() => toggleInvoices(p)}
                          title="View purchase invoices"
                          className="text-muted-foreground hover:text-primary"
                        >
                          {invoiceOpenFor === p.product_id ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </td>
                  <td className="p-3 text-muted-foreground">{p.size || "-"}</td>
                  <td className="p-3 text-muted-foreground">{p.unit || "-"}</td>
                  <td className="p-3 text-muted-foreground">{p.storage_location || "Self"}</td>
                  <td className="p-3 text-right">৳{Number(p.cost_price).toFixed(2)}</td>
                  <td className="p-3 text-right w-24">
                    {savingRatioId === p.product_id ? (
                      <Loader2 className="size-4 animate-spin ml-auto" />
                    ) : (
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={ratioFor(p)}
                        onChange={(e) => setRatioEdits((s) => ({ ...s, [p.product_id]: e.target.value }))}
                        onBlur={() => saveRatio(p)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveRatio(p); } }}
                        className="ml-auto w-20 px-2 py-1 text-right text-sm"
                      />
                    )}
                  </td>
                  <td className="p-3 text-right">৳{Number(p.selling_price).toFixed(2)}</td>
                  <td className={`p-3 text-right font-medium ${p.current_stock <= p.min_stock_threshold ? "text-amber-600" : ""}`}>{p.current_stock}</td>
                  </tr>
                  {invoiceOpenFor === p.product_id && (
                    <tr key={`${p.product_id}-inv`} className="border-b bg-muted/30">
                      <td colSpan={9} className="p-2 pl-3">
                        <span className="text-xs font-medium text-muted-foreground">Purchase No:</span>
                        {invoiceLoading ? (
                          <span className="ml-2"><Loader2 className="size-3 inline animate-spin" /></span>
                        ) : invoiceNos.length === 0 ? (
                          <span className="ml-2 text-xs text-muted-foreground">No purchase invoices found.</span>
                        ) : (
                          <span className="ml-2 inline-flex flex-wrap items-center gap-1">
                            {invoiceNos.map((inv) => (
                              <span key={inv.id} className="text-xs text-foreground">{inv.no}</span>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {galleryOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-hidden rounded-lg border bg-card shadow-lg flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-base sm:text-lg font-semibold">Choose from Gallery</h2>
              <Button variant="ghost" size="icon" onClick={() => { setGalleryOpen(false); setGalleryForProduct(null); }}><span className="text-lg">×</span></Button>
            </div>
            <div className="flex items-center gap-3 border-b px-4 py-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { uploadTargetRef.current = galleryForProduct?.product_id ?? null; fileInputRef.current?.click(); }}
              >
                <Upload className="size-4 mr-1" /> Upload New
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {galleryLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
              ) : galleryImages.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No images in gallery. Upload some first.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {galleryImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => pickGalleryImage(img)}
                      className={`aspect-square rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary ${galleryForProduct?.image_url === img.url ? "ring-2 ring-primary" : ""}`}
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

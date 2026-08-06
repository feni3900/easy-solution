"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import AddProductModal from "@/app/(dashboard)/purchases/new/add-product-modal";

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

export default function AddRemoveProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    const supabase = createClient();
    const [p, c, b] = await Promise.all([
      supabase.from("products").select("product_id, product_name, sku, cost_price, selling_price, current_stock, category_id, brand_id, image_url").order("product_name"),
      supabase.from("categories").select("category_id, category_name").eq("is_active", true).order("category_name"),
      supabase.from("brands").select("brand_id, brand_name").eq("is_active", true).order("brand_name"),
    ]);
    setProducts(p.data ?? []);
    setCategories(c.data ?? []);
    setBrands(b.data ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  const filtered = products.filter(
    (p) => search === "" || p.product_name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete product "${p.product_name}"? This cannot be undone.`)) return;
    setDeletingId(p.product_id);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("product_id", p.product_id);
    setDeletingId(null);
    if (error) {
      alert("Error deleting product: " + error.message);
      return;
    }
    setProducts((prev) => prev.filter((x) => x.product_id !== p.product_id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Add and remove products" />

      <div className="flex items-center justify-between gap-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="max-w-sm"
        />
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="size-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3 font-medium">Image</th>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-muted-foreground">
                  <Package className="size-8 mx-auto mb-2 opacity-50" />
                  <p>No products found.</p>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.product_id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.product_name} className="size-10 rounded-md border object-cover" />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                        <Package className="size-4" />
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-medium">{p.product_name}</td>
                  <td className="p-3 text-muted-foreground">{p.sku}</td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={deletingId === p.product_id}
                      onClick={() => handleDelete(p)}
                    >
                      {deletingId === p.product_id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddProductModal
          categories={categories}
          brands={brands}
          onClose={() => setShowAddModal(false)}
          onAdded={async (product) => {
            setProducts((prev) => [...prev, product]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PurchaseItem } from "./page";
import AddCategoryModal from "./add-category-modal";
import AddBrandModal from "./add-brand-modal";
import AddProductModal from "./add-product-modal";

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
  products: Product[];
  editItem: PurchaseItem | null;
  onAdd: (item: PurchaseItem) => void;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

const UNITS = ["pcs", "kg", "gm", "ltr", "ml", "m", "ft", "box", "set", "pair"];

export default function AddItemDialog({ categories, brands, products, editItem, onAdd, onClose, onRefresh }: Props) {
  const [categoryId, setCategoryId] = useState<number>(0);
  const [brandId, setBrandId] = useState<number>(0);
  const [productId, setProductId] = useState<number>(0);
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [storageType, setStorageType] = useState("Self");
  const [storageNumber, setStorageNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [sellRatio, setSellRatio] = useState(2);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editItem) {
      setCategoryId(categories.find((c) => c.category_name === editItem.category_name)?.category_id ?? 0);
      setBrandId(brands.find((b) => b.brand_name === editItem.brand_name)?.brand_id ?? 0);
      setProductId(editItem.product_id);
      setProductName(editItem.product_name);
      setSku(editItem.sku);
      setSize(editItem.size);
      setUnit(editItem.unit);
      setStorageType(editItem.storage_location?.split(" ")[0] || "Self");
      setStorageNumber(editItem.storage_location?.split(" ").slice(1).join(" ") || "");
      setQuantity(editItem.quantity);
      setUnitCost(editItem.unit_cost);
      const ratio = editItem.unit_cost > 0 ? Math.round((editItem.selling_price / editItem.unit_cost) * 10) / 10 : 2;
      setSellRatio(ratio);
    }
  }, [editItem, categories, brands]);

  const sellingPrice = Math.round(unitCost * sellRatio * 100) / 100;

  const filteredProducts = products.filter((p) => {
    if (categoryId && p.category_id !== categoryId) return false;
    if (brandId && p.brand_id !== brandId) return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return p.product_name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const selectProduct = (p: Product) => {
    setProductId(p.product_id);
    setProductName(p.product_name);
    setSku(p.sku);
    setUnitCost(p.cost_price);
    const ratio = p.cost_price > 0 ? Math.round((p.selling_price / p.cost_price) * 10) / 10 : 2;
    setSellRatio(ratio);
    if (!categoryId && p.category_id) setCategoryId(p.category_id);
    if (!brandId && p.brand_id) setBrandId(p.brand_id);
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const handleAdd = () => {
    if (!productId || quantity <= 0) {
      alert("Please select a product and enter valid quantity.");
      return;
    }
    onAdd({
      product_id: productId,
      product_name: productName,
      sku,
      category_name: categories.find((c) => c.category_id === categoryId)?.category_name || "",
      brand_name: brands.find((b) => b.brand_id === brandId)?.brand_name || "",
      quantity,
      unit_cost: unitCost,
      selling_price: sellingPrice,
      unit,
      variant: "",
      size,
      storage_location: storageNumber ? `${storageType} ${storageNumber}` : storageType,
    });
  };

  const handleProductAdded = async (newProduct: Product) => {
    await onRefresh();
    selectProduct(newProduct);
    setShowProductModal(false);
  };

  const handleCategoryAdded = async (cat: Category) => {
    await onRefresh();
    setCategoryId(cat.category_id);
    setShowCategoryModal(false);
  };

  const handleBrandAdded = async (brand: Brand) => {
    await onRefresh();
    setBrandId(brand.brand_id);
    setShowBrandModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editItem ? "Edit Item" : "Add Purchase Item"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <div className="space-y-4">
          {/* Category & Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <div className="flex gap-2">
                <select value={categoryId} onChange={(e) => { setCategoryId(Number(e.target.value)); setProductId(0); setProductName(""); }} className="flex-1 rounded-md border bg-background px-3 py-2 text-sm">
                  <option value={0}>All Categories</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                  ))}
                </select>
                <Button variant="outline" size="icon" onClick={() => setShowCategoryModal(true)} title="Add Category">
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Brand</Label>
              <div className="flex gap-2">
                <select value={brandId} onChange={(e) => { setBrandId(Number(e.target.value)); setProductId(0); setProductName(""); }} className="flex-1 rounded-md border bg-background px-3 py-2 text-sm">
                  <option value={0}>All Brands</option>
                  {brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                  ))}
                </select>
                <Button variant="outline" size="icon" onClick={() => setShowBrandModal(true)} title="Add Brand">
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="space-y-1">
            <Label>Product *</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative" ref={searchRef}>
                <Input
                  placeholder="Search product by name or SKU..."
                  value={productName || productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductName("");
                    setProductId(0);
                    setSku("");
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                />
                {showProductDropdown && (
                  <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                    {filteredProducts.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No products found</div>
                    ) : (
                      filteredProducts.map((p) => (
                        <button
                          key={p.product_id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                          onMouseDown={() => selectProduct(p)}
                        >
                          <div>
                            <span className="font-medium">{p.product_name}</span>
                            <span className="ml-2 text-muted-foreground text-xs">{p.sku}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Stock: {p.current_stock}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowProductModal(true)} title="Add New Product">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Size & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Size</Label>
              <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. Large, 500ml, XL" />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
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

          {/* Quantity & Prices */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Quantity *</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <div className="space-y-1">
              <Label>Purchase Price (৳) *</Label>
              <Input type="number" min={0} step={0.01} value={unitCost || ""} onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Sell Price Ratio</Label>
              <Input type="number" min={1} step={0.1} value={sellRatio} onChange={(e) => setSellRatio(parseFloat(e.target.value) || 1)} />
              <p className="text-[10px] text-muted-foreground">= ৳{sellingPrice.toFixed(2)} per unit</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Line Total</Label>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                ৳{(quantity * unitCost).toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Sell Total</Label>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium text-green-600">
                ৳{(quantity * sellingPrice).toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Margin</Label>
              <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium text-green-600">
                ৳{((sellingPrice - unitCost) * quantity).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!productId || quantity <= 0}>
            {editItem ? "Update Item" : "Add to Purchase"}
          </Button>
        </div>
      </div>

      {showCategoryModal && <AddCategoryModal onClose={() => setShowCategoryModal(false)} onAdded={handleCategoryAdded} />}
      {showBrandModal && <AddBrandModal onClose={() => setShowBrandModal(false)} onAdded={handleBrandAdded} />}
      {showProductModal && (
        <AddProductModal
          categories={categories}
          brands={brands}
          prefillCategory={categoryId}
          prefillBrand={brandId}
          onClose={() => setShowProductModal(false)}
          onAdded={handleProductAdded}
        />
      )}
    </div>
  );
}

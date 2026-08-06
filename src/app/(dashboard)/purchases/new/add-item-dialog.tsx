"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PurchaseItem } from "./page";

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
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState(0);
  const [sellRatio, setSellRatio] = useState("2");

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
      setQuantity(editItem.quantity.toString());
      setUnitCost(editItem.unit_cost);
      const ratio = editItem.unit_cost > 0 ? Math.round((editItem.selling_price / editItem.unit_cost) * 10) / 10 : 2;
      setSellRatio(ratio.toString());
    }
  }, [editItem, categories, brands]);

  const qtyNum = parseInt(quantity) || 0;
  const ratioNum = parseFloat(sellRatio) || 0;
  const sellingPrice = Math.round(unitCost * ratioNum * 100) / 100;

  const filteredProducts = products.filter((p) => {
    if (categoryId && p.category_id !== categoryId) return false;
    if (brandId && p.brand_id !== brandId) return false;
    return true;
  });

  const selectProduct = (p: Product) => {
    setProductId(p.product_id);
    setProductName(p.product_name);
    setSku(p.sku);
    setUnitCost(p.cost_price);
    const ratio = p.cost_price > 0 ? Math.round((p.selling_price / p.cost_price) * 10) / 10 : 2;
    setSellRatio(ratio.toString());
    if (!categoryId && p.category_id) setCategoryId(p.category_id);
    if (!brandId && p.brand_id) setBrandId(p.brand_id);
  };

  const handleProductSelect = (pid: number) => {
    const p = products.find((x) => x.product_id === pid);
    if (p) selectProduct(p);
  };

  const handleAdd = () => {
    if (!productId || qtyNum <= 0) {
      alert("Please select a product and enter valid quantity.");
      return;
    }
    onAdd({
      product_id: productId,
      product_name: productName,
      sku,
      category_name: categories.find((c) => c.category_id === categoryId)?.category_name || "",
      brand_name: brands.find((b) => b.brand_id === brandId)?.brand_name || "",
      quantity: qtyNum,
      unit_cost: unitCost,
      selling_price: sellingPrice,
      unit,
      variant: "",
      size,
      storage_location: storageNumber ? `${storageType} ${storageNumber}` : storageType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-lg border bg-card p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{editItem ? "Edit Item" : "Add Purchase Item"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button>
        </div>

        <div className="space-y-4">
          {/* Category & Brand */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Category</Label>
              <select value={categoryId} onChange={(e) => { setCategoryId(Number(e.target.value)); setProductId(0); setProductName(""); }} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value={0}>All Categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Brand</Label>
              <select value={brandId} onChange={(e) => { setBrandId(Number(e.target.value)); setProductId(0); setProductName(""); }} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value={0}>All Brands</option>
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-1">
            <Label>Product *</Label>
            <select
              value={productId || 0}
              onChange={(e) => handleProductSelect(Number(e.target.value))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value={0}>Select Product</option>
              {filteredProducts.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} — {p.sku} (Stock: {p.current_stock})
                </option>
              ))}
            </select>
          </div>

          {/* Size & Unit */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Quantity *</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Purchase Price (৳) *</Label>
              <Input type="number" min={0} step={0.01} value={unitCost || ""} onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)} placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Line Total</Label>
            <div className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
              ৳{(qtyNum * unitCost).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!productId || qtyNum <= 0}>
            {editItem ? "Update Item" : "Add to Purchase"}
          </Button>
        </div>
      </div>
    </div>
  );
}

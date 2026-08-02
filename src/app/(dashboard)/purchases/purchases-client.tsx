"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";

interface Purchase {
  id: string;
  purchase_no: string | null;
  total: number;
  status: string;
  purchase_date: string;
  suppliers?: { name: string }[] | { name: string } | null;
  branches?: { name: string }[] | { name: string } | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  purchase_price: number;
  selling_price: number;
  product_variants?: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600",
  ordered: "bg-blue-500/10 text-blue-600",
  received: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-red-500/10 text-red-600",
};

const getName = (v: { name?: string }[] | { name?: string } | null | undefined) => {
  if (Array.isArray(v)) return v[0]?.name ?? "—";
  return v?.name ?? "—";
};

const columns: ColumnDef<Purchase>[] = [
  {
    accessorKey: "purchase_no",
    header: "No.",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.purchase_no ?? "—"}</span>
    ),
  },
  { header: "Supplier", cell: ({ row }) => getName(row.original.suppliers) },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => `৳${Number(row.original.total).toFixed(2)}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={`${statusColors[row.original.status] ?? ""} border-0 capitalize`}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "purchase_date",
    header: "Date",
    cell: ({ row }) => new Date(row.original.purchase_date).toLocaleString(),
  },
];

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  image: string;
  selling_price: number;
  profit_pct: number;
  newly_created: boolean;
}

export function PurchasesClient({
  purchases,
  suppliers,
  products,
  branches,
  categories,
  brands,
  units,
  variants,
}: {
  purchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
  branches: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  units: { id: string; name: string }[];
  variants: { id: string; product_id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supplier_id: "",
    branch_id: branches[0]?.id ?? "",
    status: "received",
  });
  const [cart, setCart] = useState<CartItem[]>([]);

  const [productDialog, setProductDialog] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ cost_price: "0", profit_pct: "0" });
  const [productSaving, setProductSaving] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    image: "",
    sku: "",
    barcode: "",
    category_id: "",
    brand_id: "",
    unit_id: "",
    variant_id: "",
    variant_name: "",
    cost_price: "0",
    profit_pct: "0",
  });

  const [addDialog, setAddDialog] = useState<{ type: "category" | "brand" | "unit" | "variant"; name: string; symbol: string } | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [catList, setCatList] = useState(categories);
  const [brandList, setBrandList] = useState(brands);
  const [unitList, setUnitList] = useState(units);

  const calculatedSell = Number(newProduct.cost_price || 0) * (1 + Number(newProduct.profit_pct || 0) / 100);

  const addProduct = (p: Product) => {
    const existing = cart.find((c) => c.product_id === p.id);
    if (existing) {
      setCart(cart.map((c) => (c === existing ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([
        ...cart,
        {
          product_id: p.id,
          name: p.name,
          quantity: 1,
          unit_price: Number(p.purchase_price),
          image: "",
          selling_price: Number(p.selling_price),
          profit_pct:
            Number(p.purchase_price) > 0
              ? Math.round((Number(p.selling_price) - Number(p.purchase_price)) / Number(p.purchase_price) * 100)
              : 0,
          newly_created: false,
        },
      ]);
    }
  };

  const removeCartItem = async (index: number) => {
    const item = cart[index];
    const supabase = createClient();
    if (item?.newly_created) {
      const { error } = await supabase.from("products").delete().eq("id", item.product_id);
      if (error) console.error(error);
    }
    setCart(cart.filter((_, i) => i !== index));
  };

  const openEditItem = (index: number) => {
    const item = cart[index];
    setEditIndex(index);
    setEditForm({
      cost_price: String(item.unit_price),
      profit_pct: String(item.profit_pct),
    });
  };

  const saveEditItem = () => {
    if (editIndex === null) return;
    const cost = Number(editForm.cost_price || 0);
    const pct = Number(editForm.profit_pct || 0);
    const sell = cost * (1 + pct / 100);
    setCart(
      cart.map((x, j) =>
        j === editIndex
          ? { ...x, unit_price: cost, profit_pct: Math.round(pct), selling_price: sell }
          : x
      )
    );
    setEditIndex(null);
  };

  const handleAddEntity = async () => {
    if (!addDialog || !addDialog.name.trim()) return;
    setAddSaving(true);
    const supabase = createClient();
    const name = addDialog.name.trim();

    if (addDialog.type === "category") {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name })
        .select("id, name")
        .single();
      if (error) {
        console.error(error);
      } else {
        setCatList([...catList, data]);
        setNewProduct({ ...newProduct, category_id: data.id });
      }
    } else if (addDialog.type === "brand") {
      const { data, error } = await supabase
        .from("brands")
        .insert({ name })
        .select("id, name")
        .single();
      if (error) {
        console.error(error);
      } else {
        setBrandList([...brandList, data]);
        setNewProduct({ ...newProduct, brand_id: data.id });
      }
    } else if (addDialog.type === "unit") {
      const { data, error } = await supabase
        .from("units")
        .insert({ name, symbol: addDialog.symbol.trim() || null })
        .select("id, name")
        .single();
      if (error) {
        console.error(error);
      } else {
        setUnitList([...unitList, data]);
        setNewProduct({ ...newProduct, unit_id: data.id });
      }
    } else if (addDialog.type === "variant") {
      setNewProduct({ ...newProduct, variant_name: name });
    }

    setAddSaving(false);
    setAddDialog(null);
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim()) return;
    setProductSaving(true);
    const supabase = createClient();
    const cost = Number(newProduct.cost_price || 0);
    const sell = Number(calculatedSell);

    const { data: created, error } = await supabase
      .from("products")
      .insert([
        {
          name: newProduct.name.trim(),
          image: newProduct.image.trim() || null,
          sku: newProduct.sku.trim() || null,
          barcode: newProduct.barcode.trim() || null,
          category_id: newProduct.category_id || null,
          brand_id: newProduct.brand_id || null,
          unit_id: newProduct.unit_id || null,
          purchase_price: cost,
          selling_price: sell,
          status: "active",
        },
      ])
      .select("id, name, purchase_price, selling_price")
      .single();

    if (error) {
      console.error(error);
      setProductSaving(false);
      return;
    }

    const variantName =
      newProduct.variant_name.trim() ||
      (newProduct.variant_id ? variants.find((v) => v.id === newProduct.variant_id)?.name ?? "" : "");

    if (variantName) {
      const { error: varError } = await supabase
        .from("product_variants")
        .insert([
          { product_id: created.id, name: variantName, stock_quantity: 0, status: "active" },
        ]);
      if (varError) console.error(varError);
    }

    addProduct({
      id: created.id,
      name: created.name,
      purchase_price: created.purchase_price,
      selling_price: created.selling_price,
    });

    setCart((prev) =>
      prev.map((c) => (c.product_id === created.id ? { ...c, newly_created: true } : c))
    );

    setProductSaving(false);
    setProductDialog(false);
    setNewProduct({
      name: "",
      image: "",
      sku: "",
      barcode: "",
      category_id: "",
      brand_id: "",
      unit_id: "",
      variant_id: "",
      variant_name: "",
      cost_price: "0",
      profit_pct: "0",
    });
  };

  const total = cart.reduce((s, c) => s + c.quantity * c.unit_price, 0);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: purchase, error } = await supabase
      .from("purchases")
      .insert([
        {
          supplier_id: form.supplier_id || null,
          branch_id: form.branch_id || null,
          subtotal: total,
          discount: 0,
          tax: 0,
          total,
          paid_amount: 0,
          status: form.status,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error(error);
      setSaving(false);
      return;
    }

    const items = cart.map((c) => ({
      purchase_id: purchase.id,
      product_id: c.product_id,
      quantity: c.quantity,
      unit_price: c.unit_price,
      total: c.quantity * c.unit_price,
    }));
    const { error: itemsError } = await supabase.from("purchase_items").insert(items);
    if (itemsError) console.error(itemsError);

    for (const c of cart) {
      if (c.image.trim()) {
        const { error: imgError } = await supabase
          .from("products")
          .update({ image: c.image.trim() })
          .eq("id", c.product_id);
        if (imgError) console.error(imgError);
      }
    }

    setSaving(false);
    setOpen(false);
    setCart([]);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Purchase
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={purchases}
        searchKey="purchase_no"
        searchPlaceholder="Search purchases..."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Purchase</DialogTitle>
            <DialogDescription>
              Stock is added to the inventory ledger automatically when status is received.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Supplier</Label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.supplier_id}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Branch</Label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setPickerQuery(""); setPickerOpen(true); }}>
              <Plus className="size-4" />
              Add Purchase Product
            </Button>
            <Button variant="outline" size="sm" onClick={() => setProductDialog(true)}>
              <Plus className="size-4" />
              Add New Product
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cart.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No items added.</p>
              ) : (
                cart.map((c, i) => (
                  <div key={c.product_id} className="space-y-1.5 rounded-lg border p-2">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 truncate text-sm">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Sell: ৳{Number(c.selling_price).toFixed(2)} ({c.profit_pct}%)
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={c.quantity}
                        onChange={(e) =>
                          setCart(cart.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))
                        }
                        className="w-16 rounded-md border px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        value={c.unit_price}
                        onChange={(e) =>
                          setCart(cart.map((x, j) => (j === i ? { ...x, unit_price: Number(e.target.value) } : x)))
                        }
                        className="w-24 rounded-md border px-2 py-1 text-sm"
                        title="Cost price"
                      />
                      <Button variant="ghost" size="icon-xs" onClick={() => openEditItem(i)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => removeCartItem(i)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={c.image}
                        onChange={(e) =>
                          setCart(cart.map((x, j) => (j === i ? { ...x, image: e.target.value } : x)))
                        }
                        placeholder="Image URL (copied to product)"
                        className="h-7 text-xs"
                      />
                      {c.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image}
                          alt={c.name}
                          className="size-7 shrink-0 rounded border object-cover"
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
              <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Total</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || cart.length === 0}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save Purchase
            </Button>
          </DialogFooter>

          <Dialog open={productDialog} onOpenChange={setProductDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Product</DialogTitle>
                <DialogDescription>
                  Create a new product. Selling price is calculated automatically from cost + profit %.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Image URL</Label>
                  <Input
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {newProduct.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={newProduct.image}
                      alt="preview"
                      className="h-24 w-24 rounded-md border object-cover"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>SKU</Label>
                    <Input
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="SKU-001"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Barcode</Label>
                    <Input
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                      placeholder="8901234567890"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Category</Label>
                    <div className="flex gap-1.5">
                      <select
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={newProduct.category_id}
                        onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                      >
                        <option value="">None</option>
                        {catList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <Button variant="outline" size="icon-xs" onClick={() => setAddDialog({ type: "category", name: "", symbol: "" })}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Brand</Label>
                    <div className="flex gap-1.5">
                      <select
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={newProduct.brand_id}
                        onChange={(e) => setNewProduct({ ...newProduct, brand_id: e.target.value })}
                      >
                        <option value="">None</option>
                        {brandList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <Button variant="outline" size="icon-xs" onClick={() => setAddDialog({ type: "brand", name: "", symbol: "" })}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Unit</Label>
                    <div className="flex gap-1.5">
                      <select
                        className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={newProduct.unit_id}
                        onChange={(e) => setNewProduct({ ...newProduct, unit_id: e.target.value })}
                      >
                        <option value="">None</option>
                        {unitList.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                      <Button variant="outline" size="icon-xs" onClick={() => setAddDialog({ type: "unit", name: "", symbol: "" })}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Variant</Label>
                    <div className="flex gap-1.5">
                      <Input
                        list="variant-options"
                        value={newProduct.variant_name}
                        onChange={(e) => setNewProduct({ ...newProduct, variant_name: e.target.value })}
                        placeholder="e.g. 500ml"
                        className="h-8 text-sm"
                      />
                      <datalist id="variant-options">
                        {variants.map((v) => (
                          <option key={v.id} value={v.name} />
                        ))}
                      </datalist>
                      <Button variant="outline" size="icon-xs" onClick={() => setAddDialog({ type: "variant", name: "", symbol: "" })}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Cost Price (৳)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={newProduct.cost_price}
                      onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Profit %</Label>
                    <Input
                      type="number"
                      min={0}
                      value={newProduct.profit_pct}
                      onChange={(e) => setNewProduct({ ...newProduct, profit_pct: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                  <span className="text-muted-foreground">Selling Price</span>
                  <span className="font-semibold">৳{calculatedSell.toFixed(2)}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProductDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProduct} disabled={productSaving || !newProduct.name.trim()}>
                  {productSaving && <Loader2 className="size-4 animate-spin" />}
                  Create & Add to Cart
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Purchase Product</DialogTitle>
                <DialogDescription>
                  Pick an existing product to add to this purchase.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <Input
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Search products..."
                  autoFocus
                />
                <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
                  {products
                    .filter((p) => p.name.toLowerCase().includes(pickerQuery.toLowerCase()))
                    .map((p) => (
                      <button
                        key={p.id}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-left transition-colors hover:bg-muted"
                        onClick={() => {
                          addProduct(p);
                          setPickerOpen(false);
                        }}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                          ৳{Number(p.purchase_price).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  {products.filter((p) => p.name.toLowerCase().includes(pickerQuery.toLowerCase())).length === 0 && (
                    <p className="p-2 text-center text-sm text-muted-foreground">No products found.</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPickerOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editIndex !== null} onOpenChange={(o) => !o && setEditIndex(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit Item</DialogTitle>
                <DialogDescription>
                  Update cost price and profit %. Selling price is recalculated automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Cost Price (৳)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editForm.cost_price}
                      onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Profit %</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editForm.profit_pct}
                      onChange={(e) => setEditForm({ ...editForm, profit_pct: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                  <span className="text-muted-foreground">Selling Price</span>
                  <span className="font-semibold">
                    ৳{(Number(editForm.cost_price || 0) * (1 + Number(editForm.profit_pct || 0) / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditIndex(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEditItem}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!addDialog} onOpenChange={(o) => !o && setAddDialog(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>
                  Add {addDialog?.type === "unit" ? "Unit" : addDialog?.type === "brand" ? "Brand" : addDialog?.type === "variant" ? "Variant" : "Category"}
                </DialogTitle>
                <DialogDescription>
                  Create a new {addDialog?.type === "unit" ? "unit" : addDialog?.type === "brand" ? "brand" : addDialog?.type === "variant" ? "variant" : "category"} and assign it to this product.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input
                    value={addDialog?.name ?? ""}
                    onChange={(e) => setAddDialog(addDialog ? { ...addDialog, name: e.target.value } : addDialog)}
                    placeholder={addDialog?.type === "unit" ? "e.g. Piece" : "Name"}
                  />
                </div>
                {addDialog?.type === "unit" && (
                  <div className="grid gap-2">
                    <Label>Symbol</Label>
                    <Input
                      value={addDialog.symbol}
                      onChange={(e) => setAddDialog({ ...addDialog, symbol: e.target.value })}
                      placeholder="e.g. pc"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEntity} disabled={addSaving || !addDialog?.name.trim()}>
                  {addSaving && <Loader2 className="size-4 animate-spin" />}
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    </div>
  );
}

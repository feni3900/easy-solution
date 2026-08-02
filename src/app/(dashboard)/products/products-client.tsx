"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2, ShoppingCart, Plus, Trash2 } from "lucide-react";

export interface ProductRow {
  id: string;
  barcode: string | null;
  sku: string | null;
  name: string;
  image: string | null;
  purchase_price: number;
  selling_price: number;
  minimum_stock: number;
  status: string;
  brands?: { id: string; name: string } | null;
  categories?: { id: string; name: string } | null;
  units?: { id: string; name: string } | null;
  branch_id?: string | null;
  product_variants?: { id: string; name: string; stock_quantity: number }[];
}

interface Customer {
  id: string;
  name: string;
  mobile: string | null;
  previous_due: number;
  current_due: number;
}

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export function ProductsClient({
  products,
  categories,
  brands,
  units,
  customers,
  branches,
  stockMap,
  currentUserId,
  salesPersonName,
  roleName,
}: {
  products: ProductRow[];
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  units: { id: string; name: string }[];
  customers: Customer[];
  branches: { id: string; name: string }[];
  stockMap: Record<string, number>;
  currentUserId: string | null;
  salesPersonName: string;
  roleName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredProducts =
    categoryFilter === "all"
      ? products
      : products.filter((p) => p.categories?.id === categoryFilter);

  const isSuperAdmin = roleName === "super_admin";
  const isManager = roleName === "branch_manager" || roleName === "company_admin";
  const discountCapPct = isSuperAdmin ? 100 : isManager ? 15 : 5;
  const canCredit = isSuperAdmin || isManager;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerMobile, setCustomerMobile] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountPct, setDiscountPct] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    brand_id: "",
    category_id: "",
    unit_id: "",
    branch_id: "",
    image: "",
    purchase_price: "0",
    selling_price: "0",
    minimum_stock: "0",
    status: "active",
  });

  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      brand_id: p.brands?.id ?? "",
      category_id: p.categories?.id ?? "",
      unit_id: p.units?.id ?? "",
      branch_id: p.branch_id ?? branches[0]?.id ?? "",
      image: p.image ?? "",
      purchase_price: String(p.purchase_price),
      selling_price: String(p.selling_price),
      minimum_stock: String(p.minimum_stock),
      status: p.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.toUpperCase(),
      sku: form.sku || null,
      brand_id: form.brand_id || null,
      category_id: form.category_id || null,
      unit_id: form.unit_id || null,
      branch_id: form.branch_id || null,
      image: form.image || null,
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      minimum_stock: Number(form.minimum_stock),
      status: form.status,
    };

    const res = await supabase.from("products").update(payload).eq("id", editing!.id);

    if (res.error) {
      console.error(res.error);
    }
    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  const addToCart = (p: ProductRow) => {
    const existing = cart.find((c) => c.product_id === p.id);
    if (existing) {
      setCart(cart.map((c) => (c === existing ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { product_id: p.id, name: p.name, quantity: 1, unit_price: Number(p.selling_price) }]);
    }
  };

  const updateQty = (index: number, quantity: number) => {
    setCart(cart.map((c, i) => (i === index ? { ...c, quantity: Math.max(1, quantity) } : c)));
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const matchedCustomer = customerMobile.trim()
    ? customers.find((c) => (c.mobile ?? "").trim() === customerMobile.trim()) ?? null
    : null;

  const subtotal = cart.reduce((s, c) => s + c.quantity * c.unit_price, 0);
  const enteredPct = Math.max(0, Number(discountPct || 0));
  const discountAmount = (Math.min(enteredPct, discountCapPct) / 100) * subtotal;
  const total = Math.max(0, subtotal - discountAmount);
  const paid = Math.max(0, Number(paidAmount || 0));
  const due = Math.max(0, total - paid);
  const totalDue = (matchedCustomer?.current_due ?? 0) + (paymentMethod === "credit" ? total : 0);

  const handleFinalize = async () => {
    if (cart.length === 0 || !matchedCustomer || !currentUserId) return;
    setSaving(true);
    const supabase = createClient();

    const { data: order, error } = await supabase
      .from("sales_orders")
      .insert([
        {
          customer_id: matchedCustomer.id,
          branch_id: branchId || null,
          salesperson_id: currentUserId,
          payment_method: paymentMethod,
          sales_channel: "pos",
          subtotal,
          discount: discountAmount,
          tax: 0,
          total,
          paid_amount: paid,
          status: "completed",
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
      order_id: order.id,
      product_id: c.product_id,
      variant_id: null,
      quantity: c.quantity,
      unit_price: c.unit_price,
      discount: 0,
      total: c.unit_price * c.quantity,
    }));

    const { error: itemsError } = await supabase.from("sales_items").insert(items);
    if (itemsError) console.error(itemsError);

    setSaving(false);
    setCart([]);
    setPaidAmount("");
    setDiscountPct("0");
    setCustomerMobile("");
    setCartOpen(false);
    router.refresh();
  };

  const columns: ColumnDef<ProductRow>[] = [
    {
      id: "product",
      header: "Product",
      accessorFn: (row) => `${row.name} ${row.sku ?? ""}`,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.original.image}
              alt={row.original.name}
              className="size-12 rounded-md border object-cover"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-md border bg-muted text-lg text-muted-foreground">
              📦
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {row.original.categories?.name ?? "—"}
              {row.original.brands?.name ? ` · ${row.original.brands.name}` : ""}
            </p>
            <button
              className="block max-w-[16rem] truncate text-left font-medium underline-offset-2 hover:text-primary hover:underline"
              onClick={() => addToCart(row.original)}
              title={row.original.name}
            >
              {row.original.name}
            </button>
            <p className="font-mono text-xs text-muted-foreground">{row.original.sku ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "selling_price",
      header: "Price",
      cell: ({ row }) => `৳${Number(row.original.selling_price).toFixed(2)}`,
    },
    {
      header: "Stock",
      cell: ({ row }) => {
        const stock = stockMap[row.original.id] ?? 0;
        return (
          <Badge variant={Number(row.original.minimum_stock) > 0 && stock <= Number(row.original.minimum_stock) ? "destructive" : "default"}>
            {stock}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => addToCart(row.original)}>
            <Plus className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCartOpen(true)} disabled={cart.length === 0}>
          <ShoppingCart className="size-4" />
          Cart ({cart.reduce((s, c) => s + c.quantity, 0)})
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={filteredProducts}
        searchColumns={[
          { key: "product", placeholder: "Search by name or SKU..." },
        ]}
        filterControls={
          <select
            className="h-9 w-44 rounded-md border border-input bg-background px-3 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Image URL</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label>SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="SKU-001"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Category</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Brand</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.brand_id}
                  onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                >
                  <option value="">None</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Unit</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.unit_id}
                  onChange={(e) => setForm({ ...form, unit_id: e.target.value })}
                >
                  <option value="">None</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Store / Branch</Label>
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Status</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Purchase Price</Label>
                <Input
                  type="number"
                  value={form.purchase_price}
                  onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Selling Price</Label>
                <Input
                  type="number"
                  value={form.selling_price}
                  onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Min Stock</Label>
                <Input
                  type="number"
                  value={form.minimum_stock}
                  onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Cart</DialogTitle>
            <DialogDescription>Review items and finalize the order.</DialogDescription>
          </DialogHeader>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cart.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">Cart is empty.</p>
              ) : (
                cart.map((c, i) => (
                  <div key={c.product_id} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm">{c.name}</span>
                    <input
                      type="number"
                      min={1}
                      value={c.quantity}
                      onChange={(e) => updateQty(i, Number(e.target.value))}
                      className="w-16 rounded-md border px-2 py-1 text-sm"
                    />
                    <span className="w-20 text-right text-sm">৳{(c.unit_price * c.quantity).toFixed(2)}</span>
                    <Button variant="ghost" size="icon-xs" onClick={() => removeItem(i)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))
              )}
              <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Subtotal</span>
                <span>৳{subtotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 rounded-lg border p-3">
            <div className="grid gap-2">
              <Label>Customer Mobile *</Label>
              <Input
                type="tel"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="e.g. 01712345678"
                autoFocus
              />
              {matchedCustomer ? (
                <div className="space-y-0.5 text-xs">
                  <p className="font-medium text-primary">{matchedCustomer.name}</p>
                  <p className="text-muted-foreground">
                    Previous Due: <span className="font-semibold text-destructive">৳{Number(matchedCustomer.previous_due ?? 0).toFixed(2)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Current Due: <span className="font-semibold text-destructive">৳{Number(matchedCustomer.current_due ?? 0).toFixed(2)}</span>
                  </p>
                </div>
              ) : customerMobile.trim() ? (
                <p className="text-xs text-destructive">No customer found with this mobile number.</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label>Sales Person *</Label>
              <div className="flex h-8 items-center rounded-md border border-input bg-muted/40 px-3 text-sm">
                {salesPersonName || currentUserId || "—"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Branch</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Payment</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  {canCredit && <option value="credit">Credit</option>}
                  <option value="card">Card</option>
                  <option value="mobile_payment">Mobile Payment</option>
                </select>
                {paymentMethod === "credit" && (
                  <p className="text-xs text-muted-foreground">Credit approved by {roleName.replace("_", " ")}.</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>
                Discount (%{discountCapPct >= 100 ? " (any)" : ` — max ${discountCapPct}%`})
              </Label>
              <Input
                type="number"
                min={0}
                max={discountCapPct}
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                className="h-8"
              />
              {enteredPct > discountCapPct && (
                <p className="text-xs text-destructive">
                  Discount capped at {discountCapPct}% for your role.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span>-৳{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1">
              <span>Grand Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Paid</span>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
                className="h-7 w-28 text-right"
              />
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Due</span>
              <span className={due === 0 ? "text-emerald-600" : "text-destructive"}>
                ৳{due.toFixed(2)}
              </span>
            </div>
            {paymentMethod === "credit" && (
              <div className="flex justify-between font-medium text-destructive">
                <span>Total Due (with previous)</span>
                <span>৳{totalDue.toFixed(2)}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCartOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={saving || cart.length === 0 || !matchedCustomer || !currentUserId}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Finalize Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

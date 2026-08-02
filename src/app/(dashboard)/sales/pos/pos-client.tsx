"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  mobile: string;
}

interface CartItem {
  product_id: string;
  name: string;
  variant_id: string | null;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export function PosClient({
  customers,
  branches,
  currentUserId,
}: {
  customers: Customer[];
  branches: { id: string; name: string }[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const updateQty = (index: number, quantity: number) => {
    setCart(cart.map((c, i) => (i === index ? { ...c, quantity: Math.max(0, quantity) } : c)));
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((s, c) => s + c.quantity * c.unit_price, 0);
  const itemDiscount = cart.reduce((s, c) => s + (c.unit_price * c.quantity - (c.unit_price * c.quantity - c.discount)), 0);
  const bulkDiscount = cart.reduce((s, c) => s + c.quantity, 0) >= 6 ? 0.2 : 0;
  const discountAmount = subtotal * bulkDiscount;
  const total = Math.max(0, subtotal - itemDiscount - discountAmount);
  const due = Math.max(0, total - Number(paidAmount || 0));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    const supabase = createClient();

    const { data: order, error } = await supabase
      .from("sales_orders")
      .insert([
        {
          customer_id: customerId || null,
          branch_id: branchId || null,
          salesperson_id: currentUserId,
          payment_method: paymentMethod,
          sales_channel: "pos",
          subtotal,
          discount: itemDiscount + discountAmount,
          tax: 0,
          total,
          paid_amount: Number(paidAmount || 0),
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
      variant_id: c.variant_id,
      quantity: c.quantity,
      unit_price: c.unit_price,
      discount: c.discount,
      total: c.unit_price * c.quantity - c.discount,
    }));

    const { error: itemsError } = await supabase.from("sales_items").insert(items);
    if (itemsError) console.error(itemsError);

    setSaving(false);
    setCart([]);
    setPaidAmount("");
    router.refresh();
  };

  return (
    <Card className="h-fit max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Cart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="space-y-2">
            {cart.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Cart is empty. Click a product to add.
              </p>
            ) : (
              cart.map((c, i) => (
                <div
                  key={`${c.product_id}-${c.variant_id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ৳{Number(c.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={c.quantity}
                      onChange={(e) => updateQty(i, Number(e.target.value))}
                      className="w-14 rounded-md border px-2 py-1 text-sm"
                    />
                    <Button variant="ghost" size="icon-xs" onClick={() => removeItem(i)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid gap-2">
            <Label>Customer</Label>
            <select
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.mobile})
                </option>
              ))}
            </select>
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
                <option value="credit">Credit</option>
                <option value="card">Card</option>
                <option value="mobile_payment">Mobile Payment</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            {bulkDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Bulk discount (20%)</span>
                <span>-৳{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
            {paymentMethod !== "credit" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-7 w-24 text-right"
                />
              </div>
            )}
            {paymentMethod === "credit" ? (
              <div className="flex justify-between font-medium text-destructive">
                <span>Due</span>
                <span>৳{total.toFixed(2)}</span>
              </div>
            ) : (
              due > 0 && (
                <div className="flex justify-between font-medium text-destructive">
                  <span>Due</span>
                  <span>৳{due.toFixed(2)}</span>
                </div>
              )
            )}
          </div>

          <Button className="w-full" size="lg" onClick={handleCheckout} disabled={saving || cart.length === 0}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Complete Sale
          </Button>
        </CardContent>
      </Card>
  );
}

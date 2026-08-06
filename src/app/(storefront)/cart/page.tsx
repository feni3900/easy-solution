"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bulkDiscountPct, setBulkDiscountPct] = useState(20);
  const [bulkDiscountMin, setBulkDiscountMin] = useState(6);

  useEffect(() => {
    const load = async () => {
      setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
      const supabase = createClient();
      const { data } = await supabase
        .from("web_settings")
        .select("bulk_discount_percent, bulk_discount_min_items")
        .limit(1)
        .single();
      if (data) {
        setBulkDiscountPct(data.bulk_discount_percent ?? 20);
        setBulkDiscountMin(data.bulk_discount_min_items ?? 6);
      }
      setLoaded(true);
    };
    load();
  }, []);

  const updateQuantity = (productId: number, delta: number) => {
    const updated = cart.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeItem = (productId: number) => {
    const updated = cart.filter((item) => item.productId !== productId);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0);
  const totalItems = cart.reduce((s, item) => s + item.quantity, 0);

  // Bulk discount calculation
  const bulkDiscountPercent = totalItems >= bulkDiscountMin ? bulkDiscountPct : 0;

  const discountAmount = (subtotal * bulkDiscountPercent) / 100;
  const total = subtotal - discountAmount;

  // Store summary for checkout
  useEffect(() => {
    const summary = { subtotal, totalItems, bulkDiscountPercent, discountAmount, total };
    localStorage.setItem("cartSummary", JSON.stringify(summary));
  }, [subtotal, totalItems, bulkDiscountPercent, discountAmount, total]);

  if (!loaded) return null;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto size-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add some products to get started.</p>
        <Link href="/shop">
          <Button className="mt-6">Browse Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div key={item.productId} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium leading-snug">{item.productName}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">৳{item.price.toFixed(2)} each</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeItem(item.productId)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => updateQuantity(item.productId, -1)}>
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => updateQuantity(item.productId, 1)}>
                    <Plus className="size-3" />
                  </Button>
                </div>
                <p className="font-medium">৳{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4 h-fit">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {cart.map((item, index) => (
              <div key={item.productId} className="flex justify-between">
                <span className="text-muted-foreground">{index + 1}. {item.productName} × {item.quantity}</span>
                <span className="font-medium ml-2">৳{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between">
              <span>Subtotal ({totalItems} pcs)</span>
              <span>৳{subtotal.toFixed(2)}</span>
            </div>
            {bulkDiscountPercent > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Bulk Discount ({bulkDiscountPercent}%)</span>
                <span>-৳{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {bulkDiscountPercent === 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Add {Math.max(0, bulkDiscountMin - totalItems)} more for {bulkDiscountPct}% bulk discount</span>
                <span></span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Courier charge calculated at checkout.</p>
          <Link href="/checkout" className="block">
            <Button className="w-full">Proceed to Checkout</Button>
          </Link>
          <Link href="/shop" className="block text-center text-sm text-primary hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

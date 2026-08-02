"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Truck, BadgePercent, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getCart, saveCart, bulkDiscountPct, type CartLine } from "@/app/cart/cart-storage";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartLine[]>(getCart());
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<{ invoice_no: string; total: number } | null>(null);

  const updateQty = (productId: string, quantity: number) => {
    const next = cart.map((c) =>
      c.productId === productId ? { ...c, quantity: Math.max(1, Math.min(99, quantity)) } : c
    );
    setCart(next);
    saveCart(next);
  };

  const remove = (productId: string) => {
    const next = cart.filter((c) => c.productId !== productId);
    setCart(next);
    saveCart(next);
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const totalQty = cart.reduce((s, c) => s + c.quantity, 0);
  const pct = bulkDiscountPct(totalQty);
  const discount = (subtotal * pct) / 100;
  const total = subtotal - discount;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!name.trim() || !mobile.trim()) {
      setError("Please enter your name and mobile number.");
      return;
    }
    setPlacing(true);
    setError("");

    const items = cart.map((c) => ({
      product_id: c.productId,
      quantity: c.quantity,
    }));

    const branchId =
      document.cookie
        .split("; ")
        .find((c) => c.startsWith("store_branch="))
        ?.split("=")[1] ?? null;

    const res = await fetch("/api/place-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        note: note.trim(),
        items,
        branchId,
      }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(json.error ?? "Could not place your order. Please try again.");
      setPlacing(false);
      return;
    }

    saveCart([]);
    setCart([]);
    setOrder({ invoice_no: json.invoice_no, total: json.total });
    setPlacing(false);
    router.refresh();
  };

  if (order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto size-16 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-bold">Order Placed!</h1>
        <p className="mt-2 text-muted-foreground">
          Your order <span className="font-semibold">{order.invoice_no}</span> is
          confirmed. Total due on delivery: <span className="font-semibold">৳{Number(order.total).toFixed(2)}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll contact you on the phone number you provided to confirm delivery.
        </p>
        <Button size="lg" className="mt-6" onClick={() => router.push("/shop")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Your Cart</h1>

      {cart.length === 0 ? (
        <div className="rounded-lg border py-20 text-center">
          <p className="mb-4 text-muted-foreground">Your cart is empty.</p>
          <Button size="lg" onClick={() => router.push("/shop")}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {cart.map((c) => {
              const linePct = bulkDiscountPct(totalQty);
              const lineDiscount = (c.price * c.quantity * linePct) / 100;
              return (
                <div key={c.productId} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-2xl">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">৳{Number(c.price).toFixed(2)} each</p>
                    {lineDiscount > 0 && (
                      <p className="text-xs font-medium text-emerald-600">
                        Bulk −৳{lineDiscount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={c.quantity}
                      onChange={(e) => updateQty(c.productId, Number(e.target.value))}
                      className="w-16"
                    />
                    <span className="w-24 text-right text-sm font-semibold">
                      ৳{((c.price * c.quantity * (100 - linePct)) / 100).toFixed(2)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.productId)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold">Order Summary</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({totalQty})</span>
                  <span>৳{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bulk Discount</span>
                  <span className={discount > 0 ? "font-medium text-emerald-600" : ""}>
                    {discount > 0 ? `−৳${discount.toFixed(2)} (${pct}%)` : "—"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>৳{total.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/5 p-2 text-xs text-muted-foreground">
                <Truck className="size-4 shrink-0" />
                Cash on Delivery — pay when your order arrives.
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h2 className="font-semibold">Delivery Details</h2>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Full Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Mobile Number *</Label>
                  <Input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Delivery Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, road, area, city" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Order Note</Label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={placeOrder} disabled={placing || cart.length === 0}>
              {placing && <Loader2 className="size-4 animate-spin" />}
              {placing ? "Placing Order..." : `Place Order · ৳${total.toFixed(2)}`}
            </Button>
            <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
              <BadgePercent className="size-3.5" />
              Bulk discount: 5% (6+), 10% (12+), 15% (24+)
            </p>
            <Link href="/shop" className="block text-center text-sm text-primary hover:underline">
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

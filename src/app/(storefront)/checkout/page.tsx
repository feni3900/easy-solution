"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ShoppingBag, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getClientLocale, t, fmtMoney, fmtInt, translateWithVars } from "@/lib/i18n";

interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
}

interface CartSummary {
  subtotal: number;
  totalItems: number;
  bulkDiscountPercent: number;
  discountAmount: number;
  total: number;
}

interface CourierService {
  service_id: number;
  service_name: string;
  base_rate: number;
  min_delivery_days: number | null;
  max_delivery_days: number | null;
}

function makeOrderNo() {
  return `WEB-${Date.now()}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({ subtotal: 0, totalItems: 0, bulkDiscountPercent: 0, discountAmount: 0, total: 0 });
  const [loaded, setLoaded] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [couriers, setCouriers] = useState<CourierService[]>([]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [courierId, setCourierId] = useState<number>(0);
  const [courierCharge, setCourierCharge] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "Instant Payment">("COD");
  const [notes, setNotes] = useState("");
  const locale = getClientLocale();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(stored);
    const savedSummary = JSON.parse(localStorage.getItem("cartSummary") || "{}");
    setSummary(savedSummary);

    const loadCouriers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("courier_services")
        .select("service_id, service_name, base_rate, min_delivery_days, max_delivery_days")
        .eq("is_active", true);
      setCouriers(data ?? []);
      if (data && data.length > 0) {
        setCourierId(data[0].service_id);
        setCourierCharge(data[0].base_rate);
      }
    };
    loadCouriers();
    setLoaded(true);
  }, []);

  const subtotal = summary.subtotal || 0;
  const totalItems = summary.totalItems || 0;
  const bulkDiscountPercent = summary.bulkDiscountPercent || 0;
  const discountAmount = summary.discountAmount || 0;
  const afterDiscount = subtotal - discountAmount;

  const handleCourierChange = (id: number) => {
    setCourierId(id);
    const c = couriers.find((x) => x.service_id === id);
    setCourierCharge(c?.base_rate ?? 0);
  };

  const grandTotal = afterDiscount + courierCharge;

  const handlePlaceOrder = async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      alert(t("store.checkout.fillRequired", locale));
      return;
    }
    if (cart.length === 0) {
      alert(t("store.cart.empty", locale));
      return;
    }

    setPlacing(true);
    const supabase = createClient();

    // Find or create customer
    let customerId: number | null = null;
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("mobile_number", phone.trim())
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.customer_id;
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({
          mobile_number: phone.trim(),
          full_name: fullName.trim(),
          address: address.trim(),
          city: city.trim(),
        })
        .select("customer_id")
        .single();
      customerId = newCustomer?.customer_id ?? null;
    }

    // Create order
    const orderNo = makeOrderNo();
    const { data: order, error: orderError } = await supabase
      .from("web_orders")
      .insert({
        order_no: orderNo,
        customer_id: customerId,
        shipping_full_name: fullName.trim(),
        shipping_phone: phone.trim(),
        shipping_address: address.trim(),
        shipping_city: city.trim(),
        shipping_postal_code: postalCode.trim() || null,
        courier_service_id: courierId || null,
        courier_charge: courierCharge,
        subtotal: subtotal,
        bulk_discount_percent: bulkDiscountPercent,
        discount_amount: discountAmount,
        total_amount: grandTotal,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "COD" ? "Unpaid" : "Paid",
        order_status: "Pending",
      })
      .select("order_id")
      .single();

    if (orderError || !order) {
      alert("Error placing order: " + (orderError?.message || "Unknown"));
      setPlacing(false);
      return;
    }

    // Insert order items
    const orderItems = cart.map((item) => ({
      order_id: order.order_id,
      product_id: item.productId,
      product_name_snapshot: item.productName,
      unit_price: item.price,
      quantity: item.quantity,
      total_price: item.price * item.quantity,
    }));

    await supabase.from("order_items").insert(orderItems);

    // Deduct stock
    for (const item of cart) {
      await supabase.rpc("deduct_stock", {
        p_product_id: item.productId,
        p_quantity: item.quantity,
        p_movement_type: "Sale_Online",
        p_reference_id: order.order_id,
        p_reference_no: orderNo,
        p_notes: `Online order ${orderNo}`,
      });
    }

    // Clear cart
    localStorage.removeItem("cart");
    localStorage.removeItem("cartSummary");
    window.dispatchEvent(new Event("cart-updated"));

    setPlacing(false);
    router.push(`/checkout/confirmation?order=${orderNo}`);
  };

  if (!loaded) {
    return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin" /></div>;
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto size-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold">{t("store.cart.empty", locale)}</h1>
        <p className="mt-2 text-muted-foreground">{t("store.checkout.emptyDesc", locale)}</p>
        <Link href="/shop"><Button className="mt-6">{t("store.cart.browseShop", locale)}</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/cart" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="size-4" /> {t("store.checkout.backToCart", locale)}
      </Link>
      <h1 className="text-2xl font-semibold mb-6">{t("store.checkout.title", locale)}</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("store.checkout.shippingInfo", locale)}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("store.checkout.fullName", locale)} *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("store.checkout.fullNamePh", locale)} />
              </div>
              <div className="space-y-1">
                <Label>{t("store.checkout.mobile", locale)} *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("store.checkout.address", locale)} *</Label>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("store.checkout.addressPh", locale)} className="h-16 resize-none" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("store.checkout.city", locale)} *</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("store.checkout.cityPh", locale)} />
              </div>
              <div className="space-y-1">
                <Label>{t("store.checkout.postalCode", locale)}</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder={t("store.checkout.optional", locale)} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold">{t("store.checkout.deliveryPayment", locale)}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("store.checkout.courierService", locale)}</Label>
                <select value={courierId} onChange={(e) => handleCourierChange(Number(e.target.value))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {couriers.map((c) => (
                    <option key={c.service_id} value={c.service_id}>
                      {c.service_name} — {fmtMoney(Number(c.base_rate), locale)}{" "}
                      {c.min_delivery_days != null && c.max_delivery_days != null
                        ? `(${fmtInt(c.min_delivery_days, locale)}-${fmtInt(c.max_delivery_days, locale)} ${t("store.checkout.days", locale)})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t("store.checkout.paymentMethod", locale)}</Label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "COD" | "Instant Payment")} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="COD">{t("store.checkout.cod", locale)}</option>
                  <option value="Instant Payment">{t("store.checkout.instantPayment", locale)}</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("store.checkout.orderNotes", locale)}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("store.checkout.notesPh", locale)} className="h-16 resize-none" />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="rounded-lg border bg-card p-6 space-y-4 h-fit">
          <h2 className="text-lg font-semibold">{t("store.cart.orderSummary", locale)}</h2>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="flex-1 truncate">{item.productName} × {item.quantity}</span>
                <span className="ml-2 font-medium">{fmtMoney(item.price * item.quantity, locale)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{translateWithVars(t("store.checkout.subtotalItems", locale), { n: fmtInt(totalItems, locale) })}</span>
              <span>{fmtMoney(subtotal, locale)}</span>
            </div>
            {bulkDiscountPercent > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{translateWithVars(t("store.cart.bulkDiscount", locale), { p: fmtInt(bulkDiscountPercent, locale) })}</span>
                <span>-{fmtMoney(discountAmount, locale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t("store.checkout.afterDiscount", locale)}</span>
              <span>{fmtMoney(afterDiscount, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("store.checkout.courierCharge", locale)}</span>
              <span>{fmtMoney(courierCharge, locale)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>{t("store.checkout.grandTotal", locale)}</span>
              <span>{fmtMoney(grandTotal, locale)}</span>
            </div>
          </div>
          <Button className="w-full" onClick={handlePlaceOrder} disabled={placing}>
            {placing ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> {t("store.checkout.placing", locale)}</>
            ) : (
              <><Check className="size-4 mr-2" /> {translateWithVars(t("store.checkout.placeOrderAmount", locale), { a: fmtMoney(grandTotal, locale) })}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

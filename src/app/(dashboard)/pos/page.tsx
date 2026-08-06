"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Package, Plus, Minus, ShoppingCart, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClientLocale, t, fmtMoney, fmtInt, translateWithVars } from "@/lib/i18n";

interface Product {
  product_id: number;
  product_name: string;
  sku: string;
  selling_price: number;
  current_stock: number;
  image_url: string | null;
  size: string | null;
  unit: string | null;
  storage_location: string | null;
  category_id: number | null;
  brand_id: number | null;
  categories: { category_name: string } | null;
  brands: { brand_name: string } | null;
  product_variants: { variant_id: number; variant_key: string; variant_value: string; price_adjustment: number; stock_adjustment: number }[];
}

interface CartItem {
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  discount: number;
  max_stock: number;
  variant_id?: number;
}

function makeInvoiceNo() {
  return `POS-${Date.now()}`;
}

interface DiscountRule {
  rule_id: number;
  category: string | null;
  item_name: string | null;
  min_quantity: number;
  discount_percentage: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ category_id: number; category_name: string }[]>([]);
  const [brands, setBrands] = useState<{ brand_id: number; brand_name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [previousDue, setPreviousDue] = useState(0);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [heldOrders, setHeldOrders] = useState<CartItem[][]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const locale = getClientLocale();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data }, { data: cats }, { data: brs }] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(category_name), brands(brand_name), product_variants(*), size, unit, storage_location")
        .eq("is_active", true)
        .order("product_name"),
      supabase.from("categories").select("category_id, category_name").eq("is_active", true).order("category_name"),
      supabase.from("brands").select("brand_id, brand_name").eq("is_active", true).order("brand_name"),
    ]);
    setProducts(data ?? []);
    setCategories(cats ?? []);
    setBrands(brs ?? []);
    setLoading(false);
  }, []);

  const loadDiscountRules = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("bulk_discount_rules")
      .select("rule_id, category, item_name, min_quantity, discount_percentage")
      .eq("is_active", true);
    setDiscountRules(data ?? []);
  }, []);

  useEffect(() => {
    loadProducts();
    loadDiscountRules();
  }, [loadProducts, loadDiscountRules]);

  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  ).filter((p) => !categoryFilter || String(p.category_id) === categoryFilter)
    .filter((p) => !brandFilter || String(p.brand_id) === brandFilter);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.current_stock) return prev;
        return prev.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          sku: product.sku,
          unit_price: product.selling_price,
          quantity: 1,
          discount: 0,
          max_stock: product.current_stock,
        },
      ];
    });
  }, []);

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.product_id === productId);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((i) => i.product_id !== productId);
      if (newQty > item.max_stock) return prev;
      return prev.map((i) =>
        i.product_id === productId ? { ...i, quantity: newQty } : i
      );
    });
  };

  const removeCartItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const lookupCustomer = async (mobile: string) => {
    if (mobile.length < 10) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("customers")
      .select("customer_id, full_name, previous_due")
      .eq("mobile_number", mobile)
      .single();
    if (data) {
      setCustomerId(data.customer_id);
      setCustomerName(data.full_name ?? "");
      setPreviousDue(Number(data.previous_due));
    } else {
      setCustomerId(null);
      setCustomerName("");
      setPreviousDue(0);
    }
  };

  const holdOrder = () => {
    if (cart.length === 0) return;
    setHeldOrders((prev) => [...prev, [...cart]]);
    setCart([]);
    setCustomerMobile("");
    setCustomerName("");
    setCustomerId(null);
    setPreviousDue(0);
    setManualDiscount(0);
    setPaidAmount("");
    setNotes("");
  };

  const recallHeldOrder = (index: number) => {
    setCart(heldOrders[index]);
    setHeldOrders((prev) => prev.filter((_, i) => i !== index));
  };

  const newOrder = () => {
    setCart([]);
    setCustomerMobile("");
    setCustomerName("");
    setCustomerId(null);
    setPreviousDue(0);
    setManualDiscount(0);
    setPaidAmount("");
    setNotes("");
  };

  // Bulk discount calculation from DB rules
  const subtotal = cart.reduce((s, item) => s + item.unit_price * item.quantity, 0);

  const applyBulkDiscount = () => {
    const discountedCart = cart.map((item) => {
      const product = products.find((p) => p.product_id === item.product_id);
      const categoryName = product?.categories?.category_name ?? "";
      const matchingRules = discountRules.filter(
        (rule) =>
          item.quantity >= rule.min_quantity &&
          (rule.category === null || rule.category === "" || rule.category === "all" || rule.category === categoryName) &&
          (rule.item_name === null || rule.item_name === "" || rule.item_name === "all" || rule.item_name === item.product_name)
      );
      const bestRule = matchingRules.reduce<DiscountRule | null>((best, rule) =>
        Number(rule.discount_percentage) > Number(best?.discount_percentage ?? 0) ? rule : best, null);
      const percent = bestRule ? Number(bestRule.discount_percentage) : 0;
      const lineTotal = item.unit_price * item.quantity;
      return { ...item, discount: (lineTotal * percent) / 100 };
    });
    const totalDiscount = discountedCart.reduce((s, item) => s + item.discount, 0);
    return { discountedCart, totalDiscount };
  };

  const { discountedCart, totalDiscount } = applyBulkDiscount();
  const discountAmount = totalDiscount + manualDiscount;
  const total = Math.max(0, subtotal - discountAmount);
  const paid = parseFloat(paidAmount) || 0;
  const due = Math.max(0, total - paid);

  const handleConfirm = async () => {
    if (cart.length === 0 || submitting) return;
    if (!customerId && due > 0) {
      alert(t("pos.walkinDue", locale));
      setSubmitting(false);
      return;
    }
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("users")
        .select("salesperson_nickname")
        .eq("user_id", user.id)
        .single();

      const invoiceNo = makeInvoiceNo();

      const { data: invoice, error: invError } = await supabase
        .from("sales_invoices")
        .insert({
          invoice_no: invoiceNo,
          channel: "POS",
          salesperson_nickname: profile?.salesperson_nickname ?? "POS",
          customer_id: customerId,
          subtotal,
          bulk_discount_percent: subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0,
          manual_discount_percent: 0,
          discount_amount: discountAmount,
          courier_charge: 0,
          total_amount: total,
          paid_amount: paid,
          due_amount: due,
          payment_status: due > 0 ? (paid > 0 ? "Partial Due" : "Due") : "Cash",
          notes: notes || null,
          created_by: user.id,
        })
        .select("invoice_id")
        .single();

      if (invError) throw invError;

      const items = discountedCart.map((item) => ({
        invoice_id: invoice.invoice_id,
        product_id: item.product_id,
        product_name_snapshot: item.product_name,
        variant_id: item.variant_id ?? null,
        unit_price: item.unit_price,
        quantity: item.quantity,
        discount_applied: item.discount,
        total_price: item.unit_price * item.quantity - item.discount,
      }));

      const { error: itemsError } = await supabase.from("sales_items").insert(items);
      if (itemsError) throw itemsError;

      // Deduct stock for each item
      for (const item of cart) {
        const { error: stockError } = await supabase.rpc("deduct_stock", {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
          p_movement_type: "Sale_POS",
          p_reference_id: invoice.invoice_id,
          p_reference_no: invoiceNo,
          p_created_by: user.id,
        });
        if (stockError) throw stockError;
      }

      // Update customer due
      if (customerId && due > 0) {
        await supabase
          .from("customers")
          .update({ previous_due: previousDue + due })
          .eq("customer_id", customerId);
      }

      // Reset
      setCart([]);
      setCustomerMobile("");
      setCustomerName("");
      setCustomerId(null);
      setPreviousDue(0);
      setManualDiscount(0);
      setPaidAmount("");
      setNotes("");
      loadProducts();

      alert(translateWithVars(t("pos.invoiceCreated", locale), { no: invoiceNo }));
    } catch (error) {
      alert(`${t("pos.error", locale)}${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:flex-row">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col md:border-r">
        <div className="p-3 border-b space-y-2">
          <div className="flex gap-2">
            <select
              className="rounded-lg border bg-card px-3 py-2 text-sm flex-1"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">{t("pos.allCategories", locale)}</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
            <select
              className="rounded-lg border bg-card px-3 py-2 text-sm flex-1"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">{t("pos.allBrands", locale)}</option>
              {brands.map((b) => (
                <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder={t("pos.searchPlaceholder", locale)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-card pl-10 pr-4 py-2 text-sm"
            />
          </div>
          <Button className="w-full md:hidden" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="size-4 mr-2" />
            {translateWithVars(t("pos.viewCartCount", locale), { n: fmtInt(cart.reduce((s, i) => s + i.quantity, 0), locale) })}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">{t("pos.noProducts", locale)}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.product_id}
                  onClick={() => addToCart(product)}
                  className="rounded-lg border bg-card p-3 text-left hover:bg-accent transition-colors"
                >
                  <div className="aspect-square rounded bg-muted mb-2 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.product_name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs font-medium line-clamp-2">{product.product_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {product.size ? `${product.size} • ` : ""}{product.unit || ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {product.categories?.category_name && <span>{product.categories.category_name} · </span>}
                    {product.brands?.brand_name && <span>{product.brands.brand_name} · </span>}
                    {product.storage_location && <span>{product.storage_location}</span>}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-bold">{fmtMoney(Number(product.selling_price), locale)}</p>
                    <span className={`text-[10px] px-1 rounded ${product.current_stock > 5 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {product.current_stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className={`fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] flex-col overflow-hidden bg-card border-t shadow-xl md:static md:inset-auto md:z-auto md:max-h-none md:flex md:w-96 md:border-l md:shadow-none ${cartOpen ? "flex" : "hidden"}`}>
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              <span className="font-medium text-sm">{translateWithVars(t("pos.cartTitle", locale), { n: fmtInt(cart.reduce((s, i) => s + i.quantity, 0), locale) })}</span>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setCartOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t("pos.customerMobile", locale)}
              value={customerMobile}
              onChange={(e) => {
                setCustomerMobile(e.target.value);
                if (e.target.value.length >= 10) lookupCustomer(e.target.value);
              }}
              className="text-xs"
            />
          </div>
          {customerName && (
            <p className="text-xs text-muted-foreground mt-1">
              {customerName} {previousDue > 0 && <span className="text-amber-600">· {translateWithVars(t("pos.customerDue", locale), { a: fmtMoney(previousDue, locale) })}</span>}
            </p>
          )}
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={holdOrder} disabled={cart.length === 0} className="flex-1 text-xs">
              {t("pos.holdOrder", locale)}
            </Button>
            <Button variant="outline" size="sm" onClick={newOrder} className="flex-1 text-xs">
              {t("pos.newOrder", locale)}
            </Button>
          </div>
          {heldOrders.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-muted-foreground">{translateWithVars(t("pos.heldOrders", locale), { n: fmtInt(heldOrders.length, locale) })}</p>
              <div className="flex flex-wrap gap-1">
                {heldOrders.map((order, idx) => (
                  <button
                    key={idx}
                    onClick={() => recallHeldOrder(idx)}
                    className="text-[10px] rounded bg-amber-100 text-amber-800 px-2 py-0.5 hover:bg-amber-200"
                  >
                    {translateWithVars(t("pos.heldOrderItem", locale), { n: fmtInt(idx + 1, locale), count: fmtInt(order.length, locale) })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">{t("pos.emptyCart", locale)}</p>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="rounded-md border p-2 space-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.product_name}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtMoney(Number(item.unit_price), locale)} {t("pos.each", locale)}</p>
                  </div>
                  <button onClick={() => removeCartItem(item.product_id)} className="text-destructive hover:bg-destructive/10 rounded p-0.5">
                    <X className="size-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateCartQuantity(item.product_id, -1)} className="rounded border p-0.5 hover:bg-muted">
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-xs">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.product_id, 1)} className="rounded border p-0.5 hover:bg-muted">
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <p className="text-xs font-bold">{fmtMoney(Number(item.unit_price * item.quantity), locale)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="border-t p-3 space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span>{t("pos.subtotal", locale)}</span><span>{fmtMoney(subtotal, locale)}</span></div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600"><span>{t("pos.bulkDiscount", locale)}</span><span>-{fmtMoney(totalDiscount, locale)}</span></div>
            )}
            <div className="flex justify-between">
              <span>{t("pos.manualDiscount", locale)}</span>
              <input
                type="number"
                value={manualDiscount || ""}
                onChange={(e) => setManualDiscount(Number(e.target.value))}
                className="w-20 text-right rounded border px-1 py-0.5 text-xs"
                placeholder="0"
              />
            </div>
            <div className="flex justify-between font-bold text-sm border-t pt-1">
              <span>{t("pos.total", locale)}</span><span>{fmtMoney(total, locale)}</span>
            </div>
          </div>

          <Input
            placeholder={t("pos.paidAmount", locale)}
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            className="text-xs"
          />

          {due > 0 && (
            <p className="text-xs text-amber-600">{translateWithVars(t("pos.dueAmount", locale), { a: fmtMoney(due, locale) })}</p>
          )}

          <textarea
            placeholder={t("pos.notes", locale)}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded border px-2 py-1 text-xs resize-none"
            rows={2}
          />

          <Button
            onClick={handleConfirm}
            disabled={cart.length === 0 || submitting}
            className="w-full"
          >
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileText className="size-4 mr-2" />}
            {t("pos.placeOrder", locale)}
          </Button>
        </div>
      </div>
    </div>
  );
}

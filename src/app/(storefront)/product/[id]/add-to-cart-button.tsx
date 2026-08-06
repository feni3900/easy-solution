"use client";

import { useState } from "react";
import { ShoppingCart, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

export function AddToCartButton({
  productId,
  productName,
  price,
  inStock,
  locale,
}: {
  productId: number;
  productName: string;
  price: number;
  inStock: boolean;
  locale: Locale;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item: { productId: number }) => item.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, productName, price, quantity });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-12 text-center font-medium">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(quantity + 1)}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleAdd}
          disabled={!inStock}
          className="flex-1"
        >
          {added ? (
            <>
              <Check className="size-4 mr-2" />
              {t("store.product.added", locale)}
            </>
          ) : (
            <>
              <ShoppingCart className="size-4 mr-2" />
              {t("store.product.addToCart", locale)}
            </>
          )}
        </Button>
        <Link href="/cart" className="flex-1">
          <Button variant="outline" className="w-full">
            {t("store.product.viewCart", locale)}
          </Button>
        </Link>
      </div>
    </div>
  );
}

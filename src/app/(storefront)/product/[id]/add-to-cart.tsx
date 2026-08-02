"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { getCart, saveCart } from "@/app/cart/cart-storage";

export function AddToCart({
  productId,
  name,
  price,
  image,
  comingSoon = false,
}: {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  comingSoon?: boolean;
}) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const add = () => {
    const cart = getCart();
    const existing = cart.find((c) => c.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ productId, name, price, image, quantity: 1 });
    }
    saveCart(cart);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="lg" onClick={add} disabled={added || comingSoon}>
        <ShoppingCart className="size-4" />
        {comingSoon ? "Coming Soon" : added ? "Added!" : "Add to Cart"}
      </Button>
      <Button size="lg" variant="outline" onClick={() => router.push("/cart")}>
        View Cart
      </Button>
    </div>
  );
}

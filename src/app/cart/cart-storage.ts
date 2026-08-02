"use client";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

const CART_KEY = "store_cart";

export function getCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]") as CartLine[];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartLine[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function bulkDiscountPct(quantity: number): number {
  if (quantity >= 24) return 15;
  if (quantity >= 12) return 10;
  if (quantity >= 6) return 5;
  return 0;
}

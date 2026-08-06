"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Store, LogOut, User as UserIcon, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function StorefrontHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setChecked(true);
    });

    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    };

    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);
    return () => {
      window.removeEventListener("cart-updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Store className="size-6 text-primary" />
          <span className="leading-tight">
            <span className="block text-sm font-semibold">Maruf Enterprise</span>
            <span className="block text-sm font-semibold">Feni Garden City</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm hover:text-foreground">Home</Link>
          <Link href="/shop" className="text-sm hover:text-foreground">Shop</Link>
          <Link href="/about" className="text-sm hover:text-foreground">About</Link>
          <Link href="/contact" className="text-sm hover:text-foreground">Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          <a href="tel:+8801831579666" className="hidden items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary sm:flex" title="Call +88 01831579666">
            <Phone className="size-4 text-primary" />
            +88 01831579666
          </a>
          <a
            href="https://wa.me/8801831579666"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary sm:flex"
            title="WhatsApp"
          >
            <MessageCircle className="size-4 text-primary" />
            WhatsApp
          </a>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>
          </Link>
          {checked && (
            loggedIn ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline">Admin</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <UserIcon className="size-4 mr-1" /> Login
                </Button>
              </Link>
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t md:hidden">
          <nav className="flex flex-col p-4 space-y-2">
            <Link href="/" onClick={() => setMobileOpen(false)} className="text-sm py-2 hover:text-foreground">Home</Link>
            <Link href="/shop" onClick={() => setMobileOpen(false)} className="text-sm py-2 hover:text-foreground">Shop</Link>
            <Link href="/about" onClick={() => setMobileOpen(false)} className="text-sm py-2 hover:text-foreground">About</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="text-sm py-2 hover:text-foreground">Contact</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

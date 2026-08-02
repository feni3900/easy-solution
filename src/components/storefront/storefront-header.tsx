"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ShoppingCart, Store, LayoutDashboard, LogIn, Loader2 } from "lucide-react";
import { getCart } from "@/app/cart/cart-storage";
import type { StoreBranch } from "@/lib/store";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

const FLAGS: Record<string, { flag: string; label: string }> = {
  Bangladesh: { flag: "🇧🇩", label: "Bangladesh" },
  Greece: { flag: "🇬🇷", label: "Greece" },
};

export function StorefrontHeader({
  user,
  branches,
  active,
}: {
  user: { id: string } | null;
  branches: StoreBranch[];
  active: StoreBranch;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const update = () => setCount(getCart().reduce((s, c) => s + c.quantity, 0));
    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  const switchStore = async (branchId: string) => {
    if (branchId === active.id) return;
    setSwitching(true);
    try {
      await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId }),
      });
      router.refresh();
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store className="size-4" />
          </div>
          <span>{active.shopName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border p-1" role="group" aria-label="Select store">
            {branches.map((b) => {
              const f = FLAGS[b.country] ?? { flag: "🏳️", label: b.shopName };
              const isActive = b.id === active.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => switchStore(b.id)}
                  disabled={switching}
                  title={`${b.shopName} (${f.label})`}
                  aria-pressed={isActive}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span aria-hidden>{f.flag}</span>
                  <span className="hidden sm:inline">{b.shopName}</span>
                </button>
              );
            })}
            {switching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>

          <Link
            href="/cart"
            className="relative flex size-9 items-center justify-center rounded-lg border transition-colors hover:bg-muted"
            aria-label="Cart"
          >
            <ShoppingCart className="size-4" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          {user ? (
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:flex"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:flex"
            >
              <LogIn className="size-4" />
              Login
            </Link>
          )}

          <button
            className="flex size-9 items-center justify-center rounded-lg border md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 rounded-full border p-1" role="group" aria-label="Select store">
              {branches.map((b) => {
                const f = FLAGS[b.country] ?? { flag: "🏳️", label: b.shopName };
                const isActive = b.id === active.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => switchStore(b.id)}
                    disabled={switching}
                    aria-pressed={isActive}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    <span aria-hidden>{f.flag}</span>
                    <span>{b.shopName}</span>
                  </button>
                );
              })}
            </div>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

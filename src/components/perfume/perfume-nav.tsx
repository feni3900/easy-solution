"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { LayoutDashboard, Package, FlaskConical, Beaker, Lock, Boxes, PackagePlus, ChevronDown, ShoppingCart, BadgeDollarSign } from "lucide-react";

const LINKS = [
  { href: "/perfume", label: "Dashboard", icon: LayoutDashboard },
  { href: "/perfume/ingredients", label: "Ingredients", icon: Beaker },
  { href: "/perfume/bottles", label: "Bottles", icon: PackagePlus },
  { href: "/perfume/recipes", label: "Recipes (BOM)", icon: FlaskConical },
  { href: "/perfume/production", label: "Production", icon: Package },
  { href: "/perfume/stock", label: "Stock", icon: Boxes },
  { href: "/perfume/settings", label: "Settings", icon: Lock },
];

const INVENTORY_LINKS = [
  { href: "/perfume/inventory/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/perfume/inventory/sales", label: "Sales", icon: BadgeDollarSign },
];

export function PerfumeNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLock = async () => {
    await fetch("/api/perfume/lock", { method: "POST" });
    router.push("/perfume/login");
    router.refresh();
  };

  const invActive = pathname.startsWith("/perfume/inventory");

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-1">
        {LINKS.map((l) => {
          const Icon = l.icon;
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {l.label}
            </Link>
          );
        })}

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              invActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Boxes className="size-4" />
            Inventory
            <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border bg-popover p-1 shadow-lg">
              {INVENTORY_LINKS.map((l) => {
                const Icon = l.icon;
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {l.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={handleLock}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Lock className="size-4" /> Lock
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Package, FlaskConical, Beaker, Lock, Boxes, PackagePlus } from "lucide-react";

const LINKS = [
  { href: "/perfume", label: "Dashboard", icon: LayoutDashboard },
  { href: "/perfume/ingredients", label: "Ingredients", icon: Beaker },
  { href: "/perfume/bottles", label: "Bottles", icon: PackagePlus },
  { href: "/perfume/recipes", label: "Recipes (BOM)", icon: FlaskConical },
  { href: "/perfume/production", label: "Production", icon: Package },
  { href: "/perfume/stock", label: "Stock", icon: Boxes },
  { href: "/perfume/settings", label: "Settings", icon: Lock },
];

export function PerfumeNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLock = async () => {
    await fetch("/api/perfume/lock", { method: "POST" });
    router.push("/perfume/login");
    router.refresh();
  };

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
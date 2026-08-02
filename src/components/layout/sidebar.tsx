"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  Contact,
  Factory,
  Wallet,
  BarChart3,
  Globe,
  Settings,
  ChevronDown,
  Store,
  Image,
} from "lucide-react";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  Contact,
  Factory,
  Wallet,
  BarChart3,
  Globe,
  Settings,
  Image,
};

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = iconMap[item.icon] ?? Package;
  const isActive = pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    const childActive = item.children!.some((c) => pathname.startsWith(c.href));
    return (
      <details open={childActive} className="group/nav">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <span className="flex items-center gap-3">
            <Icon className="size-4 shrink-0" />
            {item.title}
          </span>
          <ChevronDown className="size-4 shrink-0 transition-transform group-open/nav:rotate-180" />
        </summary>
        <div className="mt-1 space-y-1 pl-10">
          {item.children!.map((child) => {
            const active = pathname === child.href || pathname.startsWith(child.href + "/");
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {child.title}
              </Link>
            );
          })}
        </div>
      </details>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.title}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Store className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Smart Solution ERP</p>
          <p className="text-xs text-muted-foreground">Inventory &amp; Commerce</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </nav>
      <div className="border-t p-3 text-xs text-muted-foreground">
        v1.0.0 · Smart Solution ERP
      </div>
    </aside>
  );
}

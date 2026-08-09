"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Monitor,
  Package,
  Truck,
  ShoppingCart,
  Users,
  BarChart3,
  Globe,
  Shield,
  ChevronDown,
  ChevronRight,
  Store,
  X,
  Image,
  BookOpen,
  ListPlus,
  FlaskConical,
} from "lucide-react";
import { NAV_ITEMS, type NavItem, type NavChild } from "@/lib/constants";
import { getClientLocale, t, type Locale } from "@/lib/i18n";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Monitor,
  Package,
  Truck,
  ShoppingCart,
  Users,
  BarChart3,
  Globe,
  Shield,
  Image,
  BookOpen,
  ListPlus,
  FlaskConical,
};

function NavChildLink({
  child,
  pathname,
  depth,
  onClose,
  locale,
}: {
  child: NavChild;
  pathname: string;
  depth: number;
  onClose?: () => void;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const isActive = pathname === child.href;
  const hasChildren = child.children && child.children.length > 0;
  const label = t(child.titleKey, locale);

  if (!hasChildren) {
    return (
      <Link
        href={child.href}
        onClick={onClose}
        className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
          isActive || open
            ? "text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <span className="flex-1 text-left">{label}</span>
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          {child.children!.map((sub) => (
            <NavChildLink
              key={sub.href}
              child={sub}
              pathname={pathname}
              depth={depth + 1}
              onClose={onClose}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavItemComponent({
  item,
  pathname,
  onClose,
  locale,
}: {
  item: NavItem;
  pathname: string;
  onClose?: () => void;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const Icon = iconMap[item.icon] || Package;
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const hasChildren = item.children && item.children.length > 0;
  const label = t(item.titleKey, locale);

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavChildLink
              key={child.href}
              child={child}
              pathname={pathname}
              depth={0}
              onClose={onClose}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const locale = getClientLocale();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            <span className="text-lg font-semibold">{t("common.brand", locale)}</span>
          </Link>
          {onClose && (
            <button onClick={onClose} className="lg:hidden">
              <X className="size-5" />
            </button>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              pathname={pathname}
              onClose={onClose}
              locale={locale}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

"use client";

import { Menu, Bell, User, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { getClientLocale, t } from "@/lib/i18n";

export function Header({
  user,
  onMenuClick,
}: {
  user: { full_name: string; role: string };
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = getClientLocale();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4">
      {onMenuClick && (
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="size-5" />
        </Button>
      )}
      <div className="flex-1" />
      <LanguageToggle />
      <a href="/" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm">
          <ExternalLink className="size-4 mr-1" />
          {t("header.viewWebsite", locale)}
        </Button>
      </a>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="size-5" />
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
          0
        </span>
      </Button>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted cursor-pointer"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-4" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-popover p-1 shadow-md z-50">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{t("header.myAccount", locale)}</p>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
            >
              <LogOut className="size-4" />
              {t("header.signOut", locale)}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

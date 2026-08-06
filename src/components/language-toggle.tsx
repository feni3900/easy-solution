"use client";

import { getClientLocale } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const locale = getClientLocale();

  const toggle = async () => {
    const next = locale === "bn" ? "en" : "bn";
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={locale === "bn" ? "Switch to English" : "বাংলায় স্যুইচ করুন"}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted cursor-pointer ${className}`}
    >
      <Languages className="size-4" />
      {locale === "bn" ? "EN" : "বাংলা"}
    </button>
  );
}

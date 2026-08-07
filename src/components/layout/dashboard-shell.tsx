"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { getClientLocale, t } from "@/lib/i18n";

export function DashboardShell({
  user,
  children,
}: {
  user: { full_name: string; role: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const locale = getClientLocale();
  const isGuest = user.role === "Guest";

  return (
    <>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        {isGuest && (
          <div className="border-b bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800">
            {t("app.guestBanner", locale)}
          </div>
        )}
        <Header user={user} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </>
  );
}

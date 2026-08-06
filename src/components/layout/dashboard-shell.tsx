"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function DashboardShell({
  user,
  children,
}: {
  user: { full_name: string; role: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header user={user} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </>
  );
}

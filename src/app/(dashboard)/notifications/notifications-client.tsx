"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

const typeColors: Record<string, string> = {
  low_stock: "bg-red-500/10 text-red-600",
  payment: "bg-emerald-500/10 text-emerald-600",
  supplier_due: "bg-orange-500/10 text-orange-600",
  new_order: "bg-blue-500/10 text-blue-600",
  purchase_received: "bg-violet-500/10 text-violet-600",
};

export function NotificationsClient({ notifications, locale }: { notifications: Notification[]; locale: Locale }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  const markAllRead = async () => {
    setWorking(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    }
    setWorking(false);
    router.refresh();
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border py-16 text-muted-foreground">
        <Bell className="size-8" />
        <p className="text-sm">{t("notifications.empty", locale)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={working}>
          <CheckCheck className="size-4" />
          {t("notifications.markAllRead", locale)}
        </Button>
      </div>
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
              n.is_read ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <Badge className={`${typeColors[n.type] ?? ""} border-0 capitalize`}>
                {n.type.replace("_", " ")}
              </Badge>
              <div>
                <p className="text-sm font-medium">{n.title}</p>
                {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            {!n.is_read && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

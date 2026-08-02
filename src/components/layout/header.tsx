"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user: { full_name: string; role: string } | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id")
        .eq("is_read", false)
        .limit(100);
      setUnread(data?.length ?? 0);
    };
    load();
  }, [pathname]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Menu className="size-5" />
      </Button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) router.push(`/search?q=${encodeURIComponent(query)}`);
        }}
        className="relative hidden max-w-sm flex-1 md:block"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Global search..."
          className="pl-9"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" title="Ecommerce store" nativeButton={false} render={<Link href="/" />}>
          <Globe className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Notifications" nativeButton={false} render={<Link href="/notifications" />}>
          <Bell className="size-4" />
          {unread > 0 && (
            <Badge className="absolute -right-1 -top-1 size-4 p-0 text-[10px]">
              {unread > 9 ? "9+" : unread}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="gap-2 px-2" />}
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="size-4" />
            </div>
            <span className="hidden text-sm sm:block">
              {user?.full_name ?? "User"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.full_name ?? "User"}</span>
                  <span className="text-xs font-normal capitalize text-muted-foreground">
                    {user?.role?.replace("_", " ") ?? "role"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/settings" />}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/notifications" />}>
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

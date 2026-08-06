import Link from "next/link";
import { requireProfile } from "@/lib/auth";

const quickLinks = [
  { href: "/inventory/products", label: "Inventory → Products", description: "add products" },
  { href: "/pos", label: "POS Terminal", description: "start selling" },
  { href: "/web-store/settings", label: "Web Store → Settings", description: "configure your store" },
  { href: "/admin/users", label: "Admin → Users", description: "manage user accounts" },
];

export default async function DashboardPage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {profile.full_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Dashboard loaded successfully. Navigation is in the sidebar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Your Role</p>
          <p className="text-lg font-bold">{profile.roles_permissions?.role_name ?? "N/A"}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Username</p>
          <p className="text-lg font-bold">{profile.username}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Nickname</p>
          <p className="text-lg font-bold">{profile.salesperson_nickname}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-lg font-bold text-green-600">Active</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-base font-medium mb-2">Quick Start</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {quickLinks.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:text-primary hover:underline">
                Go to <strong>{item.label}</strong> to {item.description}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

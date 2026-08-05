import { requireProfile } from "@/lib/auth";

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
          <li>• Go to <strong>Inventory → Products</strong> to add products</li>
          <li>• Go to <strong>POS Terminal</strong> to start selling</li>
          <li>• Go to <strong>Web Store → Settings</strong> to configure your store</li>
          <li>• Go to <strong>Admin → Users</strong> to manage user accounts</li>
        </ul>
      </div>
    </div>
  );
}

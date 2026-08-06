import { requireProfile } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardShell
        user={{
          full_name: profile.full_name,
          role: profile.roles_permissions?.role_name ?? "",
        }}
      >
        {children}
      </DashboardShell>
    </div>
  );
}

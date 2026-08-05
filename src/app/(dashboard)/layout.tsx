import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { requireProfile } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header
          user={{
            full_name: profile.full_name,
            role: profile.roles_permissions?.role_name ?? "",
          }}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

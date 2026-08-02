import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PosClient } from "./pos-client";

export const metadata = { title: "POS | Smart Solution ERP" };

export default async function PosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: customers }, { data: branches }, { data: profile }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, name, mobile")
        .eq("status", "active")
        .order("name"),
      supabase.from("branches").select("id, name").eq("status", "active").order("name"),
      supabase
        .from("users")
        .select("id, full_name")
        .eq("id", user?.id ?? "")
        .single(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Point of Sale" description="Quick cash/credit sales" />
      <PosClient
        customers={customers ?? []}
        branches={branches ?? []}
        currentUserId={profile?.id ?? null}
      />
    </div>
  );
}

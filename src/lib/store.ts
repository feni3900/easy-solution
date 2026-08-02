import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface StoreBranch {
  id: string;
  name: string;
  country: string;
  shopName: string;
}

const SHOP_NAME_SUFFIX = " - Main Branch";

export async function getStoreContext(): Promise<{
  branches: StoreBranch[];
  active: StoreBranch;
}> {
  const cookieStore = await cookies();
  const supabase = await createClient();

  const { data } = await supabase
    .from("branches")
    .select("id, name, country")
    .eq("status", "active")
    .order("created_at");

  const branches = (data ?? []).map((b) => ({
    ...b,
    shopName: b.name.replace(SHOP_NAME_SUFFIX, ""),
  }));

  const stored = cookieStore.get("store_branch")?.value;
  const fromCookie = branches.find((b) => b.id === stored);
  const defaultBranch = branches.find((b) => b.country === "Bangladesh") ?? branches[0];
  const active = fromCookie ?? defaultBranch ?? {
    id: "",
    name: "Store",
    country: "",
    shopName: "Store",
  };

  return { branches, active };
}

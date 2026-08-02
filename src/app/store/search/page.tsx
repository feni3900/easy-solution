import { redirect } from "next/navigation";

export default async function OldStoreSearch({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  redirect(`/shop?q=${encodeURIComponent(q ?? "")}`);
}

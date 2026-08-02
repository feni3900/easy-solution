import { redirect } from "next/navigation";

export default async function OldStoreProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/product/${id}`);
}

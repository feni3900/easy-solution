import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { GalleryClient } from "./gallery-client";

export const metadata = { title: "Image Gallery | Smart Solution ERP" };

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data: images } = await supabase
    .from("image_gallery")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Image Gallery" description="Saved images used in purchases and products" />
      <GalleryClient initialImages={images ?? []} />
    </div>
  );
}
